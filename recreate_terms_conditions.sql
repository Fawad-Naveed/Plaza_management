-- Script to recreate terms_conditions table without business_id

-- Step 1: Drop the existing table
DROP TABLE IF EXISTS terms_conditions CASCADE;

-- Step 2: Create the new table with correct structure
CREATE TABLE terms_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (if needed)
ALTER TABLE terms_conditions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on terms_conditions" ON terms_conditions
    FOR ALL USING (true);

-- Step 5: Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'terms_conditions' 
ORDER BY ordinal_position;
