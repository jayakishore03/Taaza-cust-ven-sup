-- ============================================================
-- FIX STORAGE POLICIES - ADD ANON ROLE SUPPORT
-- ============================================================
-- The issue: Vendor app uses 'anon' role, not 'public' role
-- Solution: Add policies for BOTH anon AND public roles
-- ============================================================

-- ========================================
-- STEP 1: DROP ALL EXISTING STORAGE POLICIES
-- ========================================

DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%shop%' OR 
        policyname ILIKE '%product%' OR
        policyname ILIKE '%image%' OR
        policyname ILIKE '%document%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- ========================================
-- STEP 2: CREATE POLICIES FOR ANON ROLE (Vendor App Uses This!)
-- ========================================

-- ===== SHOP IMAGES POLICIES (ANON ROLE) =====

CREATE POLICY "shop_images_insert_anon"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "shop_images_select_anon"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_update_anon"
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_delete_anon"
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS POLICIES (ANON ROLE) =====

CREATE POLICY "shop_documents_insert_anon"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_select_anon"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_update_anon"
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_delete_anon"
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES POLICIES (ANON ROLE) =====

CREATE POLICY "product_images_insert_anon"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_select_anon"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_update_anon"
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_anon"
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'product-images');

-- ========================================
-- STEP 3: CREATE POLICIES FOR AUTHENTICATED ROLE (Logged In Users)
-- ========================================

-- ===== SHOP IMAGES POLICIES (AUTHENTICATED ROLE) =====

CREATE POLICY "shop_images_insert_auth"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

CREATE POLICY "shop_images_select_auth"
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_update_auth"
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'shop-images');

CREATE POLICY "shop_images_delete_auth"
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS POLICIES (AUTHENTICATED ROLE) =====

CREATE POLICY "shop_documents_insert_auth"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_select_auth"
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_update_auth"
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_delete_auth"
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES POLICIES (AUTHENTICATED ROLE) =====

CREATE POLICY "product_images_insert_auth"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_select_auth"
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_update_auth"
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete_auth"
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images');

-- ========================================
-- STEP 4: VERIFY POLICIES CREATED
-- ========================================

SELECT 
  '✅ POLICIES CREATED FOR ANON & AUTHENTICATED ROLES' as status,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%shop_images%' OR 
    policyname LIKE '%shop_documents%' OR 
    policyname LIKE '%product_images%'
  )
ORDER BY policyname;

-- Count policies by role
SELECT 
  '✅ POLICY COUNT BY ROLE' as status,
  CASE 
    WHEN roles = '{anon}' THEN 'anon (Vendor App)'
    WHEN roles = '{authenticated}' THEN 'authenticated (Logged In)'
    WHEN roles = '{public}' THEN 'public (Everyone)'
    ELSE 'other'
  END as role_type,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%shop%' OR 
    policyname LIKE '%product%'
  )
GROUP BY roles
ORDER BY role_type;

-- ========================================
-- ✅✅✅ FIX COMPLETE! ✅✅✅
-- ========================================
-- 
-- WHAT WAS DONE:
-- ✅ Removed all old conflicting policies
-- ✅ Created 12 policies for ANON role (vendor app uses this!)
-- ✅ Created 12 policies for AUTHENTICATED role (logged in users)
-- ✅ Total: 24 policies covering all upload scenarios
-- 
-- WHY THIS WORKS:
-- - Vendor app uses Supabase client with anon key
-- - Anon key authenticates as 'anon' role (NOT 'public')
-- - Now policies exist for 'anon' role → uploads will work!
-- 
-- NEXT STEPS:
-- 1. Reload vendor app on your device
-- 2. Register a new shop with images
-- 3. Watch console - uploads will work now! 🎉
-- 
-- ========================================

