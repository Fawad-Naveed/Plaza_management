-- Sample data for Plaza Management System (PKR Currency)
-- Run this in your Supabase SQL Editor to add test data

-- Insert sample businesses
INSERT INTO businesses (name, type, contact_person, phone, email, floor_number, shop_number, area_sqft, rent_amount, security_deposit, lease_start_date, lease_end_date, status) VALUES
('Tech Solutions Ltd', 'IT Services', 'John Doe', '+1234567890', 'john@techsolutions.com', 1, 'A101', 500.00, 15000.00, 30000.00, '2024-01-01', '2025-12-31', 'active'),
('Fashion Boutique', 'Retail', 'Jane Smith', '+1234567891', 'jane@fashionboutique.com', 1, 'A102', 400.00, 12000.00, 24000.00, '2024-01-01', '2025-12-31', 'active'),
('Coffee Corner', 'Food & Beverage', 'Mike Johnson', '+1234567892', 'mike@coffeecorner.com', 2, 'B201', 300.00, 10000.00, 20000.00, '2024-01-01', '2025-12-31', 'active'),
('Digital Marketing Hub', 'Marketing', 'Sarah Wilson', '+1234567893', 'sarah@digitalmarketing.com', 2, 'B202', 600.00, 18000.00, 36000.00, '2024-01-01', '2025-12-31', 'active'),
('Fitness Studio', 'Health & Fitness', 'David Brown', '+1234567894', 'david@fitnessstudio.com', 3, 'C301', 800.00, 25000.00, 50000.00, '2024-01-01', '2025-12-31', 'active');

-- Insert sample floors
INSERT INTO floors (floor_number, floor_name, total_shops, occupied_shops, total_area_sqft) VALUES
(1, 'Ground Floor', 10, 2, 5000.00),
(2, 'First Floor', 10, 2, 5000.00),
(3, 'Second Floor', 8, 1, 4000.00);

-- Get business IDs for reference (you'll need to replace these with actual UUIDs from your database)
-- For now, let's create some sample bills and payments

-- Insert sample regular bills (rent bills)
INSERT INTO bills (business_id, bill_number, bill_date, due_date, rent_amount, electricity_charges, water_charges, total_amount, status) 
SELECT 
    b.id,
    'RENT-2024-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    '2024-01-01'::date,
    '2024-01-31'::date,
    b.rent_amount,
    b.rent_amount * 0.2, -- 20% of rent as electricity
    b.rent_amount * 0.1, -- 10% of rent as water
    b.rent_amount * 1.3, -- Total = rent + electricity + water
    'paid'
FROM businesses b
WHERE b.status = 'active';

-- Insert sample payments for the bills
INSERT INTO payments (business_id, bill_id, payment_date, amount, payment_method, notes)
SELECT 
    b.business_id,
    b.id,
    '2024-01-15'::date,
    b.total_amount,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'cash'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'upi'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'card'
        ELSE 'bank_transfer'
    END,
    'January 2024 rent payment'
FROM bills b;

-- Insert sample maintenance bills
INSERT INTO maintenance_bills (business_id, bill_number, bill_date, due_date, description, category, amount, status)
SELECT 
    b.id,
    'MAINT-2024-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    '2024-01-01'::date,
    '2024-01-15'::date,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'Monthly cleaning and maintenance'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'AC repair and servicing'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'Plumbing maintenance'
        ELSE 'General maintenance work'
    END,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'cleaning'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'repair'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'general'
        ELSE 'emergency'
    END,
    2000 + (ROW_NUMBER() OVER() * 500), -- Varying amounts
    'paid'
FROM businesses b
WHERE b.status = 'active';

-- Insert sample maintenance payments
INSERT INTO maintenance_payments (business_id, maintenance_bill_id, payment_date, amount, payment_method, notes)
SELECT 
    mb.business_id,
    mb.id,
    '2024-01-10'::date,
    mb.amount,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'cash'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'upi'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'card'
        ELSE 'bank_transfer'
    END,
    'January 2024 maintenance payment'
FROM maintenance_bills mb;

-- Insert some February data as well
INSERT INTO bills (business_id, bill_number, bill_date, due_date, rent_amount, electricity_charges, water_charges, total_amount, status) 
SELECT 
    b.id,
    'RENT-2024-' || LPAD((ROW_NUMBER() OVER() + 100)::text, 3, '0'),
    '2024-02-01'::date,
    '2024-02-28'::date,
    b.rent_amount,
    b.rent_amount * 0.25, -- Slightly higher electricity in Feb
    b.rent_amount * 0.1,
    b.rent_amount * 1.35,
    'paid'
FROM businesses b
WHERE b.status = 'active';

INSERT INTO payments (business_id, bill_id, payment_date, amount, payment_method, notes)
SELECT 
    b.business_id,
    b.id,
    '2024-02-15'::date,
    b.total_amount,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'cash'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'upi'
        WHEN ROW_NUMBER() OVER() % 4 = 3 THEN 'card'
        ELSE 'bank_transfer'
    END,
    'February 2024 rent payment'
FROM bills b
WHERE b.bill_number LIKE 'RENT-2024-1%';

-- Insert some unpaid bills for March to show outstanding amounts
INSERT INTO bills (business_id, bill_number, bill_date, due_date, rent_amount, electricity_charges, water_charges, total_amount, status) 
SELECT 
    b.id,
    'RENT-2024-' || LPAD((ROW_NUMBER() OVER() + 200)::text, 3, '0'),
    '2024-03-01'::date,
    '2024-03-31'::date,
    b.rent_amount,
    b.rent_amount * 0.22,
    b.rent_amount * 0.1,
    b.rent_amount * 1.32,
    'pending'
FROM businesses b
WHERE b.status = 'active';

INSERT INTO maintenance_bills (business_id, bill_number, bill_date, due_date, description, category, amount, status)
SELECT 
    b.id,
    'MAINT-2024-' || LPAD((ROW_NUMBER() OVER() + 100)::text, 3, '0'),
    '2024-03-01'::date,
    '2024-03-15'::date,
    'March maintenance and cleaning',
    'cleaning',
    2500,
    'pending'
FROM businesses b
WHERE b.status = 'active';