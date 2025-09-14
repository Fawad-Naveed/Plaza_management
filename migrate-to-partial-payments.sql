-- Migration script to transform installments to partial payments
-- Run this in your Supabase SQL Editor

-- First, let's rename the table
ALTER TABLE IF EXISTS instalments RENAME TO partial_payments;

-- Remove columns we don't need anymore
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalment_amount;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalments_count;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS instalments_paid;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS frequency;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS due_dates;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS payment_status;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS payment_dates;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS start_date;
ALTER TABLE partial_payments DROP COLUMN IF EXISTS amount;

-- Rename total_amount to total_rent_amount for clarity
ALTER TABLE partial_payments RENAME COLUMN total_amount TO total_rent_amount;

-- Add new columns for partial payment system
ALTER TABLE partial_payments ADD COLUMN IF NOT EXISTS payment_entries JSONB DEFAULT '[]'::jsonb;
ALTER TABLE partial_payments ADD COLUMN IF NOT EXISTS total_paid_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to have proper structure
-- For existing records, set payment_entries as empty array and total_paid_amount as 0
UPDATE partial_payments 
SET 
    payment_entries = '[]'::jsonb,
    total_paid_amount = 0
WHERE payment_entries IS NULL OR total_paid_amount IS NULL;

-- Update the status check constraint to be simpler
ALTER TABLE partial_payments DROP CONSTRAINT IF EXISTS instalments_status_check;
ALTER TABLE partial_payments ADD CONSTRAINT partial_payments_status_check 
    CHECK (status IN ('active', 'completed', 'cancelled'));

-- Update indexes
DROP INDEX IF EXISTS idx_instalments_business_id;
DROP INDEX IF EXISTS idx_instalments_month_year;
DROP INDEX IF EXISTS idx_instalments_status;

CREATE INDEX IF NOT EXISTS idx_partial_payments_business_id ON partial_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_month_year ON partial_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_partial_payments_status ON partial_payments(status);

-- Update RLS policy name
DROP POLICY IF EXISTS "instalments_policy" ON partial_payments;
CREATE POLICY "partial_payments_policy" ON partial_payments
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update the trigger name
DROP TRIGGER IF EXISTS update_instalments_updated_at ON partial_payments;
CREATE TRIGGER update_partial_payments_updated_at 
    BEFORE UPDATE ON partial_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE partial_payments IS 'Stores partial payment records for business rent';
COMMENT ON COLUMN partial_payments.payment_entries IS 'Array of individual payment records with amount, date, and description';
COMMENT ON COLUMN partial_payments.total_paid_amount IS 'Sum of all payments made for this month/year';
COMMENT ON COLUMN partial_payments.total_rent_amount IS 'Total monthly rent amount for this business';
