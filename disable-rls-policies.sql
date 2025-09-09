-- Option 1: Disable RLS for all tables (simplest solution)
-- Run these commands in your Supabase SQL Editor

-- Disable RLS for main tables
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE floors DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE advances DISABLE ROW LEVEL SECURITY;
ALTER TABLE instalments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons DISABLE ROW LEVEL SECURITY;
ALTER TABLE terms_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE information DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create public access policies
-- Uncomment the lines below if you prefer this approach

/*
-- Create public read policies for all tables
CREATE POLICY "public_read_businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "public_read_floors" ON floors FOR SELECT USING (true);
CREATE POLICY "public_read_bills" ON bills FOR SELECT USING (true);
CREATE POLICY "public_read_maintenance_bills" ON maintenance_bills FOR SELECT USING (true);
CREATE POLICY "public_read_advances" ON advances FOR SELECT USING (true);
CREATE POLICY "public_read_instalments" ON instalments FOR SELECT USING (true);
CREATE POLICY "public_read_payments" ON payments FOR SELECT USING (true);
CREATE POLICY "public_read_contact_persons" ON contact_persons FOR SELECT USING (true);
CREATE POLICY "public_read_terms_conditions" ON terms_conditions FOR SELECT USING (true);
CREATE POLICY "public_read_information" ON information FOR SELECT USING (true);

-- Create public insert/update/delete policies if needed
CREATE POLICY "public_insert_businesses" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_businesses" ON businesses FOR UPDATE USING (true);
CREATE POLICY "public_delete_businesses" ON businesses FOR DELETE USING (true);
-- Repeat for other tables as needed
*/

