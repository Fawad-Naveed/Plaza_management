-- Migration script to add admin tracking to payments
-- Run this in your Supabase SQL Editor

-- Add admin_id column to payments table to track which admin marked the bill as paid
ALTER TABLE payments ADD COLUMN admin_id VARCHAR;
ALTER TABLE payments ADD COLUMN marked_paid_by VARCHAR;
ALTER TABLE payments ADD COLUMN marked_paid_date TIMESTAMP WITH TIME ZONE;

-- Add admin_id column to maintenance_payments table as well
ALTER TABLE maintenance_payments ADD COLUMN admin_id VARCHAR;
ALTER TABLE maintenance_payments ADD COLUMN marked_paid_by VARCHAR;
ALTER TABLE maintenance_payments ADD COLUMN marked_paid_date TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the new fields
COMMENT ON COLUMN payments.admin_id IS 'ID of the admin who created this payment record';
COMMENT ON COLUMN payments.marked_paid_by IS 'Name/username of the admin who marked the bill as paid';
COMMENT ON COLUMN payments.marked_paid_date IS 'Timestamp when the bill was marked as paid by admin';

COMMENT ON COLUMN maintenance_payments.admin_id IS 'ID of the admin who created this payment record';
COMMENT ON COLUMN maintenance_payments.marked_paid_by IS 'Name/username of the admin who marked the bill as paid';
COMMENT ON COLUMN maintenance_payments.marked_paid_date IS 'Timestamp when the bill was marked as paid by admin';