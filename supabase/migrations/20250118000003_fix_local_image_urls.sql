-- ============================================================
-- Fix Local Image URLs in Shops Table
-- This migration fixes shops that have local file URIs instead of proper Supabase Storage URLs
-- ============================================================

-- ========================================
-- PART 1: IDENTIFY PROBLEMATIC SHOPS
-- ========================================

-- Display shops with local file paths (for review before fixing)
SELECT 
  id,
  name,
  owner_name,
  image_url,
  CASE 
    WHEN image_url LIKE 'file:///%' THEN 'Local Android path'
    WHEN image_url LIKE 'file://data/%' THEN 'Local Android path'
    WHEN image_url LIKE 'file:///var/%' THEN 'Local iOS path'
    WHEN image_url LIKE 'https://via.placeholder%' THEN 'Placeholder image'
    WHEN image_url LIKE 'https://%supabase%' THEN 'Valid Supabase URL'
    WHEN image_url LIKE 'https://%' THEN 'Valid external URL'
    ELSE 'Unknown format'
  END as url_status
FROM shops
WHERE image_url IS NOT NULL
ORDER BY 
  CASE 
    WHEN image_url LIKE 'file:///%' THEN 1
    WHEN image_url LIKE 'https://via.placeholder%' THEN 2
    WHEN image_url LIKE 'https://%' THEN 3
    ELSE 4
  END,
  created_at DESC;

-- ========================================
-- PART 2: UPDATE SHOPS WITH LOCAL FILE PATHS
-- ========================================

-- Option 1: Set placeholder images for shops with local file paths
-- This allows shops to display with a placeholder until real images are uploaded
UPDATE shops
SET 
  image_url = 'https://via.placeholder.com/400x300?text=' || REPLACE(name, ' ', '+'),
  store_photos = '[]'::jsonb
WHERE 
  image_url LIKE 'file:///%'
  OR image_url LIKE 'file://data/%'
  OR image_url LIKE 'file:///var/%';

-- ========================================
-- PART 3: CLEAN UP STORE_PHOTOS ARRAY
-- ========================================

-- Remove local file paths from store_photos array
UPDATE shops
SET store_photos = '[]'::jsonb
WHERE store_photos::text LIKE '%file:///%';

-- ========================================
-- PART 4: VERIFICATION
-- ========================================

-- Display updated shops
SELECT 
  id,
  name,
  owner_name,
  image_url,
  store_photos,
  CASE 
    WHEN image_url LIKE 'https://%supabase%' THEN '✅ Valid Supabase URL'
    WHEN image_url LIKE 'https://via.placeholder%' THEN '⚠️ Placeholder (needs re-upload)'
    WHEN image_url LIKE 'https://%' THEN '✅ Valid external URL'
    WHEN image_url LIKE 'file:///%' THEN '❌ Still has local path!'
    ELSE '❓ Unknown format'
  END as url_status
FROM shops
WHERE image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Count shops by URL status
SELECT 
  CASE 
    WHEN image_url LIKE 'https://%supabase%' THEN 'Supabase URLs'
    WHEN image_url LIKE 'https://via.placeholder%' THEN 'Placeholders'
    WHEN image_url LIKE 'https://%' THEN 'External URLs'
    WHEN image_url LIKE 'file:///%' THEN 'Local Paths (BAD!)'
    WHEN image_url IS NULL THEN 'No Image'
    ELSE 'Unknown'
  END as url_type,
  COUNT(*) as shop_count
FROM shops
GROUP BY url_type
ORDER BY shop_count DESC;

-- ========================================
-- PART 5: OPTIONAL - DELETE INVALID SHOPS
-- ========================================

-- ⚠️ UNCOMMENT ONLY IF YOU WANT TO DELETE SHOPS WITH LOCAL FILE PATHS
-- They will need to re-register after Supabase Storage is properly set up

-- DELETE FROM shops
-- WHERE 
--   image_url LIKE 'file:///%'
--   OR image_url LIKE 'file://data/%'
--   OR image_url LIKE 'file:///var/%';

-- SELECT 'Deleted ' || COUNT(*) || ' shops with local file paths' as result
-- FROM shops
-- WHERE 1=0; -- This will show 0 since we didn't actually delete


