CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_type TEXT DEFAULT 'hora' CHECK (unit_type IN ('hora', 'unidad', 'proyecto', 'mes', 'dia')),
  vat_rate DECIMAL(5,2) DEFAULT 21.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
