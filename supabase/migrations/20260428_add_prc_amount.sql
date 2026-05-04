    -- Migration: Add prc_amount field for profit calculation
    ALTER TABLE items 
    ADD COLUMN IF NOT EXISTS prc_amount NUMERIC(10, 2) DEFAULT 0;

    -- Update the staff view to include the new field (though staff might not see it in UI, it should be in the view if they select *)
    DROP VIEW IF EXISTS staff_items;
    CREATE OR REPLACE VIEW staff_items AS
    SELECT 
        id, name, sku, barcode, description, category_id, quantity, unit, location, image_url, min_stock_level, created_at, updated_at,
        label_no, pcs, purity, gross_wt, net_wt, dai_wt, dai_pcs, clr_stone_wt, clr_stone_pcs, wastage, labour_rate, labour_amt,
        doc_no, doc_date, size, labeling_date, purch_wastage_rate, quality, other_charges, dia_purchase_amt, stone_purchase_amt, huid,
        prc_amount
    FROM items;
