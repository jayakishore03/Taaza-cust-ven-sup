-- ============================================================
-- FIX VENDOR SHOP - IMMEDIATE FIX
-- ============================================================
-- Vendor User ID from logs: 29353d7e-e658-4c43-9921-1cd9ebe1dcbf
-- Shop ID with orders: shop-1766319629349-etq87nd4v
-- ============================================================

-- Step 1: Check the vendor's auth user info
SELECT 
  '🔍 STEP 1: Vendor Auth User Info' as step,
  id as auth_user_id,
  email,
  phone,
  created_at
FROM auth.users
WHERE id = '29353d7e-e658-4c43-9921-1cd9ebe1dcbf';

-- Step 2: Check the shop and its current user_id
SELECT 
  '🔍 STEP 2: Shop Information' as step,
  id as shop_id,
  name as shop_name,
  user_id as current_shop_user_id,
  email as shop_email,
  mobile_number as shop_phone
FROM shops
WHERE id = 'shop-1766319629349-etq87nd4v';

-- Step 3: Check if shop email/phone matches vendor email/phone
SELECT 
  '🔍 STEP 3: Shop-Vendor Match Check' as step,
  s.id as shop_id,
  s.name as shop_name,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  au.id as vendor_auth_id,
  au.email as vendor_email,
  au.phone as vendor_phone,
  CASE 
    WHEN s.email = au.email THEN '✅ Email matches'
    WHEN s.mobile_number = au.phone THEN '✅ Phone matches'
    WHEN s.user_id = au.id THEN '✅ User ID matches'
    ELSE '❌ No match found'
  END as match_status
FROM shops s
CROSS JOIN auth.users au
WHERE s.id = 'shop-1766319629349-etq87nd4v'
  AND au.id = '29353d7e-e658-4c43-9921-1cd9ebe1dcbf';

-- Step 4: Check orders for this shop
SELECT 
  '🔍 STEP 4: Orders for Shop' as step,
  COUNT(*) as total_orders
FROM orders
WHERE shop_id = 'shop-1766319629349-etq87nd4v';

-- ============================================================
-- FIX: Update shop.user_id to match vendor's auth user_id
-- ============================================================
-- This will make the shop lookup work immediately
UPDATE shops 
SET user_id = '29353d7e-e658-4c43-9921-1cd9ebe1dcbf'
WHERE id = 'shop-1766319629349-etq87nd4v';

-- Verify the fix
SELECT 
  '✅ VERIFICATION: Shop User ID Updated' as step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as shop_user_id,
  au.email as vendor_email,
  au.phone as vendor_phone,
  CASE 
    WHEN s.user_id = au.id THEN '✅ FIXED - Shop user_id now matches vendor auth user_id'
    ELSE '❌ STILL BROKEN'
  END as status
FROM shops s
LEFT JOIN auth.users au ON s.user_id = au.id
WHERE s.id = 'shop-1766319629349-etq87nd4v';

