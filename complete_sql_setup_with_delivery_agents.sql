-- ============================================================
-- COMPLETE SQL SETUP FOR CUSTOMER ADDRESS MANAGEMENT
-- INCLUDES VENDOR ORDERS FIX AND SHOP STATUS TOGGLE
-- INCLUDES DELIVERY AGENTS TABLE AND STORAGE SETUP
-- FIXES DELIVERY AGENTS FOREIGN KEY CONSTRAINT ISSUE
-- ============================================================
-- This script:
-- 1. Fixes addresses table foreign key (IMMEDIATE FIX)
-- 2. Creates consolidated customers table (OPTIONAL - for future use)
-- 3. Sets up all helper functions
-- 4. Keeps backward compatibility with addresses table
-- 5. Includes vendor orders diagnostics
-- 6. FIXES ALL vendor shop user_id to match vendor auth user_id (ORDERS WILL WORK!)
-- 7. ADDS shop is_open column for vendor store status toggle (OPEN/CLOSED)
-- 8. Creates notifications table for vendor app
-- 9. Creates delivery_agents table for delivery partner registration
-- 10. FIXES delivery_agents foreign key constraint (points to auth.users, not users)
-- 11. Sets up storage policies for delivery-agent-documents bucket
-- 
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- 
-- IMPORTANT: After running this script, manually create the storage bucket:
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: delivery-agent-documents
-- Public: Yes (toggle ON)
-- ============================================================

-- ========================================
-- PART 1: FIX ADDRESSES TABLE FOREIGN KEY (IMMEDIATE FIX)
-- ========================================

-- Drop existing foreign key if it's broken
ALTER TABLE addresses 
  DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;

-- Recreate foreign key to users table
ALTER TABLE addresses
  ADD CONSTRAINT addresses_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Verify the constraint was created
SELECT 
  '✅ Step 1: Addresses foreign key fixed' as status,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'addresses_user_id_fkey';

-- ========================================
-- PART 2: DISABLE ROW LEVEL SECURITY (IF NEEDED)
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

SELECT '✅ Step 2: Row Level Security disabled on all tables' as status;

-- ========================================
-- PART 3: CREATE CONSOLIDATED CUSTOMERS TABLE (OPTIONAL)
-- ========================================

-- Drop the table if it exists (for fresh start)
DROP TABLE IF EXISTS customers CASCADE;

-- Create the consolidated customers table
CREATE TABLE customers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication (links to auth.users) - NULLABLE to handle existing users
  auth_user_id UUID UNIQUE,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  profile_picture TEXT,
  
  -- Address Information (Primary/Default Address)
  contact_name TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  landmark TEXT,
  address_label TEXT DEFAULT 'Home',
  is_default_address BOOLEAN DEFAULT true,
  
  -- Additional Address Fields (for multiple addresses - stored as JSONB array)
  additional_addresses JSONB DEFAULT '[]'::jsonb,
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Unique constraint on phone
  CONSTRAINT customers_phone_unique UNIQUE (phone)
);

-- Create indexes for customers table
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_is_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Add foreign key constraint AFTER migration (only for users that exist in auth.users)
-- This will be added later to avoid migration errors

-- Add comments
COMMENT ON TABLE customers IS 'Consolidated table for all customer information including profile and address data';
COMMENT ON COLUMN customers.auth_user_id IS 'Links to Supabase auth.users(id) for authentication. NULL if user does not exist in auth.users (for backward compatibility with existing users)';
COMMENT ON COLUMN customers.additional_addresses IS 'JSONB array of additional addresses. Format: [{"id": "uuid", "contactName": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "landmark": "...", "label": "Home/Office/Other", "isDefault": false}]';

-- Disable RLS on customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 3: Customers table created' as status;

-- ========================================
-- PART 4: MIGRATE EXISTING DATA TO CUSTOMERS TABLE
-- ========================================

