-- Migration to add 'cashier' and 'inventory' roles to app_users table check constraint

-- 1. Drop existing constraint if it exists (automatically named by Postgres or explicitly defined)
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Add the new constraint allowing cashier and inventory roles
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin', 'staff', 'cashier', 'inventory'));
