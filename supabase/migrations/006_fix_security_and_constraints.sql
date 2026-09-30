-- Migration 006: Fix security vulnerabilities, add unique constraints, foreign keys, and indexes

-- 1. Unique invoice number per user (AEAT compliance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_invoice_number ON public.invoices(user_id, invoice_number);

-- 2. Performance indexes for user lookup
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- 3. Foreign key on invoice_lines.product_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_invoice_lines_product'
  ) THEN
    ALTER TABLE public.invoice_lines
      ADD CONSTRAINT fk_invoice_lines_product
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Prevent users from self-upgrading subscription_tier via client API
CREATE OR REPLACE FUNCTION public.prevent_subscription_tampering()
RETURNS trigger AS $$
BEGIN
  IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier OR
      NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at OR
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id) THEN
    IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
      RAISE EXCEPTION 'Cannot modify subscription status directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_subscription_update ON public.profiles;
CREATE TRIGGER check_subscription_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_tampering();

-- 5. Harden handle_new_user search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Add WITH CHECK (auth.uid() = user_id) on UPDATE policies for clients, invoices, products
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoice lines" ON public.invoice_lines;
CREATE POLICY "Users can update own invoice lines"
  ON public.invoice_lines FOR UPDATE
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid()));
