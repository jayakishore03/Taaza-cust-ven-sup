-- ============================================================
-- COMPLETE SETUP MIGRATION: Full Database + Storage Configuration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ========================================
-- PART 1: DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ========================================

ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 2: DROP FOREIGN KEY CONSTRAINTS
-- ========================================

ALTER TABLE IF EXISTS user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE IF EXISTS addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE IF EXISTS payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_shop_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_coupon_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_payment_method_id_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_addon_id_fkey;
ALTER TABLE IF EXISTS order_timeline DROP CONSTRAINT IF EXISTS order_timeline_order_id_fkey;
ALTER TABLE IF EXISTS login_sessions DROP CONSTRAINT IF EXISTS login_sessions_user_id_fkey;
ALTER TABLE IF EXISTS shops DROP CONSTRAINT IF EXISTS shops_vendor_id_fkey;

-- ========================================
-- PART 3: ADD COLUMNS TO SHOPS TABLE
-- ========================================

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_plot TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS store_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shop_type TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS same_time BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS common_open_time TEXT,
  ADD COLUMN IF NOT EXISTS common_close_time TEXT,
  ADD COLUMN IF NOT EXISTS day_times JSONB,
  ADD COLUMN IF NOT EXISTS pan_document TEXT,
  ADD COLUMN IF NOT EXISTS gst_document TEXT,
  ADD COLUMN IF NOT EXISTS fssai_document TEXT,
  ADD COLUMN IF NOT EXISTS shop_license_document TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_document TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profit_share INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS signature TEXT;

CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shops_is_verified ON shops(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_shops_is_approved ON shops(is_approved) WHERE is_approved = true;

ALTER TABLE shops DROP COLUMN IF EXISTS vendor_id;
DROP INDEX IF EXISTS idx_shops_vendor_id;

-- ========================================
-- PART 4: ADD SPECIAL_INSTRUCTIONS TO ORDERS
-- ========================================

ALTER TABLE IF EXISTS orders 
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- ========================================
-- PART 5: CREATE SUPABASE STORAGE BUCKETS
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images', 'shop-images', true, 5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-documents', 'shop-documents', true, 10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = true, file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true, 5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ========================================
-- PART 6: CREATE STORAGE POLICIES (ANON + AUTHENTICATED)
-- ========================================

-- Drop existing policies
DO $$ 
DECLARE policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%shop%' OR policyname ILIKE '%product%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Shop Images Policies (ANON)
CREATE POLICY "shop_images_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'shop-images');
CREATE POLICY "shop_images_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'shop-images');

-- Shop Images Policies (AUTHENTICATED)
CREATE POLICY "shop_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-images');
CREATE POLICY "shop_images_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-images');

-- Shop Documents Policies (ANON)
CREATE POLICY "shop_documents_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'shop-documents');

-- Shop Documents Policies (AUTHENTICATED)
CREATE POLICY "shop_documents_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-documents');

-- Product Images Policies (ANON)
CREATE POLICY "product_images_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');
CREATE POLICY "product_images_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'product-images');

-- Product Images Policies (AUTHENTICATED)
CREATE POLICY "product_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ========================================
-- PART 7: FIX EXISTING SHOPS WITH LOCAL FILE PATHS
-- ========================================

UPDATE shops
SET image_url = 'https://via.placeholder.com/400x300?text=' || REPLACE(name, ' ', '+'),
    store_photos = ARRAY[]::TEXT[]
WHERE image_url LIKE 'file:///%' OR image_url LIKE 'file://data/%' OR image_url LIKE 'file:///var/%';

UPDATE shops
SET store_photos = ARRAY[]::TEXT[]
WHERE EXISTS (
  SELECT 1 FROM unnest(store_photos) AS photo WHERE photo LIKE 'file:///%'
);

-- ========================================
-- PART 8: RELOAD SCHEMA CACHE
-- ========================================

NOTIFY pgrst, 'reload schema';

-- ========================================
-- VERIFICATION
-- ========================================

SELECT '✅ Migration completed successfully!' as status;

SELECT id, name, public, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;

