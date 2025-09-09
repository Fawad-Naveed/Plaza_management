-- Fix the RLS policy for information table
-- Run this in Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "information_policy" ON information;

-- Create a new policy that works with Supabase auth
CREATE POLICY "information_policy" ON information
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);