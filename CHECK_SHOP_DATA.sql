-- ============================================================
-- CHECK LATEST SHOP DATA IN DATABASE
-- ============================================================
-- This will show what data was actually saved to the database
-- ============================================================

-- Get the latest shop with all document fields
SELECT 
  id,
  name,
  owner_name,
  image_url,
  store_photos,
  pan_document,
  gst_document,
  fssai_document,
  shop_license_document,
  aadhaar_document,
  created_at
FROM shops
ORDER BY created_at DESC
LIMIT 1;

-- Check if any shops have document URLs
SELECT 
  'Shops with documents' as info,
  COUNT(*) FILTER (WHERE pan_document IS NOT NULL) as has_pan,
  COUNT(*) FILTER (WHERE gst_document IS NOT NULL) as has_gst,
  COUNT(*) FILTER (WHERE fssai_document IS NOT NULL) as has_fssai,
  COUNT(*) FILTER (WHERE shop_license_document IS NOT NULL) as has_shop_license,
  COUNT(*) FILTER (WHERE aadhaar_document IS NOT NULL) as has_aadhaar
FROM shops;

-- Check storage objects uploaded
SELECT 
  'Storage objects' as info,
  bucket_id,
  name,
  created_at
FROM storage.objects
WHERE bucket_id IN ('shop-images', 'shop-documents')
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- This will show:
-- 1. The latest shop with all its data
-- 2. Count of shops that have each type of document
-- 3. Recent uploads to storage buckets
-- ============================================================

