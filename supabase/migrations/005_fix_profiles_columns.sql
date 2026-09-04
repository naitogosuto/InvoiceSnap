-- =============================================================
-- Añade columnas faltantes a profiles (para quien ya creó la tabla
-- con la migración original que no las incluía)
-- =============================================================
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS iae_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_vat_rate DECIMAL(5,2) DEFAULT 21.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_irpf_rate DECIMAL(5,2) DEFAULT 15.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_new_autonomo BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS autonomo_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'FACT';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_format TEXT DEFAULT 'PREFIX-YYYY-NNN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_invoice_number INTEGER DEFAULT 1;

-- También arreglamos la política UPDATE de profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
