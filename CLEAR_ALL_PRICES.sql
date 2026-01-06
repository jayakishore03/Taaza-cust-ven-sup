-- ============================================================
-- CLEAR ALL PRICES FROM PRODUCTS TABLE
-- This script removes all existing prices from the products table
-- Prices will only be set when vendors enter them in the vendor app
-- IMPORTANT: After running this, vendors must set prices in the vendor app
-- ============================================================

-- Clear all prices and shop associations from products table
-- This ensures only vendor-set prices will be displayed
UPDATE products
SET 
  price = 0,
  price_per_kg = 0,
  original_price = NULL,
  discount_percentage = 0,
  shop_id = NULL,
  updated_at = now();

-- Verify the update
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN price_per_kg > 0 THEN 1 END) as products_with_price,
  COUNT(CASE WHEN price_per_kg = 0 OR price_per_kg IS NULL THEN 1 END) as products_without_price,
  COUNT(CASE WHEN shop_id IS NOT NULL THEN 1 END) as products_with_shop_id,
  COUNT(CASE WHEN shop_id IS NULL THEN 1 END) as products_without_shop_id
FROM products;