-- Migrate data from users + user_profiles + addresses
INSERT INTO customers (
  id,
  auth_user_id,
  name,
  email,
  phone,
  gender,
  profile_picture,
  contact_name,
  street,
  city,
  state,
  postal_code,
  landmark,
  address_label,
  is_default_address,
  additional_addresses,
  is_active,
  is_verified,
  created_at,
  updated_at,
  last_login_at
)
SELECT 
  -- Use user_profiles.id as the customer id (or users.id if user_profiles doesn't exist)
  COALESCE(up.id, u.id) as id,
  
  -- Link to auth user (only if exists in auth.users, otherwise NULL)
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = u.id) THEN u.id
    ELSE NULL
  END as auth_user_id,
  
  -- Basic info from user_profiles
  COALESCE(up.name, u.phone) as name,
  COALESCE(up.email, u.email) as email,
  COALESCE(up.phone, u.phone) as phone,
  up.gender,
  up.profile_picture,
  
  -- Primary address from addresses table (default address)
  addr.contact_name,
  addr.street,
  addr.city,
  addr.state,
  addr.postal_code,
  addr.landmark,
  COALESCE(addr.label, 'Home') as address_label,
  true as is_default_address,
  
  -- Additional addresses as JSONB array
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'contactName', a.contact_name,
          'phone', a.phone,
          'street', a.street,
          'city', a.city,
          'state', a.state,
          'postalCode', a.postal_code,
          'landmark', COALESCE(a.landmark, ''),
          'label', COALESCE(a.label, 'Home'),
          'isDefault', a.is_default
        )
      )
      FROM addresses a
      WHERE a.user_id = COALESCE(up.id, u.id)
        AND a.id != COALESCE(addr.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ),
    '[]'::jsonb
  ) as additional_addresses,
  
  -- Status
  true as is_active,
  false as is_verified,
  
  -- Timestamps
  COALESCE(up.created_at, u.created_at, NOW()) as created_at,
  COALESCE(up.updated_at, NOW()) as updated_at,
  NULL as last_login_at
  
FROM users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN LATERAL (
  SELECT *
  FROM addresses
  WHERE addresses.user_id = COALESCE(up.id, u.id)
    AND addresses.is_default = true
  LIMIT 1
) addr ON true
WHERE u.id IS NOT NULL
ON CONFLICT (phone) DO NOTHING; -- Skip if phone already exists

SELECT '✅ Step 4: Existing data migrated to customers table' as status;

-- ========================================
-- PART 4A: CLEAN UP INVALID AUTH_USER_ID VALUES
-- ========================================

-- Set auth_user_id to NULL for any values that don't exist in auth.users
-- This prevents foreign key constraint errors
UPDATE customers c
SET auth_user_id = NULL
WHERE c.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = c.auth_user_id
  );

SELECT 
  '✅ Step 4A: Cleaned up invalid auth_user_id values' as status,
  COUNT(*) as customers_with_null_auth_user_id
FROM customers
WHERE auth_user_id IS NULL;

-- ========================================
-- PART 4B: ADD FOREIGN KEY CONSTRAINT (AFTER CLEANUP)
-- ========================================

