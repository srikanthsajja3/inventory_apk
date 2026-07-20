-- ============================================================
-- CONSOLIDATED STORAGE SETUP FOR INVENTORY-MANAGER
-- Run this in your Supabase SQL Editor to ensure all buckets
-- and RLS policies are properly set up for image & document uploads.
-- ============================================================

-- 1. Create the 'item-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'item-thumbnails' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-thumbnails', 'item-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create the 'pdfs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for 'item-images' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects 
  FOR DELETE USING (bucket_id = 'item-images');


-- 6. RLS Policies for 'item-thumbnails' bucket
DROP POLICY IF EXISTS "Public Access Thumbnails" ON storage.objects;
CREATE POLICY "Public Access Thumbnails" ON storage.objects 
  FOR SELECT USING (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Insert Thumbnails" ON storage.objects;
CREATE POLICY "Public Insert Thumbnails" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Update Thumbnails" ON storage.objects;
CREATE POLICY "Public Update Thumbnails" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Delete Thumbnails" ON storage.objects;
CREATE POLICY "Public Delete Thumbnails" ON storage.objects 
  FOR DELETE USING (bucket_id = 'item-thumbnails');


-- 7. RLS Policies for 'pdfs' bucket
DROP POLICY IF EXISTS "Public Select Access on pdfs" ON storage.objects;
CREATE POLICY "Public Select Access on pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Insert Access on pdfs" ON storage.objects;
CREATE POLICY "Public Insert Access on pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Update Access on pdfs" ON storage.objects;
CREATE POLICY "Public Update Access on pdfs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Delete Access on pdfs" ON storage.objects;
CREATE POLICY "Public Delete Access on pdfs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs');
