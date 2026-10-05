-- Migration 009: Rol de administrador que se comporta como Pro
-- 1. Añade la columna is_admin
-- 2. La protege para que un usuario no pueda auto-elevarse (mismo trigger que subscription_tier)
-- 3. Los límites del plan gratuito tratan a los admins como Pro (sin límites)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Proteger is_admin igual que los campos de suscripción
CREATE OR REPLACE FUNCTION public.prevent_subscription_tampering()
RETURNS trigger AS $$
BEGIN
  IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR
      NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at OR
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
      NEW.is_admin IS DISTINCT FROM OLD.is_admin) THEN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Cannot modify subscription or admin status directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS check_subscription_update ON public.profiles;
CREATE TRIGGER check_subscription_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_tampering();

-- Límite de clientes: admin = ilimitado
CREATE OR REPLACE FUNCTION public.enforce_free_client_limit()
RETURNS trigger AS $$
DECLARE
  is_unlimited boolean;
BEGIN
  SELECT (subscription_tier = 'pro' OR is_admin) INTO is_unlimited
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF COALESCE(is_unlimited, false) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.clients WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Límite de clientes alcanzado en el plan gratuito (máximo 10)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS enforce_client_limit ON public.clients;
CREATE TRIGGER enforce_client_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_client_limit();

-- Límite de facturas: admin = ilimitado
CREATE OR REPLACE FUNCTION public.enforce_free_invoice_limit()
RETURNS trigger AS $$
DECLARE
  is_unlimited boolean;
BEGIN
  SELECT (subscription_tier = 'pro' OR is_admin) INTO is_unlimited
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF COALESCE(is_unlimited, false) THEN
    RETURN NEW;
  END IF;

  IF (SELECT count(*) FROM public.invoices
      WHERE user_id = NEW.user_id
        AND created_at >= date_trunc('month', now())) >= 5 THEN
    RAISE EXCEPTION 'Límite mensual de facturas alcanzado en el plan gratuito (máximo 5)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS enforce_invoice_limit ON public.invoices;
CREATE TRIGGER enforce_invoice_limit
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_invoice_limit();
