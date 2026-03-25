-- Migration: Add custom inventory fields for jewelry/inventory management
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
ADD COLUMN IF NOT EXISTS wastage NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labour_rate NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labour_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS doc_no TEXT,
ADD COLUMN IF NOT EXISTS doc_date DATE,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS labeling_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS purch_wastage_rate NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality TEXT,
ADD COLUMN IF NOT EXISTS other_charges NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dia_purchase_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stone_purchase_amt NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS huid TEXT;

-- Update the staff view to include new fields
DROP VIEW IF EXISTS staff_items;
CREATE OR REPLACE VIEW staff_items AS
SELECT 
    id, name, sku, barcode, description, category_id, quantity, unit, location, image_url, min_stock_level, created_at, updated_at,
    label_no, pcs, purity, gross_wt, net_wt, dai_wt, dai_pcs, clr_stone_wt, clr_stone_pcs, wastage, labour_rate, labour_amt,
    doc_no, doc_date, size, labeling_date, purch_wastage_rate, quality, other_charges, dia_purchase_amt, stone_purchase_amt, huid
FROM items;
