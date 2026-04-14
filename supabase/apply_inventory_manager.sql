-- ==========================================
-- UPDATED SETUP SCRIPT FOR INVENTORY-MANAGER
-- Run this in the Supabase SQL Editor of 'inventory-manager'
-- ==========================================

-- 1. Tables
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  quantity INTEGER DEFAULT 0 NOT NULL,
  unit TEXT DEFAULT 'pcs',
  location TEXT,
  image_url TEXT,
  min_stock_level INTEGER DEFAULT 0,
  cost_price NUMERIC(10, 2),
  supplier_name TEXT,
  supplier_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')) NOT NULL,
  quantity_changed INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff' NOT NULL,
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Staff View
CREATE OR REPLACE VIEW staff_items AS
SELECT id, name, sku, barcode, description, category_id, quantity, unit, location, image_url, min_stock_level, created_at, updated_at
FROM items;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Categories
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write categories" ON categories;
CREATE POLICY "Allow public write categories" ON categories FOR ALL USING (true);

-- Items
DROP POLICY IF EXISTS "Admins have full access to items" ON items;
CREATE POLICY "Admins have full access to items" ON items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Staff can read items" ON items;
CREATE POLICY "Staff can read items" ON items
  FOR SELECT TO authenticated
  USING (true);

-- Transactions
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "No manual insert" ON public.profiles;
CREATE POLICY "No manual insert"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- 5. Functions & Triggers

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- General updated_at for other tables
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_items_modtime ON items;
CREATE TRIGGER update_items_modtime
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 6. Initial Seed
INSERT INTO categories (name) VALUES ('Electronics'), ('Tools'), ('Office Supplies')
ON CONFLICT (name) DO NOTHING;
