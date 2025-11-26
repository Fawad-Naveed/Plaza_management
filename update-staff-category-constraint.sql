-- Update staff table category constraint to include 'admin' and remove 'cleaning'
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint (try common constraint names)
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_category_check;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_category_check1;

-- Alternative: Find and drop any constraint on category column
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'staff'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%category%'
    ) LOOP
        EXECUTE format('ALTER TABLE staff DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

-- Add the new constraint with 'admin' instead of 'cleaning'
ALTER TABLE staff ADD CONSTRAINT staff_category_check 
    CHECK (category IN ('security', 'admin', 'maintenance', 'other'));

