-- ============================================
-- MIGRATION: ADD selfie_url COLUMN TO delivery_agents TABLE
-- ============================================
-- This script adds the missing selfie_url column to the existing delivery_agents table
-- Run this if you already created the delivery_agents table without the selfie_url column
-- ============================================

-- Add selfie_url column if it doesn't exist
ALTER TABLE delivery_agents
  ADD COLUMN IF NOT EXISTS selfie_url text;

-- Add comment for the column
COMMENT ON COLUMN delivery_agents.selfie_url IS 'URL of the selfie photo taken during registration';

-- Verify the column was added
SELECT 
  '✅ VERIFICATION: selfie_url column added' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'delivery_agents'
  AND column_name = 'selfie_url';

SELECT '✅ Migration complete: selfie_url column added to delivery_agents table' as status;

