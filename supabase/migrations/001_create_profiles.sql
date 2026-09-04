-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  nif TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  province TEXT,
  email TEXT,
  phone TEXT,
  iae_code TEXT,
  logo_url TEXT,
  signature_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  invoice_prefix TEXT DEFAULT 'FACT',
  invoice_format TEXT DEFAULT 'PREFIX-YYYY-NNN',
  next_invoice_number INTEGER DEFAULT 1,
  default_vat_rate DECIMAL(5,2) DEFAULT 21.00,
  default_irpf_rate DECIMAL(5,2) DEFAULT 15.00,
  is_new_autonomo BOOLEAN DEFAULT FALSE,
  autonomo_start_date DATE,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  subscription_ends_at TIMESTAMPTZ,
  bank_iban TEXT,
  payment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
