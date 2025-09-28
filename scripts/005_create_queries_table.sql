-- Migration: Create queries table for business query management
-- Run this script in your Supabase SQL editor

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'billing', 'facility', 'complaint', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')) DEFAULT 'open',
  admin_response TEXT,
  admin_response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_queries_business_id ON queries(business_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);
CREATE INDEX IF NOT EXISTS idx_queries_category ON queries(category);
CREATE INDEX IF NOT EXISTS idx_queries_priority ON queries(priority);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_queries_updated_at 
    BEFORE UPDATE ON queries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Create policies for queries table
-- Policy 1: Businesses can only see their own queries
CREATE POLICY "Businesses can view own queries" 
ON queries FOR SELECT 
USING (auth.jwt() ->> 'business_id' = business_id::text);

-- Policy 2: Businesses can insert their own queries
CREATE POLICY "Businesses can insert own queries" 
ON queries FOR INSERT 
WITH CHECK (auth.jwt() ->> 'business_id' = business_id::text);

-- Policy 3: Admins can see all queries (assuming admin role in JWT)
CREATE POLICY "Admins can view all queries" 
ON queries FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

-- Policy 4: Admins can update all queries
CREATE POLICY "Admins can update all queries" 
ON queries FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Policy 5: Admins can delete queries
CREATE POLICY "Admins can delete queries" 
ON queries FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Insert some sample data for testing (optional - remove if not needed)
-- Note: Replace the business_id values with actual business IDs from your businesses table
/*
INSERT INTO queries (business_id, title, description, category, priority, status) VALUES 
  ((SELECT id FROM businesses LIMIT 1), 'Test Query - AC Issue', 'Air conditioning not working properly', 'maintenance', 'high', 'open'),
  ((SELECT id FROM businesses LIMIT 1), 'Test Query - Bill Question', 'Question about last month electricity bill', 'billing', 'medium', 'open');
*/

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'queries'
ORDER BY ordinal_position;