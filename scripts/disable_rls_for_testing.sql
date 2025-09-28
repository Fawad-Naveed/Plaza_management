-- Temporarily disable RLS on queries table for testing
-- This will allow all operations without authentication checks
-- IMPORTANT: Only use this for testing, re-enable RLS in production

ALTER TABLE queries DISABLE ROW LEVEL SECURITY;

-- To re-enable later (after fixing the auth), run:
-- ALTER TABLE queries ENABLE ROW LEVEL SECURITY;