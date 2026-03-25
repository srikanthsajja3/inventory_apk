-- 1. Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Items Table (Inventory)
CREATE TABLE items (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Transactions Table (Stock History)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')) NOT NULL,
  quantity_changed INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Public access for now - as per project start)
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public write categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow public read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public write items" ON items FOR ALL USING (true);

CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public write transactions" ON transactions FOR ALL USING (true);

-- 6. Storage Buckets (Images)
-- Note: Buckets are usually created via Supabase Dashboard or API, 
-- but we define the policy here if they exist.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);