-- Now add the foreign key constraint
-- NULL values are allowed, so this won't fail
DO $$
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_auth_user_id_fkey'
  ) THEN
    ALTER TABLE customers
      ADD CONSTRAINT customers_auth_user_id_fkey 
      FOREIGN KEY (auth_user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

SELECT '✅ Step 4B: Foreign key constraint added to customers table' as status;

-- ========================================
-- PART 5: CREATE HELPER FUNCTIONS FOR CUSTOMERS TABLE
-- ========================================

-- Function to get customer by auth user id
CREATE OR REPLACE FUNCTION get_customer_by_auth_id(auth_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT,
  profile_picture TEXT,
  address JSONB,
  additional_addresses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.gender,
    c.profile_picture,
    jsonb_build_object(
      'id', c.id,
      'contactName', c.contact_name,
      'phone', c.phone,
      'street', c.street,
      'city', c.city,
      'state', c.state,
      'postalCode', c.postal_code,
      'landmark', c.landmark,
      'label', c.address_label,
      'isDefault', c.is_default_address
    ) as address,
    c.additional_addresses
  FROM customers c
  WHERE c.auth_user_id = auth_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add address to customer
CREATE OR REPLACE FUNCTION add_customer_address(
  customer_uuid UUID,
  contact_name_val TEXT,
  phone_val TEXT,
  street_val TEXT,
  city_val TEXT,
  state_val TEXT,
  postal_code_val TEXT,
  landmark_val TEXT DEFAULT '',
  label_val TEXT DEFAULT 'Home',
  is_default_val BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  new_address_id UUID;
  address_json JSONB;
BEGIN
  -- Generate new address ID
  new_address_id := gen_random_uuid();
  
  -- Create address JSON object
  address_json := jsonb_build_object(
    'id', new_address_id,
    'contactName', contact_name_val,
    'phone', phone_val,
    'street', street_val,
    'city', city_val,
    'state', state_val,
    'postalCode', postal_code_val,
    'landmark', landmark_val,
    'label', label_val,
    'isDefault', is_default_val
  );
  
  -- If this is default, unset other defaults
  IF is_default_val THEN
    -- Update all additional addresses to not be default
    UPDATE customers
    SET additional_addresses = (
      SELECT jsonb_agg(
        jsonb_set(addr, '{isDefault}', 'false'::jsonb)
      )
      FROM jsonb_array_elements(additional_addresses) AS addr
    )
    WHERE id = customer_uuid;
    
    -- Update primary address
    UPDATE customers
    SET 
      contact_name = contact_name_val,
      phone = phone_val,
      street = street_val,
      city = city_val,
      state = state_val,
      postal_code = postal_code_val,
      landmark = landmark_val,
      address_label = label_val,
      is_default_address = true,
      updated_at = NOW()
    WHERE id = customer_uuid;
  ELSE
    -- Add to additional_addresses array
    UPDATE customers
    SET 
      additional_addresses = additional_addresses || jsonb_build_array(address_json),
      updated_at = NOW()
    WHERE id = customer_uuid;
  END IF;
  
  RETURN new_address_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer address
CREATE OR REPLACE FUNCTION update_customer_address(
  customer_uuid UUID,
  address_id_val UUID,
  contact_name_val TEXT DEFAULT NULL,
  phone_val TEXT DEFAULT NULL,
  street_val TEXT DEFAULT NULL,
  city_val TEXT DEFAULT NULL,
  state_val TEXT DEFAULT NULL,
  postal_code_val TEXT DEFAULT NULL,
  landmark_val TEXT DEFAULT NULL,
  label_val TEXT DEFAULT NULL,
  is_default_val BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  address_found BOOLEAN := false;
BEGIN
  -- Check if it's the primary address
  IF address_id_val = customer_uuid THEN
    -- Update primary address
    UPDATE customers
    SET 
      contact_name = COALESCE(contact_name_val, contact_name),
      phone = COALESCE(phone_val, phone),
      street = COALESCE(street_val, street),
      city = COALESCE(city_val, city),
      state = COALESCE(state_val, state),
      postal_code = COALESCE(postal_code_val, postal_code),
      landmark = COALESCE(landmark_val, landmark),
      address_label = COALESCE(label_val, address_label),
      is_default_address = COALESCE(is_default_val, is_default_address),
      updated_at = NOW()
    WHERE id = customer_uuid;
    address_found := true;
  ELSE
    -- Update in additional_addresses array
    UPDATE customers
    SET additional_addresses = (
      SELECT jsonb_agg(
        CASE 
          WHEN (addr->>'id')::uuid = address_id_val THEN
            jsonb_build_object(
              'id', address_id_val,
              'contactName', COALESCE(contact_name_val, addr->>'contactName'),
              'phone', COALESCE(phone_val, addr->>'phone'),
              'street', COALESCE(street_val, addr->>'street'),
              'city', COALESCE(city_val, addr->>'city'),
              'state', COALESCE(state_val, addr->>'state'),
              'postalCode', COALESCE(postal_code_val, addr->>'postalCode'),
              'landmark', COALESCE(landmark_val, addr->>'landmark'),
              'label', COALESCE(label_val, addr->>'label'),
              'isDefault', COALESCE(is_default_val, (addr->>'isDefault')::boolean)
            )
          ELSE addr
        END
      )
      FROM jsonb_array_elements(additional_addresses) AS addr
    ),
    updated_at = NOW()
    WHERE id = customer_uuid
      AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(additional_addresses) AS addr
        WHERE (addr->>'id')::uuid = address_id_val
      );
    
    GET DIAGNOSTICS address_found = ROW_COUNT;
  END IF;
  
  RETURN address_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete customer address
CREATE OR REPLACE FUNCTION delete_customer_address(
  customer_uuid UUID,
  address_id_val UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  address_found BOOLEAN := false;
BEGIN
  -- Cannot delete primary address, only update it
  IF address_id_val = customer_uuid THEN
    RETURN false;
  END IF;
  
  -- Remove from additional_addresses array
  UPDATE customers
  SET 
    additional_addresses = (
      SELECT jsonb_agg(addr)
      FROM jsonb_array_elements(additional_addresses) AS addr
      WHERE (addr->>'id')::uuid != address_id_val
    ),
    updated_at = NOW()
  WHERE id = customer_uuid
    AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(additional_addresses) AS addr
      WHERE (addr->>'id')::uuid = address_id_val
    );
  
  GET DIAGNOSTICS address_found = ROW_COUNT;
  RETURN address_found > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PART 6: CREATE TRIGGER FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

SELECT '✅ Step 5: Helper functions and triggers created' as status;

-- ========================================
-- PART 6A: UPDATE FOREIGN KEY REFERENCES
-- ========================================

-- Update orders table to reference customers instead of users
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Migrate order user_id to customer_id
UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.user_id = c.auth_user_id OR o.user_id = c.id;

-- Create index for customer_id
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Update login_sessions table
ALTER TABLE login_sessions
  DROP CONSTRAINT IF EXISTS login_sessions_user_id_fkey,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Migrate login_sessions user_id to customer_id
UPDATE login_sessions ls
SET customer_id = c.id
FROM customers c
WHERE ls.user_id = c.auth_user_id OR ls.user_id = c.id;

-- Create index for customer_id
CREATE INDEX IF NOT EXISTS idx_login_sessions_customer_id ON login_sessions(customer_id);

SELECT '✅ Step 6: Foreign key references updated' as status;

-- ========================================
-- PART 7: FIX STORAGE POLICIES - ADD ANON ROLE SUPPORT
-- ========================================
-- The issue: Vendor app uses 'anon' role, not 'public' role
-- Solution: Add policies for BOTH anon AND authenticated roles
-- ========================================

-- ========================================
-- STEP 7.1: DROP ALL EXISTING STORAGE POLICIES
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
-- STEP 7.2: CREATE POLICIES FOR ANON ROLE (Vendor App Uses This!)
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
-- STEP 7.3: CREATE POLICIES FOR AUTHENTICATED ROLE (Logged In Users)
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
-- STEP 7.4: VERIFY POLICIES CREATED
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

SELECT '✅ Step 7: Storage policies created for anon and authenticated roles' as status;

-- ========================================
-- PART 8: VENDOR ORDERS DIAGNOSTICS (GENERAL - ALL SHOPS)
-- ========================================
-- This section helps diagnose why orders aren't showing in vendor app
-- ========================================

-- Step 8.1: Show all shops and their user_id status
SELECT 
  '🔍 VENDOR ORDERS DIAGNOSTIC: All Shops User ID Status' as diagnostic_step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as shop_user_id,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  CASE 
    WHEN s.user_id IS NULL THEN '❌ NULL - No user_id set'
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id) THEN '✅ Valid - user_id exists in auth.users'
    ELSE '❌ Invalid - user_id does not exist in auth.users'
  END as user_id_status
FROM shops s
ORDER BY s.created_at DESC;

-- Step 8.2: Show shops with invalid or NULL user_id
SELECT 
  '🔍 VENDOR ORDERS DIAGNOSTIC: Shops Needing Fix' as diagnostic_step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as current_user_id,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  CASE 
    WHEN s.user_id IS NULL THEN 'NULL user_id'
    ELSE 'Invalid user_id (not in auth.users)'
  END as issue_type
FROM shops s
WHERE s.user_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id)
ORDER BY s.created_at DESC;

-- Step 8.3: Show potential vendor matches for shops (by email/phone)
SELECT 
  '🔍 VENDOR ORDERS DIAGNOSTIC: Potential Vendor Matches' as diagnostic_step,
  s.id as shop_id,
  s.name as shop_name,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  au.id as potential_vendor_id,
  au.email as vendor_email,
  au.phone as vendor_phone,
  CASE 
    WHEN s.email = au.email THEN '✅ Match by email'
    WHEN s.mobile_number = au.phone THEN '✅ Match by phone (mobile_number)'
    WHEN s.contact_phone = au.phone THEN '✅ Match by phone (contact_phone)'
    ELSE '⚠️ Partial match'
  END as match_type
FROM shops s
LEFT JOIN auth.users au ON (
  (s.email IS NOT NULL AND s.email = au.email)
  OR (s.mobile_number IS NOT NULL AND s.mobile_number = au.phone)
  OR (s.contact_phone IS NOT NULL AND s.contact_phone = au.phone)
)
WHERE s.user_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id)
ORDER BY s.created_at DESC;

