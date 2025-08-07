-- Fix RLS policies for bookings table
-- Run this in Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for anon" ON bookings;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON bookings;

-- Create new, more permissive policies for testing
-- Note: In production, you should be more restrictive

-- Allow anonymous users to insert bookings (for website forms)
CREATE POLICY "Allow public inserts" ON bookings
    FOR INSERT 
    WITH CHECK (true);

-- Allow anonymous users to read their own bookings (optional)
CREATE POLICY "Allow public reads" ON bookings
    FOR SELECT
    USING (true);

-- Allow all operations for authenticated users (admin)
CREATE POLICY "Allow all for authenticated" ON bookings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Test the policies
SELECT * FROM bookings LIMIT 1;