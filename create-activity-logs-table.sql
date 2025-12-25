-- Activity Logs Table for Audit Trail
-- This script creates the activity_logs table to track all user actions in the system

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,  -- Can be owner, admin, or business ID
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('owner', 'admin', 'business')),
    username VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,  -- e.g., 'bill_generated', 'payment_approved'
    entity_type VARCHAR(100),  -- e.g., 'bill', 'payment', 'business', 'admin'
    entity_id UUID,  -- Reference to the affected entity
    entity_name VARCHAR(255),  -- Business name, bill number, etc. for quick display
    description TEXT,  -- Human-readable description of the action
    old_value JSONB,  -- Previous state (for edits)
    new_value JSONB,  -- New state (for edits)
    amount DECIMAL(10, 2),  -- For financial transactions
    notes TEXT,  -- Additional comments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON activity_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_username ON activity_logs(username);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_name ON activity_logs(entity_name);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_date ON activity_logs(entity_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (can be restricted later)
DROP POLICY IF EXISTS "Allow all operations on activity_logs" ON activity_logs;
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL USING (true);

-- Create a view for easy querying with formatted data
CREATE OR REPLACE VIEW activity_logs_view AS
SELECT 
    al.id,
    al.user_id,
    al.user_type,
    al.username,
    al.action_type,
    al.entity_type,
    al.entity_id,
    al.entity_name,
    al.description,
    al.old_value,
    al.new_value,
    al.amount,
    al.notes,
    al.created_at,
    -- Add formatted timestamp for display
    TO_CHAR(al.created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_date
FROM activity_logs al
ORDER BY al.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON activity_logs_view TO authenticated, anon;

-- Add comment to table
COMMENT ON TABLE activity_logs IS 'Audit trail for all user actions in the system';
COMMENT ON COLUMN activity_logs.user_type IS 'Type of user: owner, admin, or business';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action performed (e.g., bill_generated, payment_approved)';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected (e.g., bill, payment, business, admin)';
COMMENT ON COLUMN activity_logs.old_value IS 'Previous state in JSON format (for edits)';
COMMENT ON COLUMN activity_logs.new_value IS 'New state in JSON format (for edits)';