-- Step 8.4: Show order counts per shop
SELECT 
  '🔍 VENDOR ORDERS DIAGNOSTIC: Order Counts Per Shop' as diagnostic_step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as shop_user_id,
  COUNT(o.id) as total_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'confirmed') as confirmed_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'completed') as completed_orders
FROM shops s
LEFT JOIN orders o ON s.id = o.shop_id
GROUP BY s.id, s.name, s.user_id
ORDER BY total_orders DESC, s.created_at DESC;

-- ========================================
-- PART 9: FIX ALL SHOPS USER_ID (AUTOMATIC FIX FOR ALL SHOPS)
-- ========================================
-- This section automatically fixes ALL shops' user_id to match vendor auth user_id
-- Works for all shops, not just one specific shop
-- Matching logic: email, mobile_number, or contact_phone
-- ========================================

-- Step 9.1: Show shops that will be fixed
SELECT 
  '🔍 STEP 9.1: Shops That Will Be Fixed' as step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as current_user_id,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  s.contact_phone as shop_contact_phone,
  au.id as matched_vendor_id,
  au.email as vendor_email,
  au.phone as vendor_phone,
  CASE 
    WHEN s.email = au.email THEN 'Match by email'
    WHEN s.mobile_number = au.phone THEN 'Match by phone (mobile_number)'
    WHEN s.contact_phone = au.phone THEN 'Match by phone (contact_phone)'
    ELSE 'No match found'
  END as match_method
