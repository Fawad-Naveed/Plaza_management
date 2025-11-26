-- Add company_address column to information table
-- This column stores the complete company address for invoices and bills

ALTER TABLE information 
ADD COLUMN IF NOT EXISTS company_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN information.company_address IS 'Complete company address to display on bills and invoices';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'information' AND column_name = 'company_address';
