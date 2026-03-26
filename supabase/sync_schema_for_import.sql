-- ==========================================
-- SCHEMA SYNC FOR JEWELRY IMPORT
-- Run this in your Supabase SQL Editor to ensure all columns exist
-- ==========================================

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS label_no TEXT,
ADD COLUMN IF NOT EXISTS pcs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purity TEXT,
ADD COLUMN IF NOT EXISTS gross_wt NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_wt NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dai_wt NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dai_pcs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clr_stone_wt NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS clr_stone_pcs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wastage NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labour_rate NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labour_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS doc_no TEXT,
ADD COLUMN IF NOT EXISTS doc_date DATE,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS labeling_date DATE,
ADD COLUMN IF NOT EXISTS purch_wastage_rate NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality TEXT,
ADD COLUMN IF NOT EXISTS other_charges NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dia_purchase_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stone_purchase_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS huid TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT;

-- Also refresh the staff view to include new columns if needed
CREATE OR REPLACE VIEW staff_items AS
SELECT 
    id, name, sku, barcode, description, category_id, quantity, unit, location, 
    image_url, min_stock_level, label_no, pcs, purity, gross_wt, net_wt, 
    created_at, updated_at
FROM items;
