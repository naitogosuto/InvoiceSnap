CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  rectifies_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'rectificativa')),
  rectification_reason TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_vat DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_irpf DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_method TEXT DEFAULT 'transferencia',
  pdf_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval TEXT,
  next_recurrence_date DATE,
  sender_snapshot JSONB,
  client_snapshot JSONB,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice lines
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 21.00,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  irpf_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  irpf_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

-- Invoices policies
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

-- Invoice lines policies (subconsulta para verificar ownership a través de invoices)
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

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
