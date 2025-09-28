-- Fix pending_payments table to support both bills and meter readings
-- Remove the foreign key constraint on bill_id to allow meter reading IDs

-- Drop the existing foreign key constraint
ALTER TABLE pending_payments 
DROP CONSTRAINT IF EXISTS pending_payments_bill_id_fkey;

-- Add a comment to explain the new flexible bill_id format
COMMENT ON COLUMN pending_payments.bill_id IS 'Reference to bill ID or meter reading ID. Use notes field to distinguish between bill types.';

-- The bill_id column remains UUID type but no longer has a foreign key constraint
-- This allows us to store both bill IDs and meter reading IDs