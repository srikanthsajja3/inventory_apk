-- ==========================================
-- STAFF & SALES ENHANCEMENT MIGRATION
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Profit/Loss and Staff tracking to Sales
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS prc_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_loss NUMERIC(10, 2) DEFAULT 0;

-- 3. Add prc_amount to Items (Total Purchase Amount for the business)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS prc_amount NUMERIC(10, 2) DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employees;
CREATE POLICY "Allow public access to employees" ON employees
    FOR ALL USING (true);

-- 6. Initial Staff Seed (Optional)
INSERT INTO employees (name) VALUES ('ADMIN'), ('STAFF 1')
ON CONFLICT (name) DO NOTHING;
