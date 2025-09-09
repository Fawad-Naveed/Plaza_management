-- Plaza Management Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table
CREATE TABLE businesses (
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

-- Contact persons table
CREATE TABLE contact_persons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    email VARCHAR,
    designation VARCHAR,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors table
CREATE TABLE floors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    floor_number INTEGER NOT NULL UNIQUE,
    floor_name VARCHAR NOT NULL,
    total_shops INTEGER NOT NULL,
    occupied_shops INTEGER DEFAULT 0,
    total_area_sqft DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    bill_number VARCHAR NOT NULL UNIQUE,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    rent_amount DECIMAL DEFAULT 0,
    maintenance_charges DECIMAL DEFAULT 0,
    electricity_charges DECIMAL DEFAULT 0,
    water_charges DECIMAL DEFAULT 0,
    other_charges DECIMAL DEFAULT 0,
    total_amount DECIMAL NOT NULL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL NOT NULL,
    payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advances table
CREATE TABLE advances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    advance_date DATE NOT NULL,
    purpose TEXT,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'adjusted', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instalments table
CREATE TABLE instalments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    total_amount DECIMAL NOT NULL,
    instalment_amount DECIMAL NOT NULL,
    instalments_count INTEGER NOT NULL,
    instalments_paid INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terms and conditions table
CREATE TABLE terms_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meter readings table
CREATE TABLE meter_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    meter_type VARCHAR NOT NULL CHECK (meter_type IN ('electricity', 'water', 'gas')),
    reading_date DATE NOT NULL,
    previous_reading DECIMAL NOT NULL,
    current_reading DECIMAL NOT NULL,
    units_consumed DECIMAL NOT NULL,
    rate_per_unit DECIMAL NOT NULL,
    amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance bills table
CREATE TABLE maintenance_bills (
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
CREATE TABLE maintenance_payments (
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
CREATE TABLE maintenance_advances (
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
CREATE TABLE maintenance_instalments (
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
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_floor_number ON businesses(floor_number);
CREATE INDEX idx_contact_persons_business_id ON contact_persons(business_id);
CREATE INDEX idx_bills_business_id ON bills(business_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_advances_business_id ON advances(business_id);
CREATE INDEX idx_instalments_business_id ON instalments(business_id);
CREATE INDEX idx_meter_readings_business_id ON meter_readings(business_id);
CREATE INDEX idx_maintenance_bills_business_id ON maintenance_bills(business_id);
CREATE INDEX idx_maintenance_payments_business_id ON maintenance_payments(business_id);
CREATE INDEX idx_maintenance_advances_business_id ON maintenance_advances(business_id);
CREATE INDEX idx_maintenance_instalments_business_id ON maintenance_instalments(business_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_instalments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can make these more restrictive later)
CREATE POLICY "Allow all operations" ON businesses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contact_persons FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON floors FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON advances FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON instalments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON terms_conditions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON meter_readings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_bills FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_advances FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON maintenance_instalments FOR ALL USING (true);