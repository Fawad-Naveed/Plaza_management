-- Add authentication fields to businesses table
-- Run this script to add username and password fields for business authentication

-- Add username and password_hash columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create index for better performance on username lookups
CREATE INDEX IF NOT EXISTS idx_businesses_username ON businesses(username);

-- Add constraint to ensure username is provided when password_hash is provided
-- (Optional - you can remove this if you want to allow businesses without login credentials)
-- ALTER TABLE businesses ADD CONSTRAINT businesses_auth_check 
-- CHECK ((username IS NULL AND password_hash IS NULL) OR (username IS NOT NULL AND password_hash IS NOT NULL));

-- Note: Admin credentials will be hardcoded in the application
-- Admin username: "admin"
-- Admin password: "admin123" (should be changed in production)