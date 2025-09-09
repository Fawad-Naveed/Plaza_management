-- This SQL directly updates the meter_readings table to set payment_status and bill_number
-- Use this as a workaround if the application has schema cache issues

-- First refresh the schema cache (this helps Supabase Studio see the columns)
SELECT * FROM meter_readings LIMIT 1;

-- Update payment status to 'paid' for a specific meter reading
-- Replace 'your-meter-reading-id' with the actual ID
UPDATE meter_readings 
SET payment_status = 'paid', 
    bill_number = 'ELE-MR-2023-001'
WHERE id = 'your-meter-reading-id';

-- Update payment status to 'pending' for a specific meter reading
-- Replace 'your-meter-reading-id' with the actual ID
-- UPDATE meter_readings 
-- SET payment_status = 'pending'
-- WHERE id = 'your-meter-reading-id';

-- Verify the update worked
SELECT id, meter_type, payment_status, bill_number FROM meter_readings
WHERE id = 'your-meter-reading-id';

-- If you need to update ALL meter readings at once:
-- UPDATE meter_readings
-- SET payment_status = 'pending'
-- WHERE payment_status IS NULL;