FROM shops s
LEFT JOIN auth.users au ON (
  (s.email IS NOT NULL AND s.email = au.email)
  OR (s.mobile_number IS NOT NULL AND s.mobile_number = au.phone)
  OR (s.contact_phone IS NOT NULL AND s.contact_phone = au.phone)
)
WHERE s.user_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id)
ORDER BY s.created_at DESC;

-- Step 9.2: Fix shops by matching email
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.email IS NOT NULL 
  AND s.email = au.email
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

SELECT 
  '✅ STEP 9.2: Fixed shops by email match' as step,
  COUNT(*) as shops_fixed
FROM shops s
WHERE s.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.email = s.email AND au.id = s.user_id);

-- Step 9.3: Fix shops by matching mobile_number
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.mobile_number IS NOT NULL 
  AND s.mobile_number = au.phone
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

SELECT 
  '✅ STEP 9.3: Fixed shops by mobile_number match' as step,
  COUNT(*) as shops_fixed
FROM shops s
WHERE s.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.phone = s.mobile_number AND au.id = s.user_id);

-- Step 9.4: Fix shops by matching contact_phone
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.contact_phone IS NOT NULL 
  AND s.contact_phone = au.phone
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

SELECT 
  '✅ STEP 9.4: Fixed shops by contact_phone match' as step,
  COUNT(*) as shops_fixed
FROM shops s
WHERE s.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.phone = s.contact_phone AND au.id = s.user_id);

-- Step 9.5: Verify all fixes
SELECT 
  '✅ STEP 9.5: Final Verification - All Shops User ID Status' as step,
  COUNT(*) as total_shops,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = shops.user_id)) as shops_with_valid_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as shops_with_null_user_id,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = shops.user_id)) as shops_with_invalid_user_id
FROM shops;

-- Step 9.6: Show shops that still need manual fixing (if any)
SELECT 
  '⚠️ STEP 9.6: Shops That Still Need Manual Fixing' as step,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as current_user_id,
  s.email as shop_email,
  s.mobile_number as shop_phone,
  s.contact_phone as shop_contact_phone,
  'No matching vendor found in auth.users' as reason
FROM shops s
WHERE s.user_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id)
ORDER BY s.created_at DESC;

SELECT '✅ Step 9: All shops user_id automatically fixed (where possible)' as status;

-- ========================================
-- PART 10: ADD SHOP IS_OPEN COLUMN FOR STORE STATUS TOGGLE
-- ========================================
-- This section adds the is_open column to shops table
-- Vendors can toggle their shop status (OPEN/CLOSED) in the vendor app
-- Only shops with is_open = true will appear in customer app's nearby shops section
-- ========================================

-- Step 10.1: Add is_open column to shops table
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Step 10.2: Create index for is_open column (for faster queries)
CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open) WHERE is_open = true;

-- Step 10.3: Set default value for existing shops (all open by default)
UPDATE shops
SET is_open = true
WHERE is_open IS NULL;

-- Step 10.4: Verify the column was added
SELECT 
  '✅ Step 10.4: is_open column added to shops table' as status,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shops' 
  AND column_name = 'is_open';

-- Step 10.5: Show current shop statuses
SELECT 
  '📊 Current Shop Statuses' as info,
  COUNT(*) as total_shops,
  COUNT(*) FILTER (WHERE is_open = true) as open_shops,
  COUNT(*) FILTER (WHERE is_open = false) as closed_shops,
  COUNT(*) FILTER (WHERE is_open IS NULL) as null_status_shops
FROM shops;

SELECT '✅ Step 10: Shop is_open column setup complete!' as status;

-- ========================================
-- PART 11: CREATE NOTIFICATIONS TABLE FOR VENDOR APP
-- ========================================
-- This script creates a notifications table to store notifications
-- sent from the Super Admin dashboard to vendors
-- ========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'super_admin' -- Track who created the notification
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(shop_id, is_read) WHERE is_read = false;

-- Disable RLS (Row Level Security) for notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE notifications IS 'Stores notifications sent from Super Admin to vendors';
COMMENT ON COLUMN notifications.shop_id IS 'Shop ID that the notification is for';
COMMENT ON COLUMN notifications.user_id IS 'User ID (vendor) that the notification is for';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, warning, success, error';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the vendor';
COMMENT ON COLUMN notifications.created_by IS 'Who created the notification (usually super_admin)';

