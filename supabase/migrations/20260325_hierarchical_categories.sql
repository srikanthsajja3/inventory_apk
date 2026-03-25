-- 1. Add parent_id to categories for nesting
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- 2. Clear out any existing items/categories to avoid SKU/name conflicts during testing (Optional)
-- DELETE FROM items;
-- DELETE FROM categories;

-- 3. Insert some default root categories
INSERT INTO categories (name, parent_id) 
VALUES ('Electronics', NULL), ('Tools', NULL), ('Office Supplies', NULL)
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS on categories (if not already)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Policies for categories
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write categories" ON categories;
CREATE POLICY "Allow public write categories" ON categories FOR ALL USING (true);
