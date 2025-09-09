-- Add terms and conditions support to bills table

-- Add column to store selected terms and conditions IDs
ALTER TABLE bills 
ADD COLUMN terms_conditions_ids TEXT[]; -- Array of term IDs

-- Add column to store terms and conditions text snapshot
ALTER TABLE bills 
ADD COLUMN terms_conditions_text TEXT; -- Formatted terms text for the bill

-- Create index for better performance
CREATE INDEX idx_bills_terms_conditions ON bills USING GIN (terms_conditions_ids);

-- Add comment for documentation
COMMENT ON COLUMN bills.terms_conditions_ids IS 'Array of terms and conditions IDs applied to this bill';
COMMENT ON COLUMN bills.terms_conditions_text IS 'Formatted text of all terms and conditions applied to this bill';
