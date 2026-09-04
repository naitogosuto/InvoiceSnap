-- =============================================================
-- FIX: Reemplazar políticas FOR ALL por políticas explícitas
-- =============================================================
-- Ejecuta esto en el SQL Editor de Supabase
-- (es seguro ejecutarlo aunque las políticas ya existan)

---------- CLIENTS ----------
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

---------- INVOICES ----------
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

---------- INVOICE LINES ----------
DROP POLICY IF EXISTS "Users can manage own invoice lines" ON invoice_lines;

CREATE POLICY "Users can view own invoice_lines"
  ON invoice_lines FOR SELECT
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own invoice_lines"
  ON invoice_lines FOR INSERT
  WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own invoice_lines"
  ON invoice_lines FOR UPDATE
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own invoice_lines"
  ON invoice_lines FOR DELETE
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

---------- PRODUCTS ----------
DROP POLICY IF EXISTS "Users can manage own products" ON products;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);
