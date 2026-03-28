-- 1. Add specific diamond shape carats to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS dai_rd NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dai_pear NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dai_stb NUMERIC(10, 3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igi_fee NUMERIC(10, 2) DEFAULT 0;

-- 2. Create Master Rates Table
CREATE TABLE IF NOT EXISTS master_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- e.g., 'gold_22kt', 'gold_18kt', 'usd_to_inr', 'tax_gst'
  value NUMERIC(10, 2) NOT NULL,
  label TEXT, -- e.g., 'Gold 22KT (per g)', 'Diamond RD Rate'
  category TEXT, -- 'metal', 'diamond', 'currency', 'tax'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Initial Rates (Seeds)
INSERT INTO master_rates (key, value, label, category) VALUES 
('gold_24kt', 7500.00, 'Gold 24KT (per g)', 'metal'),
('gold_22kt', 6875.00, 'Gold 22KT (per g)', 'metal'),
('gold_18kt', 5625.00, 'Gold 18KT (per g)', 'metal'),
('usd_to_inr', 83.50, 'USD to INR Exchange Rate', 'currency'),
('tax_gst', 10.50, 'GST + Surcharge %', 'tax'),
('diamond_rd_rate', 65000.00, 'Diamond Round Rate (per ct)', 'diamond'),
('diamond_pear_rate', 68000.00, 'Diamond Pear Rate (per ct)', 'diamond'),
('diamond_stb_rate', 62000.00, 'Diamond Baguette Rate (per ct)', 'diamond'),
('stone_rate', 1500.00, 'General Stone Rate (per ct)', 'stone')
ON CONFLICT (key) DO NOTHING;

-- 4. Recreate staff view
DROP VIEW IF EXISTS staff_items;
CREATE VIEW staff_items AS
SELECT 
    *,
    (SELECT value FROM master_rates WHERE key = 'tax_gst') as current_tax_rate
FROM items;

-- 5. Policies for master_rates
ALTER TABLE master_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read rates" ON master_rates FOR SELECT USING (true);
CREATE POLICY "Allow public write rates" ON master_rates FOR ALL USING (true);
