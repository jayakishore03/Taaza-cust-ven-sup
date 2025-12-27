-- ============================================================
-- CHECK CURRENT STORAGE CONFIGURATION
-- ============================================================
-- This will show us what's actually configured
-- ============================================================

-- ========================================
-- 1. CHECK IF BUCKETS EXIST
-- ========================================
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- ========================================
-- 2. CHECK ALL STORAGE POLICIES
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ========================================
-- 3. CHECK SPECIFIC SHOP-IMAGES POLICIES
-- ========================================
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%shop-images%'
ORDER BY cmd;

-- ========================================
-- 4. CHECK IF RLS IS ENABLED ON STORAGE.OBJECTS
-- ========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- ========================================
-- RESULTS WILL SHOW:
-- ========================================
-- 1. List of all buckets (should include shop-images, shop-documents, product-images)
-- 2. All policies on storage.objects
-- 3. Specific shop-images policies
-- 4. Whether RLS is enabled on storage.objects table
-- ========================================

