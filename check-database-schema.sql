-- Check Database Schema for Gas Management Support
-- Run this script to verify the database is ready for gas management

-- 1. Check if gas_charges column exists in bills table
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bills' AND column_name = 'gas_charges';

-- 2. Check if meter_readings table supports 'gas' type
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%meter_type%';

-- 3. Check current meter_readings table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meter_readings' 
ORDER BY ordinal_position;

-- 4. Test if we can insert a gas meter reading (this will fail if schema is not ready)
-- Uncomment the following lines to test:
-- INSERT INTO meter_readings (business_id, meter_type, reading_date, previous_reading, current_reading, units_consumed, rate_per_unit, amount)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'gas', '2024-01-01', 0, 100, 100, 150.0, 15000.0);
-- ROLLBACK;
