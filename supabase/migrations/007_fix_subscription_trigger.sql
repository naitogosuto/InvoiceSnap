-- Migration 007: Endurecer prevent_subscription_tampering
-- 1. Comparación NULL-safe del role (evita bypass cuando request.jwt.claim.role está ausente)
-- 2. Fija search_path para evitar hijacking de funciones en funciones SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.prevent_subscription_tampering()
RETURNS trigger AS $$
BEGIN
  IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR
      NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at OR
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id) THEN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Cannot modify subscription status directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS check_subscription_update ON public.profiles;
CREATE TRIGGER check_subscription_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_tampering();
