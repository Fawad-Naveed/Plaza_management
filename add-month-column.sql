-- Add missing month column to instalments table
ALTER TABLE instalments ADD COLUMN IF NOT EXISTS month INTEGER;
