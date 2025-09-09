-- Add new columns to advances table for type and month/year tracking
ALTER TABLE advances 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('electricity', 'rent', 'maintenance')),
ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month >= 1 AND month <= 12),
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 2020 AND year <= 2050);

-- Update existing records to have default values (you may want to update these manually)
UPDATE advances 
SET 
  type = 'rent',
  month = EXTRACT(MONTH FROM advance_date::date),
  year = EXTRACT(YEAR FROM advance_date::date)
WHERE type IS NULL;

-- Create unique constraint to prevent duplicate advances for same business, type, month, year
CREATE UNIQUE INDEX IF NOT EXISTS idx_advances_unique_business_type_month_year 
ON advances (business_id, type, month, year) 
WHERE status = 'active';

-- Add comment to table
COMMENT ON TABLE advances IS 'Advance payments with type and month/year tracking to prevent duplicates';
COMMENT ON COLUMN advances.type IS 'Type of advance payment: electricity, rent, or maintenance';
COMMENT ON COLUMN advances.month IS 'Month for which the advance is paid (1-12)';
COMMENT ON COLUMN advances.year IS 'Year for which the advance is paid';