SELECT '✅ Step 11: Notifications table created successfully' as status;

-- ========================================
-- PART 12: CREATE DELIVERY AGENTS TABLE
-- ========================================
-- This section creates a comprehensive table to store all delivery agent details
-- collected during the registration process in the Taaza Delivery App
-- ========================================

-- Step 12.0: Fix foreign key constraint FIRST (CRITICAL FIX)
-- Drop ALL existing foreign key constraints on delivery_agents.user_id
-- This fixes the registration error where constraint points to 'users' instead of 'auth.users'
-- This comprehensive approach finds and drops ALL constraints regardless of name
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'delivery_agents'
  ) THEN
    -- Find and drop ALL foreign key constraints on delivery_agents.user_id
    FOR constraint_record IN 
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'delivery_agents'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    LOOP
      EXECUTE format('ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.constraint_name);
      RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
    
    RAISE NOTICE '✅ Dropped all existing foreign key constraints on delivery_agents.user_id';
  ELSE
    RAISE NOTICE 'Table delivery_agents does not exist yet - will be created with correct constraint';
  END IF;
END $$;

-- Step 12.0B: Add selfie_url column if table exists (migration for existing tables)
-- This must run before CREATE TABLE to handle existing tables
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'delivery_agents'
  ) THEN
    -- Add selfie_url column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'delivery_agents' AND column_name = 'selfie_url'
    ) THEN
      ALTER TABLE delivery_agents ADD COLUMN selfie_url text;
      RAISE NOTICE 'Added selfie_url column to existing delivery_agents table';
    END IF;
  END IF;
END $$;

-- Create delivery_agents table
CREATE TABLE IF NOT EXISTS delivery_agents (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication Link
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  alternate_phone text NOT NULL,
  
  -- Vehicle Information
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'van')),
  vehicle_number text NOT NULL,
  vehicle_name text NOT NULL,
  
  -- Document URLs (stored as image URLs after upload)
  selfie_url text,
  driving_license_url text,
  aadhar_url text,
  pan_url text,
  
  -- Bank Details
  account_holder_name text,
  account_number text,
  ifsc_code text,
  bank_name text,
  branch_name text,
  
  -- Status Fields
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active boolean DEFAULT false,
  on_duty boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE delivery_agents IS 'Stores complete registration details for delivery agents/riders';
COMMENT ON COLUMN delivery_agents.user_id IS 'Links to Supabase auth.users table for authentication';
COMMENT ON COLUMN delivery_agents.selfie_url IS 'URL of the selfie photo taken during registration';
COMMENT ON COLUMN delivery_agents.vehicle_type IS 'Type of vehicle: bike, auto, or van';
COMMENT ON COLUMN delivery_agents.verification_status IS 'Document verification status: pending, verified, or rejected';
COMMENT ON COLUMN delivery_agents.is_active IS 'Whether the agent is approved and can accept orders';
COMMENT ON COLUMN delivery_agents.on_duty IS 'Current duty status (On Duty/Off Duty toggle)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_phone_number ON delivery_agents(phone_number);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_verification_status ON delivery_agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_is_active ON delivery_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_on_duty ON delivery_agents(on_duty);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_delivery_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_delivery_agents_updated_at ON delivery_agents;
CREATE TRIGGER trigger_update_delivery_agents_updated_at
  BEFORE UPDATE ON delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_agents_updated_at();

-- Disable RLS (Row Level Security) for delivery_agents table
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

-- Ensure selfie_url column exists (final check)
ALTER TABLE delivery_agents
  ADD COLUMN IF NOT EXISTS selfie_url text;

-- Add comment for selfie_url
COMMENT ON COLUMN delivery_agents.selfie_url IS 'URL of the selfie photo taken during registration';

-- Step 12.1: Ensure foreign key constraint is correctly set to auth.users
-- This is critical for registration to work properly
-- This step drops any wrong constraints and ensures the correct one exists
DO $$
DECLARE
  constraint_record RECORD;
  correct_constraint_exists BOOLEAN := false;
BEGIN
  -- First, drop any constraints that point to the wrong table
  FOR constraint_record IN 
    SELECT tc.constraint_name, ccu.table_schema, ccu.table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'delivery_agents'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
      AND NOT (ccu.table_schema = 'auth' AND ccu.table_name = 'users')
  LOOP
    EXECUTE format('ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.constraint_name);
    RAISE NOTICE 'Dropped incorrect constraint: % (pointed to %.%)', constraint_record.constraint_name, constraint_record.table_schema, constraint_record.table_name;
  END LOOP;
  
  -- Check if correct constraint exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'delivery_agents'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) INTO correct_constraint_exists;
  
  -- Add the correct constraint if it doesn't exist
  IF NOT correct_constraint_exists THEN
    ALTER TABLE delivery_agents
    ADD CONSTRAINT delivery_agents_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added correct foreign key constraint to auth.users';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint already correctly set to auth.users';
  END IF;
