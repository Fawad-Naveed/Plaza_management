-- Create dedicated maintenance tables for plaza management system

-- Maintenance bills table (separate from general bills)
CREATE TABLE IF NOT EXISTS maintenance_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL UNIQUE,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cleaning', 'repair', 'general', 'emergency')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance payments table
CREATE TABLE IF NOT EXISTS maintenance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  maintenance_bill_id UUID REFERENCES maintenance_bills(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance advances table
CREATE TABLE IF NOT EXISTS maintenance_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  used_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance instalments table
CREATE TABLE IF NOT EXISTS maintenance_instalments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  instalment_amount DECIMAL(10,2) NOT NULL,
  instalments_count INTEGER NOT NULL,
  instalments_paid INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_bills_business_date ON maintenance_bills(business_id, bill_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_business_date ON maintenance_payments(business_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_advances_business ON maintenance_advances(business_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_instalments_business ON maintenance_instalments(business_id);

-- Create unique constraint for maintenance bill numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_bills_bill_number ON maintenance_bills(bill_number);
