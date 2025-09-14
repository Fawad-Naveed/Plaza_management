-- Migration: Add terms and conditions fields to bills table
-- Date: 2025-09-12
-- Description: Add nullable columns for storing terms and conditions data with bills

-- Add terms_conditions_ids column to store array of term IDs
ALTER TABLE bills 
ADD COLUMN terms_conditions_ids TEXT[] DEFAULT NULL;

-- Add terms_conditions_text column to store formatted text of selected terms
ALTER TABLE bills 
ADD COLUMN terms_conditions_text TEXT DEFAULT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN bills.terms_conditions_ids IS 'Array of term and condition IDs that were selected for this bill';
COMMENT ON COLUMN bills.terms_conditions_text IS 'Formatted text of all selected terms and conditions for this bill';

-- Create index for better query performance when searching by terms
CREATE INDEX IF NOT EXISTS idx_bills_terms_conditions_ids ON bills USING GIN (terms_conditions_ids);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bills' 
AND column_name IN ('terms_conditions_ids', 'terms_conditions_text')
ORDER BY ordinal_position;
