-- ========================================
-- VERIFICATION QUERIES
-- Run this after running the fix migration
-- ========================================

-- Verification 1: Check payment_methods table specifically
-- (Should return 0 rows if foreign key is removed)
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'payment_methods'::regclass
AND contype = 'f';

-- Verification 2: Check all foreign keys are gone
-- (Should return 0 rows if successful)
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid IN (
  'users'::regclass,
  'user_profiles'::regclass,
  'addresses'::regclass,
  'orders'::regclass,
  'order_items'::regclass,
  'order_timeline'::regclass,
  'login_sessions'::regclass,
  'payment_methods'::regclass
)
AND contype = 'f'
ORDER BY table_name, constraint_name;

-- Verification 3: Check if special_instructions column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'special_instructions';

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- Query 1 & 2: Should return 0 rows (no foreign keys)
-- Query 3: Should return 1 row with special_instructions column
-- ========================================

