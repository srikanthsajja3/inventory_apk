-- ==========================================
-- CREATE APP_USERS TABLE FOR INVENTORY-MANAGER
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.app_users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create Public (Anon) Policy for ALL operations 
-- (Matches the "Public access" pattern used in FIX_RLS_POLICIES.sql)
DROP POLICY IF EXISTS "Public access to app_users" ON public.app_users;
CREATE POLICY "Public access to app_users" ON public.app_users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Insert Default Users
INSERT INTO public.app_users (username, password, role, is_active)
VALUES 
('ADMIN', 'ADMIN123', 'admin', true),
('STAFF1', 'STAFF123', 'staff', true)
ON CONFLICT (username) DO NOTHING;
