-- Alternative: Allow public uploads for expense receipts
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete receipts" ON storage.objects;

-- Create policies that allow both authenticated and anon users
-- Allow anyone to view receipts
CREATE POLICY "Allow public to view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts');

-- Allow anyone to upload receipts
CREATE POLICY "Allow public to upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow anyone to update receipts
CREATE POLICY "Allow public to update receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'expense-receipts');

-- Allow anyone to delete receipts
CREATE POLICY "Allow public to delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-receipts');
