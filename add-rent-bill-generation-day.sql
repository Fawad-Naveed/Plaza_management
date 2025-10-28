-- Add rent_bill_generation_day column to information table
-- This column stores the day of month (1-31) when rent bills should be generated

ALTER TABLE information 
ADD COLUMN IF NOT EXISTS rent_bill_generation_day INTEGER DEFAULT 1 CHECK (rent_bill_generation_day >= 1 AND rent_bill_generation_day <= 31);

-- Add comment for documentation
COMMENT ON COLUMN information.rent_bill_generation_day IS 'Day of the month (1-31) when rent bills should be automatically generated for all tenants';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'information' AND column_name = 'rent_bill_generation_day';
