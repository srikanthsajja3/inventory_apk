-- ==========================================
-- ENHANCED ACTIVITY LOGGING (AUDIT TRAIL)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Update transactions table to include the user who made the change
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS previous_data JSONB,
ADD COLUMN IF NOT EXISTS new_data JSONB;

-- 2. Create a function to automatically log changes
CREATE OR REPLACE FUNCTION log_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transactions (
        item_id, 
        type, 
        quantity_changed, 
        reason, 
        user_id, 
        previous_data, 
        new_data
    )
    VALUES (
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'IN'
            WHEN TG_OP = 'DELETE' THEN 'OUT'
            ELSE 'ADJUSTMENT'
        END,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN NEW.quantity - OLD.quantity
            WHEN TG_OP = 'INSERT' THEN NEW.quantity
            ELSE -OLD.quantity
        END,
        'System Auto-Log: ' || TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to the items table
DROP TRIGGER IF EXISTS tr_log_item_changes ON items;
CREATE TRIGGER tr_log_item_changes
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW EXECUTE FUNCTION log_item_changes();

-- 4. Ensure RLS allows reading logs
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read transactions" ON transactions;
CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
