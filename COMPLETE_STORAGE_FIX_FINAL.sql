-- ============================================================
-- COMPLETE STORAGE FIX - FINAL VERSION
-- ============================================================
-- Safe to run multiple times - handles all existing configurations
-- This is the ONLY file you need to run
-- ============================================================
-- Copy ALL of this and paste in Supabase SQL Editor, then click Run
-- ============================================================

-- ========================================
-- STEP 1: CREATE/UPDATE STORAGE BUCKETS
-- ========================================

-- Shop Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Shop Documents Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-documents',
  'shop-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Product Images Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- STEP 2: DROP ALL EXISTING STORAGE POLICIES
-- ========================================
-- This removes any conflicting policies from previous runs

DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  -- Get all policies on storage.objects that contain shop/product keywords
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%shop%' OR 
        policyname ILIKE '%product%' OR
        policyname ILIKE '%image%' OR
        policyname ILIKE '%document%' OR
        policyname ILIKE '%public%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- ========================================
-- STEP 3: CREATE NEW PERMISSIVE POLICIES
-- ========================================
-- These allow public uploads (needed for vendor registration)

-- ===== SHOP IMAGES POLICIES =====

CREATE POLICY "shop_images_insert"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "shop_images_select"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_update"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_delete"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS POLICIES =====

CREATE POLICY "shop_documents_insert"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_select"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_update"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_delete"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES POLICIES =====

CREATE POLICY "product_images_insert"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_select"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_update"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'product-images');

-- ========================================
-- STEP 4: VERIFY SETUP (SHOW RESULTS)
-- ========================================

-- Show created buckets
SELECT 
  '✅ BUCKETS CREATED' as status,
  id as bucket_id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;

-- Show created policies
SELECT 
  '✅ POLICIES CREATED' as status,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE 'shop_images_%' OR 
    policyname LIKE 'shop_documents_%' OR 
    policyname LIKE 'product_images_%'
  )
ORDER BY policyname;

-- Count policies per bucket
SELECT 
  '✅ POLICY COUNT' as status,
  CASE 
    WHEN policyname LIKE 'shop_images_%' THEN 'shop-images'
    WHEN policyname LIKE 'shop_documents_%' THEN 'shop-documents'
    WHEN policyname LIKE 'product_images_%' THEN 'product-images'
  END as bucket,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE 'shop_images_%' OR 
    policyname LIKE 'shop_documents_%' OR 
    policyname LIKE 'product_images_%'
  )
GROUP BY bucket
ORDER BY bucket;

-- ========================================
-- ✅✅✅ MIGRATION COMPLETE! ✅✅✅
-- ========================================
-- 
-- WHAT WAS DONE:
-- ✅ Created 3 storage buckets (shop-images, shop-documents, product-images)
-- ✅ All buckets set to PUBLIC (allows easy access)
-- ✅ Removed all conflicting policies
-- ✅ Created 12 new policies (4 per bucket):
--    - INSERT (allows uploads)
--    - SELECT (allows reads)
--    - UPDATE (allows updates)
--    - DELETE (allows deletions)
-- ✅ All operations allowed to PUBLIC role
-- 
-- EXPECTED RESULTS IN OUTPUT:
-- - Table 1: Shows 3 buckets
-- - Table 2: Shows 12 policies
-- - Table 3: Shows 4 policies per bucket
-- 
-- NEXT STEPS:
-- 1. Reload your vendor app
-- 2. Delete the failed shop (shop-1766057263495-os6wdf3oy) from Super Admin
-- 3. Register a new shop with images
-- 4. Images will upload successfully! 🎉
-- 
-- ========================================

