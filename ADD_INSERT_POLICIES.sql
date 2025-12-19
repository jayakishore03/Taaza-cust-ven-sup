-- ============================================================
-- ADD INSERT POLICIES FOR STORAGE UPLOADS
-- ============================================================
-- This fixes the "new row violates row-level security policy" error
-- by adding INSERT policies that allow public uploads
-- ============================================================

-- ========================================
-- ADD INSERT POLICIES FOR ALL THREE BUCKETS
-- ========================================

-- Shop Images - Allow public uploads
DROP POLICY IF EXISTS "Allow public uploads to shop-images" ON storage.objects;
CREATE POLICY "Allow public uploads to shop-images"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-images');

-- Shop Documents - Allow public uploads
DROP POLICY IF EXISTS "Allow public uploads to shop-documents" ON storage.objects;
CREATE POLICY "Allow public uploads to shop-documents"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-documents');

-- Product Images - Allow public uploads
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
CREATE POLICY "Allow public uploads to product-images"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'product-images');

-- ========================================
-- VERIFY POLICIES CREATED
-- ========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND cmd = 'INSERT'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%product%')
ORDER BY policyname;

-- ========================================
-- ✅ DONE!
-- ========================================
-- Now you should see 3 INSERT policies:
-- - Allow public uploads to shop-images
-- - Allow public uploads to shop-documents  
-- - Allow public uploads to product-images
-- ========================================

