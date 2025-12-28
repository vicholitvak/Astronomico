-- Migration: Add Viator reference column to bookings table
-- Run this in your Neon database

-- Add viator_reference column for storing Viator booking references
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS viator_reference VARCHAR(100);

-- Create index for faster lookups by viator_reference
CREATE INDEX IF NOT EXISTS idx_bookings_viator_reference
ON bookings(viator_reference)
WHERE viator_reference IS NOT NULL;

-- Add 'viator' as a valid source in bookings
-- (If you have a check constraint, update it)
-- Example: ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
-- ALTER TABLE bookings ADD CONSTRAINT bookings_source_check
--   CHECK (source IN ('direct', 'gyg', 'viator', 'website', 'phone', 'whatsapp'));

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('viator_reference', 'gyg_reference', 'source');
