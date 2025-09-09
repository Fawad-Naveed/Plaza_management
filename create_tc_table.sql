-- Create the new t_c table for Terms & Conditions
CREATE TABLE t_c (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on effective_date for better query performance
CREATE INDEX idx_tc_effective_date ON t_c(effective_date DESC);

-- Create an index on created_at for ordering
CREATE INDEX idx_tc_created_at ON t_c(created_at DESC);

-- Enable Row Level Security (if using Supabase)
ALTER TABLE t_c ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on t_c" ON t_c
    FOR ALL USING (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 't_c'
ORDER BY ordinal_position;
