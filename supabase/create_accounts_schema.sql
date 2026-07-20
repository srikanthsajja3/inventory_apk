-- ==========================================
-- ACCOUNTS & LEDGER SETUP FOR ERP
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Create Accounts Ledger Table
CREATE TABLE IF NOT EXISTS accounts_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE DEFAULT CURRENT_DATE NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('INFLOW', 'OUTFLOW')) NOT NULL,
  category TEXT NOT NULL, -- 'Sale', 'Purchase', 'Labour', 'Salary', 'Rent', 'Office Expense', 'Owner Capital', 'Advance', 'Others'
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI/Bank', 'Card', 'Gold Exchange')) DEFAULT 'Cash' NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  gold_weight_g NUMERIC(10, 3) DEFAULT 0 NOT NULL, -- weight in grams (for gold accounts)
  recorded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Add Payment & Customer columns to sales table if they don't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE accounts_ledger ENABLE ROW LEVEL SECURITY;

-- 4. Create Public (Anon) Policies for ALL operations (compatible with existing setup)
DROP POLICY IF EXISTS "Public access to accounts_ledger" ON accounts_ledger;
CREATE POLICY "Public access to accounts_ledger" ON accounts_ledger FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to accounts_ledger_authenticated" ON accounts_ledger;
CREATE POLICY "Public access to accounts_ledger_authenticated" ON accounts_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);