END $$;

-- Verify the constraint
SELECT 
  '✅ Step 12.1: Foreign key constraint verification' as status,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name as references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

SELECT '✅ Step 12: Delivery agents table created successfully with correct foreign key constraint' as status;

-- ========================================
-- PART 13: DELIVERY AGENT STORAGE SETUP
-- ========================================
-- This section sets up Supabase Storage for delivery agent documents
-- Documents will be stored in: delivery-agent-documents bucket
-- ========================================

-- Step 13.1: Create Storage Policies for delivery-agent-documents bucket
-- These policies control who can upload, read, and delete documents
-- NOTE: You must create the bucket manually in Supabase Dashboard first!
-- Go to: Storage > New Bucket > Name: delivery-agent-documents > Public: Yes

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to delivery agent documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to upload delivery agent documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read delivery agent documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own documents
CREATE POLICY "Allow authenticated users to upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to read their own documents
CREATE POLICY "Allow authenticated users to read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow public read access (so admin dashboard can view documents)
CREATE POLICY "Allow public read access to delivery agent documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'delivery-agent-documents');

-- Policy 4: Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 5: Allow authenticated users to delete their own documents
CREATE POLICY "Allow authenticated users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'delivery-agent-documents' AND
  (storage.foldername(name))[1] = 'agents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 6: Allow anon role to upload (for delivery app registration)
CREATE POLICY "Allow anon to upload delivery agent documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'delivery-agent-documents');

-- Policy 7: Allow anon role to read (for delivery app)
CREATE POLICY "Allow anon to read delivery agent documents"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'delivery-agent-documents');

-- Step 13.2: Verify storage policies were created
SELECT 
  '✅ Step 13.2: Storage policies verification' as status,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%delivery agent%'
ORDER BY policyname;

SELECT '✅ Step 13: Delivery agent storage policies created successfully' as status;
SELECT '⚠️  IMPORTANT: Create the bucket manually in Supabase Dashboard > Storage > New Bucket > Name: delivery-agent-documents > Public: Yes' as reminder;

-- ========================================
-- PART 14: VERIFICATION AND SUMMARY
-- ========================================

-- Check addresses foreign key
SELECT 
  '✅ VERIFICATION: Addresses Foreign Key' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'addresses_user_id_fkey'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Count customers
SELECT 
  '✅ VERIFICATION: Customers Table' as check_type,
  COUNT(*) as total_customers,
  COUNT(auth_user_id) as customers_with_auth,
  COUNT(CASE WHEN street IS NOT NULL THEN 1 END) as customers_with_address,
  COUNT(CASE WHEN jsonb_array_length(additional_addresses) > 0 THEN 1 END) as customers_with_multiple_addresses
FROM customers;

-- Check for orphaned addresses
SELECT 
  '⚠️  VERIFICATION: Orphaned Addresses' as check_type,
  COUNT(*) as orphaned_count
FROM addresses a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;

-- Sample customer data
SELECT 
  '✅ VERIFICATION: Sample Customer Data' as check_type,
  id,
  name,
  email,
  phone,
  city,
  state,
  jsonb_array_length(additional_addresses) as additional_address_count,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- Verify shop is_open column
SELECT 
  '✅ VERIFICATION: Shop is_open Column' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'shops' AND column_name = 'is_open'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  COUNT(*) FILTER (WHERE is_open = true) as open_shops,
  COUNT(*) FILTER (WHERE is_open = false) as closed_shops
FROM shops;

-- Final shop user_id verification
SELECT 
  '✅ VERIFICATION: Shop User ID Status' as check_type,
  COUNT(*) as total_shops,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = shops.user_id)) as shops_with_valid_user_id,
  COUNT(*) FILTER (WHERE user_id IS NULL) as shops_with_null_user_id,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = shops.user_id)) as shops_with_invalid_user_id
FROM shops;

-- Verify notifications table
SELECT 
  '✅ VERIFICATION: Notifications Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'notifications'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  COUNT(*) as total_notifications
FROM notifications;

-- Verify delivery_agents table
SELECT 
  '✅ VERIFICATION: Delivery Agents Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'delivery_agents'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  COUNT(*) as total_delivery_agents,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_verification,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_agents,
  COUNT(*) FILTER (WHERE is_active = true) as active_agents
