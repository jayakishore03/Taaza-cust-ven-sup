-- ============================================================
-- URGENT FIX: Create Storage Buckets and Allow Uploads
-- ============================================================
-- This fixes the "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor NOW!
-- ============================================================

-- ========================================
-- STEP 1: CREATE STORAGE BUCKETS
-- ========================================

-- Create shop-images bucket
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

-- Create shop-documents bucket
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

-- Create product-images bucket
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
-- STEP 2: DROP ALL EXISTING STORAGE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Allow authenticated upload shop images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read shop images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users update own shop images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users delete own shop images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated upload shop documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read shop documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users update own shop documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users delete own shop documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users delete own product images" ON storage.objects;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- ========================================
-- STEP 3: CREATE PERMISSIVE POLICIES (ALLOWS UPLOADS!)
-- ========================================

-- ===== SHOP IMAGES POLICIES (ALLOW PUBLIC & AUTHENTICATED) =====

-- Allow EVERYONE (public + authenticated) to upload shop images
CREATE POLICY "Allow public uploads to shop-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'shop-images');

-- Allow EVERYONE to read shop images
CREATE POLICY "Allow public read shop-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow authenticated users to update shop images
CREATE POLICY "Allow authenticated update shop-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');

-- Allow authenticated users to delete shop images
CREATE POLICY "Allow authenticated delete shop-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS POLICIES (ALLOW PUBLIC & AUTHENTICATED) =====

-- Allow EVERYONE to upload shop documents
CREATE POLICY "Allow public uploads to shop-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'shop-documents');

-- Allow EVERYONE to read shop documents
CREATE POLICY "Allow public read shop-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-documents');

-- Allow authenticated users to update shop documents
CREATE POLICY "Allow authenticated update shop-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-documents');

-- Allow authenticated users to delete shop documents
CREATE POLICY "Allow authenticated delete shop-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES POLICIES (ALLOW PUBLIC & AUTHENTICATED) =====

-- Allow EVERYONE to upload product images
CREATE POLICY "Allow public uploads to product-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Allow EVERYONE to read product images
CREATE POLICY "Allow public read product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to update product images
CREATE POLICY "Allow authenticated update product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete product images
CREATE POLICY "Allow authenticated delete product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ========================================
-- STEP 4: VERIFY SETUP
-- ========================================

-- Display created buckets
SELECT 
  id, 
  name, 
  public, 
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;

-- Display created policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%product%')
ORDER BY policyname;

-- ========================================
-- ✅ MIGRATION COMPLETE!
-- ========================================
-- 
-- What was done:
-- ✅ Created 3 storage buckets (shop-images, shop-documents, product-images)
-- ✅ Set all buckets to PUBLIC (for easy access)
-- ✅ Created PERMISSIVE policies that allow PUBLIC uploads
-- ✅ Enabled public read access to all images
-- 
-- Now vendor app can upload images without authentication errors!
-- ========================================

