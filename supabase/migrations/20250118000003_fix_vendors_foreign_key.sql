-- ========================================
-- Fix Vendors Table Foreign Key Constraint
-- Remove foreign key constraint to match other tables
-- ========================================

-- Drop the foreign key constraint on vendors.user_id
ALTER TABLE IF EXISTS vendors 
DROP CONSTRAINT IF EXISTS vendors_user_id_fkey;

-- Make user_id nullable (optional) since we're removing the constraint
-- This allows vendors to be created even if user doesn't exist yet
ALTER TABLE IF EXISTS vendors 
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN vendors.user_id IS 'Reference to auth.users(id) - No foreign key constraint to allow flexible user creation';

