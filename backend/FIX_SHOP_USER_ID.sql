-- Fix Shop User ID Mismatch
-- This script updates the shop's user_id to match the vendor's logged-in user_id
-- 
-- IMPORTANT: Replace 'VENDOR_USER_ID_HERE' with the actual vendor's user_id
-- You can find the vendor's user_id by:
-- 1. Checking Vercel logs when vendor logs in
-- 2. Or checking the users table for the vendor's email/phone

-- Step 1: First, let's see the current shop's user_id
SELECT 
    'Current Shop User ID' as step,
    id as shop_id,
    name as shop_name,
    user_id as current_user_id
FROM shops
WHERE id = 'shop-1766319629349-etq87nd4v';

-- Step 2: Update the shop's user_id
-- REPLACE 'VENDOR_USER_ID_HERE' with the actual vendor's user_id from users table
-- Example: If vendor's user_id is 'abc123-def456-ghi789', use:
-- UPDATE shops SET user_id = 'abc123-def456-ghi789' WHERE id = 'shop-1766319629349-etq87nd4v';

-- Uncomment and update the line below with the correct vendor user_id:
-- UPDATE shops 
-- SET user_id = 'VENDOR_USER_ID_HERE' 
-- WHERE id = 'shop-1766319629349-etq87nd4v';

-- Step 3: Verify the update
SELECT 
    'Updated Shop User ID' as step,
    s.id as shop_id,
    s.name as shop_name,
    s.user_id as shop_user_id,
    u.email as vendor_email,
    u.phone as vendor_phone,
    u.name as vendor_name
FROM shops s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.id = 'shop-1766319629349-etq87nd4v';

