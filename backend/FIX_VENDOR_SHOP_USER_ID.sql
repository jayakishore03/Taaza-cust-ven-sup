-- ============================================================
-- FIX VENDOR SHOP USER_ID MISMATCH
-- ============================================================
-- This script helps identify and fix the issue where shop.user_id
-- doesn't match the vendor's Supabase Auth user_id
-- ============================================================

-- Step 1: Check the shop and its current user_id
SELECT 
  '🔍 STEP 1: Shop Information' as step,
  id as shop_id,
  name as shop_name,
  user_id as current_shop_user_id,
  email as shop_email,
  mobile_number as shop_phone
FROM shops
WHERE id = 'shop-1766319629349-etq87nd4v';

-- Step 2: Check if shop's user_id exists in auth.users (Supabase Auth)
SELECT 
  '🔍 STEP 2: Check if shop user_id exists in Supabase Auth' as step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as shop_user_id,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ EXISTS in auth.users'
    ELSE '❌ NOT FOUND in auth.users - This is the problem!'
  END as auth_user_status,
  au.email as auth_email,
  au.phone as auth_phone
FROM shops s
LEFT JOIN auth.users au ON s.user_id = au.id
WHERE s.id = 'shop-1766319629349-etq87nd4v';

-- Step 3: Show all Supabase Auth users (to find the vendor's user_id)
-- Look for the vendor's email or phone in this list
SELECT 
  '🔍 STEP 3: All Supabase Auth Users' as step,
  id as auth_user_id,
  email,
  phone,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- Step 4: Show orders for this shop (to confirm orders exist)
SELECT 
  '🔍 STEP 4: Orders for Shop' as step,
  COUNT(*) as total_orders,
  shop_id
FROM orders
WHERE shop_id = 'shop-1766319629349-etq87nd4v'
GROUP BY shop_id;

-- Step 5: Show recent orders
SELECT 
  '🔍 STEP 5: Recent Orders' as step,
  id as order_id,
  order_number,
  shop_id,
  status,
  subtotal,
  delivery_charge,
  created_at
FROM orders
WHERE shop_id = 'shop-1766319629349-etq87nd4v'
ORDER BY created_at DESC;

-- ============================================================
-- FIX: Update shop.user_id to match vendor's Supabase Auth user_id
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Check Vercel logs when vendor logs in
--    - Look for: "Vendor User ID (from Supabase Auth):"
--    - Copy that UUID
--
-- 2. OR find the vendor's user_id from Step 3 above
--    - Look for the vendor's email or phone
--    - Copy the auth_user_id (UUID)
--
-- 3. Run this UPDATE statement (replace VENDOR_AUTH_USER_ID with the UUID):
--
--    UPDATE shops 
--    SET user_id = 'VENDOR_AUTH_USER_ID'
--    WHERE id = 'shop-1766319629349-etq87nd4v';
--
-- 4. Verify the fix:
--    Run Step 2 again - it should now show "✅ EXISTS in auth.users"
--
-- 5. Test:
--    - Have vendor log out and log back in
--    - Orders should now appear in vendor app
--
-- ============================================================

-- Example UPDATE (UNCOMMENT AND REPLACE THE UUID):
-- UPDATE shops 
-- SET user_id = '00000000-0000-0000-0000-000000000000'  -- Replace with actual vendor auth user_id
-- WHERE id = 'shop-1766319629349-etq87nd4v';

-- Verify after update:
-- SELECT 
--   '✅ VERIFICATION: Shop User ID Updated' as step,
--   s.id as shop_id,
--   s.name as shop_name,
--   s.user_id as shop_user_id,
--   au.email as auth_email,
--   au.phone as auth_phone,
--   CASE 
--     WHEN au.id IS NOT NULL THEN '✅ FIXED - Shop user_id matches auth user'
--     ELSE '❌ STILL BROKEN - Check the user_id value'
--   END as status
-- FROM shops s
-- LEFT JOIN auth.users au ON s.user_id = au.id
-- WHERE s.id = 'shop-1766319629349-etq87nd4v';

