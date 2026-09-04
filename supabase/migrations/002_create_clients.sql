CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_name TEXT,
  nif_cif TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  province TEXT,
  country TEXT DEFAULT 'España',
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_eu_intracom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas explícitas por operación (necesario en PostgreSQL para INSERT con WITH CHECK)
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

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
