-- ==========================================
-- FIX FOR UPLOAD ISSUES: DISABLE RLS RESTRICTIONS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Items Table: Allow public access
DROP POLICY IF EXISTS "Admins have full access to items" ON items;
DROP POLICY IF EXISTS "Staff can read items" ON items;
DROP POLICY IF EXISTS "Allow public insert items" ON items;
DROP POLICY IF EXISTS "Allow public update items" ON items;

CREATE POLICY "Allow public select items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public insert items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update items" ON items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete items" ON items FOR DELETE USING (true);

-- 2. Categories Table: Allow public access
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
DROP POLICY IF EXISTS "Allow public write categories" ON categories;

CREATE POLICY "Allow public select categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete categories" ON categories FOR DELETE USING (true);

-- 3. Ensure RLS is still on but policies are open (or you can just disable RLS)
-- ALTER TABLE items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
