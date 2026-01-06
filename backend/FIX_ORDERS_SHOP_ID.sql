-- Fix Orders Shop ID Mismatch
-- Orders have shop_id: shop-1766319629349-etq87nd4v
-- Vendor's actual shop_id: shop-1766319629349-otq87nd4v
-- This script updates all orders to use the correct shop_id

-- First, let's verify the mismatch
SELECT 
    'Orders with incorrect shop_id' as description,
    COUNT(*) as count,
    shop_id
FROM orders
WHERE shop_id = 'shop-1766319629349-etq87nd4v'
GROUP BY shop_id;

-- Check if the correct shop exists
SELECT 
    'Correct shop exists' as description,
    id,
    name,
    user_id
FROM shops
WHERE id = 'shop-1766319629349-otq87nd4v';

-- Update all orders with incorrect shop_id to use the correct shop_id
UPDATE orders
SET shop_id = 'shop-1766319629349-otq87nd4v'
WHERE shop_id = 'shop-1766319629349-etq87nd4v';

-- Verify the update
SELECT 
    'Updated orders' as description,
    COUNT(*) as count,
    shop_id
FROM orders
WHERE shop_id = 'shop-1766319629349-otq87nd4v'
GROUP BY shop_id;

-- Show all orders for this shop
SELECT 
    id,
    order_number,
    shop_id,
    status,
    subtotal,
    delivery_charge,
    created_at
FROM orders
WHERE shop_id = 'shop-1766319629349-otq87nd4v'
ORDER BY created_at DESC;

