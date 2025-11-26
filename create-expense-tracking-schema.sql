-- Expense Tracking System Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STAFF MANAGEMENT
-- ============================================

-- Staff table
CREATE TABLE staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    email VARCHAR,
    id_card_number VARCHAR NOT NULL UNIQUE,
    category VARCHAR NOT NULL CHECK (category IN ('security', 'admin', 'maintenance', 'other')),
    salary_amount DECIMAL NOT NULL,
    hire_date DATE NOT NULL,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff salary records table
CREATE TABLE staff_salary_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    amount DECIMAL NOT NULL,
    payment_date DATE,
    payment_method VARCHAR CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number VARCHAR,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FIXED EXPENSES
-- ============================================

-- Plaza utility bills (electricity for common areas)
CREATE TABLE plaza_utility_bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    utility_type VARCHAR NOT NULL CHECK (utility_type IN ('electricity', 'water', 'gas', 'property_tax')),
    title VARCHAR NOT NULL,
    description TEXT,
    amount DECIMAL NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    month INTEGER CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    payment_date DATE,
    payment_method VARCHAR CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number VARCHAR,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed expenses configuration (for recurring expenses)
CREATE TABLE fixed_expenses_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_type VARCHAR NOT NULL CHECK (expense_type IN ('property_tax', 'insurance', 'other')),
    title VARCHAR NOT NULL,
    description TEXT,
    amount DECIMAL NOT NULL,
    frequency VARCHAR NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    next_due_date DATE NOT NULL,
    reminder_date DATE,
    auto_generate BOOLEAN DEFAULT FALSE,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VARIABLE EXPENSES
-- ============================================

-- Variable expenses table
CREATE TABLE variable_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    amount DECIMAL NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('repairs', 'supplies', 'maintenance', 'misc', 'emergency', 'other')),
    receipt_image_url TEXT,
    payment_method VARCHAR CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card')),
    reference_number VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REMINDERS
-- ============================================

-- Expense reminders table
CREATE TABLE expense_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_type VARCHAR NOT NULL CHECK (expense_type IN ('staff_salary', 'utility_bill', 'property_tax', 'fixed_expense', 'other')),
    reference_id UUID,
    reminder_date DATE NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    amount DECIMAL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Staff indexes
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_category ON staff(category);
CREATE INDEX idx_staff_id_card ON staff(id_card_number);

-- Staff salary records indexes
CREATE INDEX idx_staff_salary_records_staff_id ON staff_salary_records(staff_id);
CREATE INDEX idx_staff_salary_records_month_year ON staff_salary_records(month, year);
CREATE INDEX idx_staff_salary_records_status ON staff_salary_records(status);

-- Plaza utility bills indexes
CREATE INDEX idx_plaza_utility_bills_type ON plaza_utility_bills(utility_type);
CREATE INDEX idx_plaza_utility_bills_month_year ON plaza_utility_bills(month, year);
CREATE INDEX idx_plaza_utility_bills_status ON plaza_utility_bills(status);
CREATE INDEX idx_plaza_utility_bills_due_date ON plaza_utility_bills(due_date);

-- Fixed expenses config indexes
CREATE INDEX idx_fixed_expenses_config_type ON fixed_expenses_config(expense_type);
CREATE INDEX idx_fixed_expenses_config_status ON fixed_expenses_config(status);
CREATE INDEX idx_fixed_expenses_config_next_due ON fixed_expenses_config(next_due_date);

-- Variable expenses indexes
CREATE INDEX idx_variable_expenses_category ON variable_expenses(category);
CREATE INDEX idx_variable_expenses_date ON variable_expenses(expense_date);

-- Reminders indexes
CREATE INDEX idx_expense_reminders_type ON expense_reminders(expense_type);
CREATE INDEX idx_expense_reminders_status ON expense_reminders(status);
CREATE INDEX idx_expense_reminders_date ON expense_reminders(reminder_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaza_utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (admin-only, can be made more restrictive later)
CREATE POLICY "Allow all operations" ON staff FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON staff_salary_records FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON plaza_utility_bills FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON fixed_expenses_config FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON variable_expenses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON expense_reminders FOR ALL USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_salary_records_updated_at BEFORE UPDATE ON staff_salary_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaza_utility_bills_updated_at BEFORE UPDATE ON plaza_utility_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_expenses_config_updated_at BEFORE UPDATE ON fixed_expenses_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_expenses_updated_at BEFORE UPDATE ON variable_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_reminders_updated_at BEFORE UPDATE ON expense_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS (Future use)
-- ============================================

-- Monthly expense summary view
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT 
    year,
    month,
    'Staff Salaries' as expense_category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM staff_salary_records
WHERE status = 'paid'
GROUP BY year, month

UNION ALL

SELECT 
    year,
    month,
    CONCAT('Plaza ', utility_type) as expense_category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM plaza_utility_bills
WHERE status = 'paid' AND month IS NOT NULL
GROUP BY year, month, utility_type

UNION ALL

SELECT 
    EXTRACT(YEAR FROM expense_date)::INTEGER as year,
    EXTRACT(MONTH FROM expense_date)::INTEGER as month,
    CONCAT('Variable - ', category) as expense_category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM variable_expenses
GROUP BY EXTRACT(YEAR FROM expense_date), EXTRACT(MONTH FROM expense_date), category;
