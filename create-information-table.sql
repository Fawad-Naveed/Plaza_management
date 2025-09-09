-- Create information table for storing business/owner information
CREATE TABLE IF NOT EXISTS information (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on business_name to ensure only one record
CREATE UNIQUE INDEX IF NOT EXISTS idx_information_business_name ON information (business_name);

-- Enable RLS (Row Level Security)
ALTER TABLE information ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "information_policy" ON information
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);