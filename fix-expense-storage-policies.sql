-- Fix Storage Bucket Policies for Expense Receipts
-- Run this in your Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete receipts" ON storage.objects;

-- Create new policies with correct conditions
-- Allow authenticated users to view receipts
CREATE POLICY "Allow authenticated users to view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow authenticated users to update receipts
CREATE POLICY "Allow authenticated users to update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to delete receipts
CREATE POLICY "Allow authenticated users to delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts');
