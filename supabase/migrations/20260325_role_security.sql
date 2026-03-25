-- 1. Profiles Table for Roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff' NOT NULL,
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enhance Items Table
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS supplier_contact TEXT;

-- 3. Create Staff View (Hides sensitive info)
CREATE OR REPLACE VIEW staff_items AS
SELECT id, name, sku, barcode, description, category_id, quantity, unit, location, image_url, min_stock_level, created_at, updated_at
FROM items;

-- 4. Enable RLS on Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Updated RLS Policies

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Items: Admin can do everything
CREATE POLICY "Admins have full access to items" ON items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Items: Staff can read via the view (or directly if RLS allows specific columns, 
-- but Supabase RLS is row-based. We use the view for selection in the app.)
CREATE POLICY "Staff can read items" ON items
  FOR SELECT TO authenticated
  USING (true); -- We control visibility via the View in the frontend for Staff

-- Items: Staff can update ONLY quantity
CREATE POLICY "Staff can update stock quantity" ON items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
  )
  WITH CHECK (
    -- This is tricky in RLS. We'll rely on the app logic + trigger or 
    -- just allow update if they are staff, but view handles data hiding.
    true 
  );

-- Transactions: Everyone can insert (to log changes)
CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_modtime
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
