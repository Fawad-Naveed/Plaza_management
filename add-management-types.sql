-- Add management type columns to businesses table
-- Run this in your Supabase SQL Editor

-- Add new columns for management types
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS electricity_management BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gas_management BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rent_management BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_management BOOLEAN DEFAULT false;

-- Update existing businesses to have all management types enabled by default
-- (this ensures existing functionality continues to work)
UPDATE businesses 
SET 
  electricity_management = true,
  gas_management = true,
  rent_management = true,
  maintenance_management = true
WHERE electricity_management IS NULL 
   OR gas_management IS NULL 
   OR rent_management IS NULL 
   OR maintenance_management IS NULL;

-- Create indexes for better performance when filtering by management types
CREATE INDEX IF NOT EXISTS idx_businesses_electricity_management ON businesses(electricity_management);
CREATE INDEX IF NOT EXISTS idx_businesses_gas_management ON businesses(gas_management);
CREATE INDEX IF NOT EXISTS idx_businesses_rent_management ON businesses(rent_management);
CREATE INDEX IF NOT EXISTS idx_businesses_maintenance_management ON businesses(maintenance_management);
