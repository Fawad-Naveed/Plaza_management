-- Run Terms and Conditions Migration
-- This script will add the necessary columns to the bills table to support terms and conditions

\echo 'Starting Terms and Conditions migration...'

-- Check if columns already exist
DO $$
BEGIN
    -- Check if terms_conditions_ids column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bills' AND column_name = 'terms_conditions_ids'
    ) THEN
        -- Add terms_conditions_ids column
        ALTER TABLE bills ADD COLUMN terms_conditions_ids TEXT[] DEFAULT NULL;
        RAISE NOTICE 'Added terms_conditions_ids column to bills table';
    ELSE
        RAISE NOTICE 'terms_conditions_ids column already exists in bills table';
    END IF;

    -- Check if terms_conditions_text column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bills' AND column_name = 'terms_conditions_text'
    ) THEN
        -- Add terms_conditions_text column
        ALTER TABLE bills ADD COLUMN terms_conditions_text TEXT DEFAULT NULL;
        RAISE NOTICE 'Added terms_conditions_text column to bills table';
    ELSE
        RAISE NOTICE 'terms_conditions_text column already exists in bills table';
    END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN bills.terms_conditions_ids IS 'Array of term and condition IDs that were selected for this bill';
COMMENT ON COLUMN bills.terms_conditions_text IS 'Formatted text of all selected terms and conditions for this bill';

-- Create index for better query performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_bills_terms_conditions_ids ON bills USING GIN (terms_conditions_ids);

-- Verify the migration was successful
\echo 'Verifying migration results...'
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN column_name = 'terms_conditions_ids' THEN 'Array of term IDs'
        WHEN column_name = 'terms_conditions_text' THEN 'Formatted terms text'
        ELSE 'Unknown'
    END as description
FROM information_schema.columns 
WHERE table_name = 'bills' 
AND column_name IN ('terms_conditions_ids', 'terms_conditions_text')
ORDER BY ordinal_position;

-- Check if index was created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'bills' 
AND indexname = 'idx_bills_terms_conditions_ids';

\echo 'Migration completed successfully!'
\echo 'You can now use Terms and Conditions with bill generation.'
