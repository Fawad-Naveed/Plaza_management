-- Owner and Admin Management System
-- This script creates the tables and policies for owner/admin role-based access control

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create owners table
CREATE TABLE IF NOT EXISTS owners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES owners(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admin_id, permission_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission_key ON admin_permissions(permission_key);

-- Enable Row Level Security
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for owners table (allow all operations for now)
DROP POLICY IF EXISTS "Allow all operations on owners" ON owners;
CREATE POLICY "Allow all operations on owners" ON owners FOR ALL USING (true);

-- Create policies for admins table (allow all operations for now)
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
CREATE POLICY "Allow all operations on admins" ON admins FOR ALL USING (true);

-- Create policies for admin_permissions table (allow all operations for now)
DROP POLICY IF EXISTS "Allow all operations on admin_permissions" ON admin_permissions;
CREATE POLICY "Allow all operations on admin_permissions" ON admin_permissions FOR ALL USING (true);

-- Seed default owner account
-- Password: owner123 (hashed with bcrypt, 10 rounds)
-- NOTE: You should change this password after first login through the settings!
INSERT INTO owners (username, password_hash, email, full_name)
VALUES (
    'owner',
    '$2b$10$hQFN5xdHrfj5HvphX8nZweLhD8rzxkHEw2Pc/DiIACvnBRIUUS.mu', -- Password: owner123
    'owner@plazamanagement.com',
    'System Owner'
)
ON CONFLICT (username) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_owners_updated_at ON owners;
CREATE TRIGGER update_owners_updated_at
    BEFORE UPDATE ON owners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view to easily see admin permissions
CREATE OR REPLACE VIEW admin_permissions_view AS
SELECT 
    a.id as admin_id,
    a.username,
    a.email,
    a.full_name,
    a.is_active,
    array_agg(ap.permission_key) FILTER (WHERE ap.can_access = true) as permissions,
    a.created_at,
    a.updated_at
FROM admins a
LEFT JOIN admin_permissions ap ON a.id = ap.admin_id
GROUP BY a.id, a.username, a.email, a.full_name, a.is_active, a.created_at, a.updated_at;

-- Grant permissions on the view
GRANT SELECT ON admin_permissions_view TO authenticated, anon;
