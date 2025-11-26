-- Create Storage Bucket for Expense Receipts
-- Run this in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false);

-- Create storage policies for admin access

-- Allow authenticated users to view receipts (admin-only in practice)
CREATE POLICY "Allow authenticated users to view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to update receipts
CREATE POLICY "Allow authenticated users to update receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete receipts
CREATE POLICY "Allow authenticated users to delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');