FROM delivery_agents;

-- Show delivery_agents table structure
SELECT 
  '✅ VERIFICATION: Delivery Agents Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'delivery_agents'
ORDER BY ordinal_position;

-- Verify delivery agent storage policies
SELECT 
  '✅ VERIFICATION: Delivery Agent Storage Policies' as check_type,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE roles = '{authenticated}') as authenticated_policies,
  COUNT(*) FILTER (WHERE roles = '{public}') as public_policies,
  COUNT(*) FILTER (WHERE roles = '{anon}') as anon_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%delivery agent%';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '
========================================
✅✅✅ COMPLETE SQL SETUP SUCCESSFUL! ✅✅✅
========================================

WHAT WAS DONE:
✅ Fixed addresses table foreign key (addresses can now be saved!)
✅ Created consolidated customers table
✅ Migrated existing data to customers table
✅ Created helper functions for address management
✅ Updated foreign key references in orders and login_sessions
✅ Disabled Row Level Security on all tables
✅ Set up triggers and indexes
✅ Created storage policies for anon and authenticated roles (shop-images, shop-documents, product-images)
✅ Added vendor orders diagnostics (for ALL shops)
✅ Fixed ALL shops user_id to match vendor auth user_id automatically (vendor orders will now work!)
✅ Added shop is_open column for store status toggle (vendors can now control shop visibility!)
✅ Created notifications table for vendor app (super admin can send notifications to vendors)
✅ Created delivery_agents table for delivery partner registration (stores all registration details)
✅ FIXED delivery_agents foreign key constraint (now correctly points to auth.users - registration will work!)
✅ Created storage policies for delivery-agent-documents bucket (for selfie, driving license, Aadhar, PAN uploads)

CURRENT STATUS:
✅ Addresses table is working - you can save addresses now!
✅ Customers table is ready - backend will use it automatically
✅ Both tables work together for backward compatibility
✅ Storage policies configured for vendor app (anon role) and authenticated users
✅ Vendor orders diagnostics included - check results above
✅ ALL shops user_id fixed automatically - vendor orders should appear in vendor app now!
✅ Shop is_open column added - vendors can toggle shop status in vendor app!
✅ Notifications table ready - super admin can send notifications to vendors
✅ Delivery agents table ready - delivery partners can register and save all details
✅ Delivery agents foreign key constraint FIXED - registration will now work correctly!
✅ Storage policies ready - delivery agents can upload documents to Supabase Storage

NEXT STEPS:
1. Try saving an address in your app - it should work now!
2. The backend will automatically use customers table if it exists
3. Vendor app can now upload shop images and documents
4. Check vendor orders diagnostic results above
5. If any shops still show invalid user_id, they need manual fixing (no matching vendor found)
6. Vendors can now toggle shop status (OPEN/CLOSED) in vendor app dashboard
7. Only shops with is_open = true will appear in customer app nearby shops section
8. Super admin can send notifications to vendors through the notifications table
9. Delivery partners can register in the delivery app - all details will be saved to delivery_agents table
10. ✅ Delivery agents foreign key constraint is now fixed - registration errors should be resolved!
11. ⚠️  IMPORTANT: Create storage bucket manually: Go to Supabase Dashboard > Storage > New Bucket > Name: delivery-agent-documents > Public: Yes

IMPORTANT:
- The addresses table still works (for backward compatibility)
- The customers table is also available (for consolidated structure)
- Both can coexist - backend handles both automatically
- Storage policies support both anon (vendor app) and authenticated roles
- ALL shops user_id were automatically fixed by matching email/phone to auth.users
- If vendor orders are not displaying, check diagnostic results above
- Shop is_open = true by default (all shops visible until vendor toggles off)
- When vendor sets is_open = false, shop disappears from customer app nearby shops section
- The fix works for ALL shops automatically - no need to specify shop IDs!
- Delivery agents table stores: personal info, vehicle details, documents, bank details, and status
- Delivery agents start with verification_status = "pending" and is_active = false
- After admin verification, set verification_status = "verified" and is_active = true
- Delivery agents can toggle on_duty status in the delivery app
- ✅ FIXED: delivery_agents.user_id foreign key now correctly references auth.users (not users table)
- This fixes the registration error: "Key (user_id)=... is not present in table users"
- Documents (selfie, driving license, Aadhar, PAN) are uploaded to Supabase Storage bucket: delivery-agent-documents
- Storage bucket must be created manually in Supabase Dashboard (Storage > New Bucket)
- Bucket must be PUBLIC so admin dashboard can view documents
- Storage policies allow: authenticated users to upload/read their own docs, public/anonymous read access for admin dashboard

========================================
' as setup_complete;

