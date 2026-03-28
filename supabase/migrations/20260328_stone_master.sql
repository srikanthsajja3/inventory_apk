-- Stone Master Table
CREATE TABLE IF NOT EXISTS stone_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Diamond', 'Stone', 'Beads'
  sub_category TEXT, -- 'RD', 'POLKI', 'SHAPE'
  min_wt NUMERIC(10, 3) DEFAULT 0,
  max_wt NUMERIC(10, 3) DEFAULT 999,
  rate NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Populate Fixed Rate Stones
INSERT INTO stone_master (name, category, rate) VALUES
('AQUAMARINE', 'Stone', 8500),
('BEADS', 'Beads', 550),
('CORAL BEADS', 'Beads', 1500),
('C. S. (COLOR STONE)', 'Stone', 3500),
('CZ', 'Stone', 1200),
('E BEADS', 'Beads', 850),
('E DROP', 'Beads', 850),
('EM POTOS', 'Stone', 3500),
('EMERALD', 'Stone', 3500),
('FLAT DIAMOND', 'Diamond', 3500),
('KUNDHAN STONE', 'Stone', 8500),
('LAB-CS', 'Stone', 3500),
('MOZ', 'Stone', 2500),
('NAIL', 'Stone', 1500),
('NAVARATNA', 'Stone', 8500),
('PEARLS', 'Beads', 550),
('PUMPKIN BEADS', 'Beads', 850),
('R BEADS', 'Beads', 950),
('R DROPS', 'Beads', 950),
('RUBY', 'Stone', 4500),
('RUBY POTA', 'Stone', 4500),
('RUPT', 'Stone', 3500),
('SAPPHIRE', 'Stone', 8500),
('SW MOTI', 'Beads', 550),
('TALFE', 'Stone', 2500),
('TANZANITE', 'Stone', 8500),
('TM BEADS', 'Beads', 5500),
('TUR', 'Stone', 8500);

-- Populate RD Diamond Ranges
INSERT INTO stone_master (name, category, sub_category, min_wt, max_wt, rate) VALUES
('VVS-EF-RD', 'Diamond', 'RD', 0.001, 0.069, 69000),
('VVS-EF-RD', 'Diamond', 'RD', 0.070, 0.139, 90000),
('VVS-EF-RD', 'Diamond', 'RD', 0.140, 0.179, 120000),
('VVS-EF-RD', 'Diamond', 'RD', 0.180, 0.249, 135000),
('VVS-EF-RD', 'Diamond', 'RD', 0.250, 0.299, 150000),
('VVS-EF-RD', 'Diamond', 'RD', 0.300, 0.399, 180000),
('VVS-EF-RD', 'Diamond', 'RD', 0.400, 0.499, 195000);

-- Populate Polki Ranges
INSERT INTO stone_master (name, category, sub_category, min_wt, max_wt, rate) VALUES
('POLKI', 'Diamond', 'POLKI', 0.001, 0.099, 25000),
('POLKI', 'Diamond', 'POLKI', 0.100, 0.199, 30000),
('POLKI', 'Diamond', 'POLKI', 0.200, 0.399, 35000),
('POLKI', 'Diamond', 'POLKI', 0.400, 0.499, 45000),
('POLKI', 'Diamond', 'POLKI', 0.500, 999.000, 50000);

-- Populate Shape Diamond Ranges
INSERT INTO stone_master (name, category, sub_category, min_wt, max_wt, rate) VALUES
('Shape Diamonds', 'Diamond', 'SHAPE', 0.001, 0.045, 80000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.046, 0.076, 90000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.077, 0.119, 105000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.120, 0.150, 120000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.151, 0.220, 135000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.221, 0.300, 150000),
('Shape Diamonds', 'Diamond', 'SHAPE', 0.301, 0.400, 170000);

-- Black Diamond
INSERT INTO stone_master (name, category, rate) VALUES ('BLACK DIAMOND', 'Diamond', 4000);

ALTER TABLE stone_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read stone master" ON stone_master FOR SELECT USING (true);
CREATE POLICY "Allow all stone master admin" ON stone_master FOR ALL USING (true);
