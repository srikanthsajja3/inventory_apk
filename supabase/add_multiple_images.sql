-- Migration to add support for multiple images
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Update the staff_items view to include the new column
CREATE OR REPLACE VIEW staff_items AS
SELECT 
    id, name, sku, barcode, description, category_id, quantity, unit, location, 
    image_url, image_urls, min_stock_level, label_no, pcs, purity, gross_wt, net_wt, 
    created_at, updated_at
FROM items;
