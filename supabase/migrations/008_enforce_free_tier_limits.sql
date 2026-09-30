-- Migration 008: Enforce free tier limits server-side
-- Límites del plan gratuito: 10 clientes y 5 facturas/mes.
-- Los triggers impiden superar el límite incluso llamando directamente a PostgREST.

-- Clientes: máximo 10 en plan gratuito
CREATE OR REPLACE FUNCTION public.enforce_free_client_limit()
RETURNS trigger AS $$
DECLARE
  is_pro boolean;
  client_count integer;
BEGIN
  SELECT (subscription_tier = 'pro') INTO is_pro
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF COALESCE(is_pro, false) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO client_count
  FROM public.clients
  WHERE user_id = NEW.user_id;

  IF client_count >= 10 THEN
    RAISE EXCEPTION 'Límite de clientes alcanzado en el plan gratuito (máximo 10)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS enforce_client_limit ON public.clients;
CREATE TRIGGER enforce_client_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_client_limit();

-- Facturas: máximo 5 al mes en plan gratuito (basado en created_at)
CREATE OR REPLACE FUNCTION public.enforce_free_invoice_limit()
RETURNS trigger AS $$
DECLARE
  is_pro boolean;
  invoice_count integer;
BEGIN
  SELECT (subscription_tier = 'pro') INTO is_pro
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF COALESCE(is_pro, false) THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO invoice_count
  FROM public.invoices
  WHERE user_id = NEW.user_id
    AND created_at >= date_trunc('month', now());

  IF invoice_count >= 5 THEN
    RAISE EXCEPTION 'Límite mensual de facturas alcanzado en el plan gratuito (máximo 5)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS enforce_invoice_limit ON public.invoices;
CREATE TRIGGER enforce_invoice_limit
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_invoice_limit();
