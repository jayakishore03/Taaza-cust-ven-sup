-- ============================================================
-- FIX ADDRESSES TABLE FOREIGN KEY CONSTRAINT
-- ============================================================
-- This fixes the foreign key issue when saving addresses
-- Run this in Supabase SQL Editor if you're getting foreign key errors
-- ============================================================

-- ========================================
-- STEP 1: DROP EXISTING FOREIGN KEY (if it exists and is broken)
-- ========================================

ALTER TABLE addresses 
  DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;

-- ========================================
-- STEP 2: RECREATE FOREIGN KEY TO USERS TABLE
-- ========================================

-- Add foreign key constraint to users table
ALTER TABLE addresses
  ADD CONSTRAINT addresses_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- ========================================
-- STEP 3: VERIFY THE CONSTRAINT
-- ========================================

-- Check if constraint exists
SELECT 
  '✅ Foreign key constraint created' as status,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'addresses_user_id_fkey';

-- ========================================
-- STEP 4: CHECK FOR ORPHANED ADDRESSES
-- ========================================

-- Find addresses with user_id that doesn't exist in users table
SELECT 
  '⚠️  Orphaned addresses found' as status,
  COUNT(*) as orphaned_count
FROM addresses a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;

-- If you want to clean up orphaned addresses (uncomment to run):
-- DELETE FROM addresses 
-- WHERE user_id NOT IN (SELECT id FROM users);

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '
========================================
✅ ADDRESSES FOREIGN KEY FIXED!
========================================

WHAT WAS DONE:
✅ Dropped broken foreign key constraint
✅ Recreated foreign key to users table
✅ Verified constraint exists

NEXT STEPS:
1. Try saving an address again in the app
2. If you still get errors, check the terminal logs
3. Make sure the user_id exists in the users table

========================================
' as fix_complete;


