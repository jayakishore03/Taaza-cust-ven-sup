-- ============================================================
-- COMPLETE STORAGE FIX - Handles Existing Policies
-- ============================================================
-- This script will:
-- 1. Ensure buckets exist
-- 2. Remove ALL existing policies (to avoid conflicts)
-- 3. Create fresh permissive policies
-- 4. Verify setup
-- ============================================================

-- ========================================
-- STEP 1: ENSURE BUCKETS EXIST
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-documents',
  'shop-documents',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ========================================
-- STEP 2: DROP ALL EXISTING STORAGE POLICIES
-- ========================================

-- Drop all policies that might exist (ignore errors if they don't exist)
DO $$ 
BEGIN
  -- Shop images policies
  DROP POLICY IF EXISTS "Allow public uploads to shop-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated upload shop images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read shop-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read shop images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated update shop-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users update own shop images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete shop-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users delete own shop images" ON storage.objects;
  
  -- Shop documents policies
  DROP POLICY IF EXISTS "Allow public uploads to shop-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated upload shop documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read shop-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read shop documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated update shop-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users update own shop documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete shop-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users delete own shop documents" ON storage.objects;
  
  -- Product images policies
  DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read product-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read product images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated update product-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users update own product images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated delete product-images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users delete own product images" ON storage.objects;
  
  -- Generic policies
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
END $$;

-- ========================================
-- STEP 3: CREATE FRESH PERMISSIVE POLICIES
-- ========================================

-- ===== SHOP IMAGES: ALL OPERATIONS ALLOWED TO PUBLIC =====

CREATE POLICY "shop_images_insert_public"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "shop_images_select_public"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_update_public"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_delete_public"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS: ALL OPERATIONS ALLOWED TO PUBLIC =====

CREATE POLICY "shop_documents_insert_public"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_select_public"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_update_public"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_delete_public"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES: ALL OPERATIONS ALLOWED TO PUBLIC =====

CREATE POLICY "product_images_insert_public"
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_select_public"
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_update_public"
ON storage.objects FOR UPDATE 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_public"
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'product-images');

-- ========================================
-- STEP 4: VERIFY SETUP
-- ========================================

-- Show all buckets
SELECT '=== BUCKETS ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;

-- Show all policies
SELECT '=== POLICIES ===' as info;
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%product%')
ORDER BY policyname;

-- ========================================
-- ✅ COMPLETE!
-- ========================================
-- You should now see:
-- - 3 buckets (shop-images, shop-documents, product-images)
-- - 12 policies (4 for each bucket: INSERT, SELECT, UPDATE, DELETE)
-- - All policies allow public access
-- 
-- Now test uploading in the vendor app!
-- ========================================

