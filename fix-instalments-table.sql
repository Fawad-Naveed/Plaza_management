-- Fix instalments table schema for partial payments
-- Run this in your Supabase SQL Editor

-- First, let's check if the instalments table exists and what columns it has
-- If it doesn't exist, create it with the correct schema
CREATE TABLE IF NOT EXISTS instalments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    instalment_amount DECIMAL(10,2) NOT NULL,
    instalments_count INTEGER NOT NULL DEFAULT 1,
    instalments_paid INTEGER NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (frequency IN ('weekly', 'bi-weekly', 'custom')),
    due_dates TEXT[] NOT NULL DEFAULT '{}',
    payment_status TEXT[] NOT NULL DEFAULT '{}',
    payment_dates TEXT[] DEFAULT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table exists but is missing columns, add them
DO $$ 
BEGIN
    -- Add month column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'month') THEN
        ALTER TABLE instalments ADD COLUMN month INTEGER;
    END IF;
    
    -- Add year column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'year') THEN
        ALTER TABLE instalments ADD COLUMN year INTEGER;
    END IF;
    
    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'total_amount') THEN
        ALTER TABLE instalments ADD COLUMN total_amount DECIMAL(10,2);
    END IF;
    
    -- Add instalment_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'instalment_amount') THEN
        ALTER TABLE instalments ADD COLUMN instalment_amount DECIMAL(10,2);
    END IF;
    
    -- Add instalments_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'instalments_count') THEN
        ALTER TABLE instalments ADD COLUMN instalments_count INTEGER DEFAULT 1;
    END IF;
    
    -- Add instalments_paid column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'instalments_paid') THEN
        ALTER TABLE instalments ADD COLUMN instalments_paid INTEGER DEFAULT 0;
    END IF;
    
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'start_date') THEN
        ALTER TABLE instalments ADD COLUMN start_date DATE;
    END IF;
    
    -- Add frequency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'frequency') THEN
        ALTER TABLE instalments ADD COLUMN frequency VARCHAR(20) DEFAULT 'custom';
    END IF;
    
    -- Add due_dates column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'due_dates') THEN
        ALTER TABLE instalments ADD COLUMN due_dates TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'payment_status') THEN
        ALTER TABLE instalments ADD COLUMN payment_status TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add payment_dates column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'payment_dates') THEN
        ALTER TABLE instalments ADD COLUMN payment_dates TEXT[] DEFAULT NULL;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'description') THEN
        ALTER TABLE instalments ADD COLUMN description TEXT;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'status') THEN
        ALTER TABLE instalments ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'created_at') THEN
        ALTER TABLE instalments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalments' AND column_name = 'updated_at') THEN
        ALTER TABLE instalments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instalments_business_id ON instalments(business_id);
CREATE INDEX IF NOT EXISTS idx_instalments_month_year ON instalments(month, year);
CREATE INDEX IF NOT EXISTS idx_instalments_status ON instalments(status);

-- Enable RLS (Row Level Security)
ALTER TABLE instalments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "instalments_policy" ON instalments
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instalments_updated_at 
    BEFORE UPDATE ON instalments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
