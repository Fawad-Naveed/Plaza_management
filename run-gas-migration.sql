-- Gas Management Migration Script
-- This script adds gas management support to the plaza management system

-- 1. Add gas_charges column to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS gas_charges DECIMAL DEFAULT 0;

-- 2. Add comment for documentation
COMMENT ON COLUMN bills.gas_charges IS 'Gas charges amount for the bill';

-- 3. Update the meter_type constraint to include 'gas'
-- First, drop the existing constraint
ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS meter_readings_meter_type_check;

-- Then, add the new constraint that includes 'gas'
ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_meter_type_check 
CHECK (meter_type = ANY (ARRAY['electricity'::text, 'water'::text, 'gas'::text]));

-- 4. Verify the changes
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bills' AND column_name = 'gas_charges';

-- 5. Verify the meter_type constraint was updated
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%meter_type%';

-- 6. Show sample data structure
SELECT * FROM bills LIMIT 1;
