-- ========================================
-- DELETE ALL USERS FROM SUPABASE
-- ⚠️ WARNING: PERMANENT DELETION!
-- ========================================

-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click RUN
-- 5. Verify results

-- ========================================
-- STEP 1: Check current user count
-- ========================================

SELECT 
  'BEFORE DELETION' as status,
  COUNT(*) as user_count,
  'These users will be deleted' as note
FROM users;

-- ========================================
-- STEP 2: Delete related data first
-- ========================================

-- Delete login sessions
DELETE FROM login_sessions;

-- Delete activity logs  
DELETE FROM activity_logs;

-- Delete order timeline
DELETE FROM order_timeline;

-- Delete order items
DELETE FROM order_items;

-- Delete orders
DELETE FROM orders;

-- Delete addresses
DELETE FROM addresses;

-- Delete user profiles
DELETE FROM user_profiles;

-- Delete users (main table)
DELETE FROM users;

-- ========================================
-- STEP 3: Verify deletion
-- ========================================

SELECT 
  'AFTER DELETION' as status,
  COUNT(*) as remaining_users,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users deleted successfully'
    ELSE '⚠️ Some users remain'
  END as result
FROM users;

-- ========================================
-- STEP 4: Check all user-related tables
-- ========================================

SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(*) FROM addresses) as addresses,
  (SELECT COUNT(*) FROM orders) as orders,
  (SELECT COUNT(*) FROM order_items) as order_items,
  (SELECT COUNT(*) FROM login_sessions) as sessions,
  (SELECT COUNT(*) FROM activity_logs) as logs;

-- All counts should be 0
-- If any are not 0, the deletion was not complete

-- ========================================
-- COMPLETED!
-- ========================================
-- 
-- What was deleted:
--   ❌ All users
--   ❌ All user profiles  
--   ❌ All addresses
--   ❌ All orders
--   ❌ All login sessions
--   ❌ All activity logs
--
-- What remains:
--   ✅ Products
--   ✅ Shops
--   ✅ Addons
--   ✅ Coupons
--   ✅ Table structures
--
-- Database is ready for fresh user registrations!
-- ========================================

