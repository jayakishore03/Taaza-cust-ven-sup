-- ============================================================
-- CHECK SHOP STATUS (is_open) IN DATABASE
-- ============================================================
-- Run this query to verify if shop status was updated correctly
-- ============================================================

-- Check all shops and their is_open status
SELECT 
  id as shop_id,
  name as shop_name,
  is_open,
  is_active,
  is_approved,
  CASE 
    WHEN is_open = true THEN '✅ OPEN (visible in customer app)'
    WHEN is_open = false THEN '❌ CLOSED (hidden from customer app)'
    WHEN is_open IS NULL THEN '⚠️ NULL (treated as closed)'
    ELSE '❓ UNKNOWN'
  END as status_description
FROM shops
ORDER BY created_at DESC;

-- Check specific shop (replace with your shop ID)
-- SELECT 
--   id as shop_id,
--   name as shop_name,
--   is_open,
--   is_active,
--   is_approved,
--   CASE 
--     WHEN is_open = true THEN '✅ OPEN'
--     WHEN is_open = false THEN '❌ CLOSED'
--     WHEN is_open IS NULL THEN '⚠️ NULL'
--   END as status
-- FROM shops
-- WHERE id = 'your-shop-id-here';

