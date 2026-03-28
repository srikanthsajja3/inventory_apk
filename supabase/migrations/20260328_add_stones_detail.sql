-- Migration: Add stones_in_detail and ensure other fields are available
ALTER TABLE items ADD COLUMN IF NOT EXISTS stones_in_detail TEXT;

-- Drop and recreate staff view to avoid column mismatch errors
DROP VIEW IF EXISTS staff_items;

CREATE VIEW staff_items AS
SELECT 
    id, name, sku, barcode, description, category_id, quantity, unit, location, 
    image_url, min_stock_level, label_no, pcs, purity, gross_wt, net_wt, 
    dai_wt, dai_pcs, clr_stone_wt, clr_stone_pcs, wastage, labour_rate, labour_amt,
    stones_in_detail, created_at, updated_at
FROM items;
