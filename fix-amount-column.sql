-- Quick fix for the amount column issue
-- Run this in your Supabase SQL Editor if you're getting the amount column error

-- Remove the amount column that's causing the constraint violation
ALTER TABLE partial_payments DROP COLUMN IF EXISTS amount;

-- Also remove any other old columns that might be causing issues
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalment_amount;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalments_count;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalments_paid;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS frequency;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS due_dates;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS payment_status;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS payment_dates;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS start_date;

-- Ensure we have the correct columns
ALTER TABLE partial_payments ADD COLUMN IF NOT EXISTS payment_entries JSONB DEFAULT '[]'::jsonb;
ALTER TABLE partial_payments ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to have proper structure
UPDATE partial_payments 
SET 
    payment_entries = '[]'::jsonb,
    total_paid_amount = 0
WHERE payment_entries IS NULL OR total_paid_amount IS NULL;
