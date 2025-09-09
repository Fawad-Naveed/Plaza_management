-- Fix the terms_conditions table by making business_id nullable
-- since terms and conditions appear to be global, not business-specific

ALTER TABLE terms_conditions 
ALTER COLUMN business_id DROP NOT NULL;

-- Optional: Update any existing records that might have NULL business_id
-- UPDATE terms_conditions SET business_id = NULL WHERE business_id IS NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'terms_conditions'
ORDER BY ordinal_position;
