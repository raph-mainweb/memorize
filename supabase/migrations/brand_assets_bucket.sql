-- Migration: Create Storage Bucket for brand assets
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist AND set it strictly to PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view/download the files
CREATE POLICY "Public Access: Brand Assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'brand-assets' );
