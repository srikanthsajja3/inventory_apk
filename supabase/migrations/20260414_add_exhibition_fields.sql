-- Add exhibition fields to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS in_exhibition BOOLEAN DEFAULT FALSE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS exhibition_added_at TIMESTAMPTZ;

-- Create an index for faster querying
CREATE INDEX IF NOT EXISTS idx_items_in_exhibition ON items(in_exhibition) WHERE in_exhibition = TRUE;
