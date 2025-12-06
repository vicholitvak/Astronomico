-- Migration: Add GetYourGuide reference column to bookings
-- Run this in Neon console

-- Add gyg_reference column for GetYourGuide booking references
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS gyg_reference VARCHAR(100);

-- Add index for faster lookups by GYG reference
CREATE INDEX IF NOT EXISTS idx_bookings_gyg_reference
ON bookings(gyg_reference)
WHERE gyg_reference IS NOT NULL;

-- Add country column if it doesn't exist (for GYG traveler info)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS country VARCHAR(10);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('gyg_reference', 'country')
ORDER BY column_name;
