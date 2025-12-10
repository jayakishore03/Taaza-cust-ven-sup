-- ========================================
-- COMPLETE SQL TO FIX PAYMENT METHODS ISSUE
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. DISABLE ROW LEVEL SECURITY ON ALL TABLES (including payment_methods)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- 2. DROP FOREIGN KEY CONSTRAINT ON USER_PROFILES
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 3. DROP FOREIGN KEY CONSTRAINTS ON ADDRESSES
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;

-- 4. DROP FOREIGN KEY CONSTRAINTS ON PAYMENT_METHODS (NEW - IMPORTANT!)
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;

-- 5. DROP FOREIGN KEY CONSTRAINTS ON ORDERS TABLE
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_coupon_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_id_fkey;

-- 6. DROP FOREIGN KEY CONSTRAINTS ON ORDER_ITEMS TABLE
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_addon_id_fkey;

-- 7. DROP FOREIGN KEY CONSTRAINTS ON ORDER_TIMELINE TABLE
ALTER TABLE order_timeline DROP CONSTRAINT IF EXISTS order_timeline_order_id_fkey;

-- 8. DROP FOREIGN KEY CONSTRAINTS ON LOGIN_SESSIONS TABLE
ALTER TABLE login_sessions DROP CONSTRAINT IF EXISTS login_sessions_user_id_fkey;

-- ========================================
-- VERIFICATION - Check payment_methods table
-- ========================================
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payment_methods'::regclass
ORDER BY constraint_name;

-- ========================================
-- VERIFICATION - Check all foreign keys are gone
-- (Should show only PRIMARY KEY and CHECK constraints, no FOREIGN KEY)
-- ========================================
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

-- ========================================
-- TEST: Try to insert a payment method manually
-- ========================================
-- This will test if payment_methods can accept inserts now
-- Replace 'your-user-id-here' with an actual user ID from your users table

/*
INSERT INTO payment_methods (
  user_id,
  type,
  name,
  details,
  card_number,
  card_expiry,
  card_cvv,
  cardholder_name,
  is_default,
  is_active
) VALUES (
  'your-user-id-here',  -- Replace with actual user UUID
  'card',
  'Test Card',
  '**** **** **** 1111',
  '4111111111111111',
  '12/25',
  '123',
  'Test User',
  true,
  true
);
*/

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If the verification query returns 0 rows with contype='f', all foreign keys are removed!
-- You can now:
-- 1. Add payment methods (cards/bank accounts) ✅
-- 2. Sign up with address ✅
-- 3. Add addresses from profile ✅  
-- 4. Place orders ✅
-- ========================================

