-- Add waveoff status to bills table
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_status_check;
ALTER TABLE bills ADD CONSTRAINT bills_status_check 
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'waveoff'));

-- Add waveoff status to maintenance_bills table
ALTER TABLE maintenance_bills DROP CONSTRAINT IF EXISTS maintenance_bills_status_check;
ALTER TABLE maintenance_bills ADD CONSTRAINT maintenance_bills_status_check 
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'waveoff'));

-- Add waveoff status to meter_readings table (if payment_status constraint exists)
-- First check if payment_status has any constraints and add waveoff option
DO $$
BEGIN
    -- Check if payment_status column exists and add constraint if it doesn't
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'meter_readings' 
        AND column_name = 'payment_status'
    ) THEN
        -- Drop existing constraint if any
        ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS meter_readings_payment_status_check;
        
        -- Add new constraint with waveoff option
        ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_payment_status_check 
            CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waveoff'));
    ELSE
        -- Add payment_status column if it doesn't exist
        ALTER TABLE meter_readings ADD COLUMN payment_status VARCHAR DEFAULT 'pending' 
            CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waveoff'));
    END IF;
END $$;

-- Create indexes for better performance on the new status values
CREATE INDEX IF NOT EXISTS idx_bills_waveoff_status ON bills(status) WHERE status = 'waveoff';
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_waveoff_status ON maintenance_bills(status) WHERE status = 'waveoff';
CREATE INDEX IF NOT EXISTS idx_meter_readings_waveoff_status ON meter_readings(payment_status) WHERE payment_status = 'waveoff';