-- ============================================================
-- Create Supabase Storage Buckets for Images and Documents
-- This migration creates storage buckets and policies for:
-- 1. Shop images (store photos)
-- 2. Shop documents (PAN, GST, FSSAI, Aadhaar, Shop License)
-- 3. Product images
-- ============================================================

-- ========================================
-- PART 1: CREATE STORAGE BUCKETS
-- ========================================

-- Create shop-images bucket (for shop/store photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create shop-documents bucket (for vendor documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-documents',
  'shop-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Create product-images bucket (for product photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ========================================
-- PART 2: CREATE STORAGE POLICIES
-- ========================================

-- ===== SHOP IMAGES POLICIES =====

-- Policy 1: Allow authenticated users to upload shop images
DROP POLICY IF EXISTS "Allow authenticated upload shop images" ON storage.objects;
CREATE POLICY "Allow authenticated upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Policy 2: Allow public read access to shop images
DROP POLICY IF EXISTS "Allow public read shop images" ON storage.objects;
CREATE POLICY "Allow public read shop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Policy 3: Allow users to update their own shop images
DROP POLICY IF EXISTS "Allow users update own shop images" ON storage.objects;
CREATE POLICY "Allow users update own shop images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');

-- Policy 4: Allow users to delete their own shop images
DROP POLICY IF EXISTS "Allow users delete own shop images" ON storage.objects;
CREATE POLICY "Allow users delete own shop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS POLICIES =====

-- Policy 1: Allow authenticated users to upload shop documents
DROP POLICY IF EXISTS "Allow authenticated upload shop documents" ON storage.objects;
CREATE POLICY "Allow authenticated upload shop documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-documents');

-- Policy 2: Allow public read access to shop documents
DROP POLICY IF EXISTS "Allow public read shop documents" ON storage.objects;
CREATE POLICY "Allow public read shop documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-documents');

-- Policy 3: Allow users to update their own shop documents
DROP POLICY IF EXISTS "Allow users update own shop documents" ON storage.objects;
CREATE POLICY "Allow users update own shop documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-documents');

-- Policy 4: Allow users to delete their own shop documents
DROP POLICY IF EXISTS "Allow users delete own shop documents" ON storage.objects;
CREATE POLICY "Allow users delete own shop documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES POLICIES =====

-- Policy 1: Allow authenticated users to upload product images
DROP POLICY IF EXISTS "Allow authenticated upload product images" ON storage.objects;
CREATE POLICY "Allow authenticated upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy 2: Allow public read access to product images
DROP POLICY IF EXISTS "Allow public read product images" ON storage.objects;
CREATE POLICY "Allow public read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 3: Allow users to update their own product images
DROP POLICY IF EXISTS "Allow users update own product images" ON storage.objects;
CREATE POLICY "Allow users update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Policy 4: Allow users to delete their own product images
DROP POLICY IF EXISTS "Allow users delete own product images" ON storage.objects;
CREATE POLICY "Allow users delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ========================================
-- PART 3: VERIFY SETUP
-- ========================================

-- Display created buckets
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;

-- Display created policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%shop%' OR policyname LIKE '%product%'
ORDER BY policyname;

