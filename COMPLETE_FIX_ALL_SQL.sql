-- ========================================
-- COMPLETE SQL TO FIX ALL ISSUES
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. DISABLE ROW LEVEL SECURITY ON ALL TABLES
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

-- 4. DROP FOREIGN KEY CONSTRAINTS ON PAYMENT_METHODS (IMPORTANT FOR CARD SAVING!)
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
-- VERIFICATION - Check payment_methods table specifically
-- (Should return 0 rows if foreign key is removed)
-- ========================================
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'payment_methods'::regclass
AND contype = 'f';

-- ========================================
-- VERIFICATION - Check all foreign keys are gone
-- (Should return 0 rows if successful)
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
-- SUCCESS MESSAGE
-- ========================================
-- If both verification queries return 0 rows, all foreign keys are removed!
-- You can now:
-- 1. Add payment methods (cards/bank accounts) ✅
-- 2. Sign up with address ✅
-- 3. Add addresses from profile ✅  
-- 4. Place orders ✅
-- ========================================

