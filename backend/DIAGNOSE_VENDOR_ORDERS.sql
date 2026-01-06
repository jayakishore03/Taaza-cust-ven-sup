-- Diagnose Vendor Orders Issue
-- The shop_id matches, so the issue is likely the shop's user_id doesn't match the vendor's logged-in user_id

-- Step 1: Check the shop and its user_id
SELECT 
    'Shop Information' as step,
    id as shop_id,
    name as shop_name,
    user_id as shop_user_id,
    email as shop_email,
    mobile_number as shop_phone
FROM shops
WHERE id = 'shop-1766319629349-etq87nd4v';

-- Step 2: Check if the shop's user_id exists in users table
SELECT 
    'Shop User ID Validation' as step,
    s.id as shop_id,
    s.name as shop_name,
    s.user_id as shop_user_id,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ User exists'
        ELSE '❌ User NOT found - This is the problem!'
    END as user_status,
    u.email as user_email,
    u.phone as user_phone,
    u.name as user_name
FROM shops s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.id = 'shop-1766319629349-etq87nd4v';

-- Step 3: Check orders for this shop (should show 2 orders)
SELECT 
    'Orders for Shop' as step,
    id as order_id,
    order_number,
    shop_id,
    user_id as customer_user_id,
    status,
    subtotal,
    delivery_charge,
    created_at
FROM orders
WHERE shop_id = 'shop-1766319629349-etq87nd4v'
ORDER BY created_at DESC;

-- Step 4: Show all shops and their user_ids for comparison
SELECT 
    'All Shops' as step,
    id as shop_id,
    name as shop_name,
    user_id,
    email,
    mobile_number
FROM shops
ORDER BY created_at DESC
LIMIT 20;

-- Step 5: Show all users (to find the vendor's user_id)
SELECT 
    'All Users' as step,
    id as user_id,
    email,
    phone,
    name
FROM users
ORDER BY created_at DESC
LIMIT 20;
