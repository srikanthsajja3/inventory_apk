-- Migration to ensure item-thumbnails bucket exists and is public
-- Similar to 20260608120000_storage_bucket.sql

-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-thumbnails', 'item-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access to the bucket
DROP POLICY IF EXISTS "Public Access Thumbnails" ON storage.objects;
CREATE POLICY "Public Access Thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Insert Thumbnails" ON storage.objects;
CREATE POLICY "Public Insert Thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Update Thumbnails" ON storage.objects;
CREATE POLICY "Public Update Thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'item-thumbnails');

DROP POLICY IF EXISTS "Public Delete Thumbnails" ON storage.objects;
CREATE POLICY "Public Delete Thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'item-thumbnails');
