-- Add gas_charges column to bills table
ALTER TABLE bills ADD COLUMN gas_charges DECIMAL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN bills.gas_charges IS 'Gas charges amount for the bill';

