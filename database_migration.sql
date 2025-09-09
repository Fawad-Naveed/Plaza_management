-- Migration script to remove business_id from terms_conditions table
-- This aligns the database schema with the global nature of terms and conditions

-- Remove the business_id column from terms_conditions table
ALTER TABLE terms_conditions DROP COLUMN business_id;

-- Verify the change by checking the table structure
-- Run this after the ALTER TABLE command to confirm:
-- \d terms_conditions

-- Expected final structure:
-- Column         | Type                        | Collation | Nullable | Default
-- ---------------+-----------------------------+-----------+----------+---------
-- id             | uuid                        |           | not null | gen_random_uuid()
-- title          | character varying           |           | not null |
-- description    | text                        |           |          |
-- effective_date | date                        |           | not null |
-- created_at     | timestamp with time zone    |           |          | now()
