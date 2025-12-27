-- Fix order-related foreign key constraints
-- Run this in Supabase SQL Editor

-- Drop foreign key constraints on orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_coupon_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_id_fkey;

-- Drop foreign key constraints on order_items table
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_addon_id_fkey;

-- Drop foreign key constraints on order_timeline table
ALTER TABLE order_timeline DROP CONSTRAINT IF EXISTS order_timeline_order_id_fkey;

-- Verify constraints are dropped
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid IN ('orders'::regclass, 'order_items'::regclass, 'order_timeline'::regclass)
  AND contype = 'f'
ORDER BY table_name, constraint_name;

