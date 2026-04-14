-- RUN THIS IN SUPABASE SQL EDITOR TO FIX DATA UPDATES
-- This allows our mock login system to bypass official Supabase Auth RLS

-- 0. Remove the restricted view that was hiding columns
DROP VIEW IF EXISTS staff_items;

-- 1. Enable RLS on all tables
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stone_master ENABLE ROW LEVEL SECURITY;

-- 2. Create Public (Anon) Policies for ALL operations
-- Items
DROP POLICY IF EXISTS "Public access to items" ON items;
DROP POLICY IF EXISTS "Admins have full access to items" ON items;
DROP POLICY IF EXISTS "Staff can read items" ON items;
CREATE POLICY "Public access to items" ON items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "Public access to transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
CREATE POLICY "Public access to transactions" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Categories
DROP POLICY IF EXISTS "Public access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
DROP POLICY IF EXISTS "Allow public write categories" ON categories;
CREATE POLICY "Public access to categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Public access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Public access to profiles" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);

-- Master Rates
DROP POLICY IF EXISTS "Public access to master_rates" ON master_rates;
CREATE POLICY "Public access to master_rates" ON master_rates FOR ALL TO anon USING (true) WITH CHECK (true);

-- Stone Master
DROP POLICY IF EXISTS "Public access to stone_master" ON stone_master;
CREATE POLICY "Public access to stone_master" ON stone_master FOR ALL TO anon USING (true) WITH CHECK (true);
