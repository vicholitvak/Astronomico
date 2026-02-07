-- Migration: Add access_token column to galleries for private gallery links
-- Run: node scripts/run-migration.js database/migration-gallery-access-token.sql

-- Add access_token column
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS access_token VARCHAR(24);

-- Generate tokens for existing galleries
UPDATE galleries
SET access_token = substr(md5(random()::text || id::text || now()::text), 1, 12)
WHERE access_token IS NULL;

COMMENT ON COLUMN galleries.access_token IS 'Token for private gallery access links (?key=token)';
