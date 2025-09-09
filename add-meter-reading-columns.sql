-- Add missing columns to meter_readings table for bill integration

-- Add payment_status column
ALTER TABLE meter_readings 
ADD COLUMN payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue'));

-- Add bill_number column
ALTER TABLE meter_readings 
ADD COLUMN bill_number VARCHAR;

-- Create index for better performance
CREATE INDEX idx_meter_readings_payment_status ON meter_readings(payment_status);
CREATE INDEX idx_meter_readings_bill_number ON meter_readings(bill_number);

-- Add comment for documentation
COMMENT ON COLUMN meter_readings.payment_status IS 'Payment status of the meter reading (pending, paid, overdue)';
COMMENT ON COLUMN meter_readings.bill_number IS 'Associated bill number for the meter reading';
