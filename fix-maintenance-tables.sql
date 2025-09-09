-- Fix missing maintenance tables
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if businesses table exists, create if not
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    contact_person VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    email VARCHAR,
    floor_number INTEGER NOT NULL,
    shop_number VARCHAR NOT NULL,
    area_sqft DECIMAL NOT NULL,
    rent_amount DECIMAL NOT NULL,
    security_deposit DECIMAL NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance bills table
CREATE TABLE IF NOT EXISTS maintenance_bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    bill_number VARCHAR NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('cleaning', 'repair', 'general', 'emergency')),
    amount DECIMAL NOT NULL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance payments table
CREATE TABLE IF NOT EXISTS maintenance_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    maintenance_bill_id UUID REFERENCES maintenance_bills(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL NOT NULL,
    payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance advances table
CREATE TABLE IF NOT EXISTS maintenance_advances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    used_amount DECIMAL DEFAULT 0,
    remaining_amount DECIMAL NOT NULL,
    advance_date DATE NOT NULL,
    purpose TEXT,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'used', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance instalments table
CREATE TABLE IF NOT EXISTS maintenance_instalments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    total_amount DECIMAL NOT NULL,
    instalment_amount DECIMAL NOT NULL,
    instalments_count INTEGER NOT NULL,
    instalments_paid INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_business_id ON maintenance_bills(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_status ON maintenance_bills(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_business_id ON maintenance_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_bill_id ON maintenance_payments(maintenance_bill_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_advances_business_id ON maintenance_advances(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_instalments_business_id ON maintenance_instalments(business_id);

-- Enable Row Level Security (RLS)
ALTER TABLE maintenance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_instalments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can make these more restrictive later)
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_bills;
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_payments;
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_advances;
DROP POLICY IF EXISTS "Allow all operations" ON maintenance_instalments;

CREATE POLICY "Allow all operations" ON maintenance_bills FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_advances FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_instalments FOR ALL USING (true);

-- Insert some sample data if businesses table is empty
INSERT INTO businesses (name, type, contact_person, phone, email, floor_number, shop_number, area_sqft, rent_amount, security_deposit, lease_start_date, lease_end_date, status)
SELECT 
    'Sample Business 1', 'Retail', 'John Doe', '1234567890', 'john@example.com', 1, 'G-01', 500.00, 15000.00, 30000.00, '2024-01-01', '2025-12-31', 'active'
WHERE NOT EXISTS (SELECT 1 FROM businesses LIMIT 1);

INSERT INTO businesses (name, type, contact_person, phone, email, floor_number, shop_number, area_sqft, rent_amount, security_deposit, lease_start_date, lease_end_date, status)
SELECT 
    'Sample Business 2', 'Office', 'Jane Smith', '0987654321', 'jane@example.com', 2, 'F-15', 750.00, 20000.00, 40000.00, '2024-01-01', '2025-12-31', 'active'
WHERE (SELECT COUNT(*) FROM businesses) < 2;