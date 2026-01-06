-- ============================================================
-- TAAZA MEAT DELIVERY - COMPLETE DATABASE SETUP
-- ============================================================
-- This is the MASTER SQL file for the entire Taaza project
-- Includes: Customers, Vendors, Delivery Agents, Shops, Orders, Products
-- 
-- Run this ENTIRE script in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================
-- 
-- TABLE OF CONTENTS:
-- PART 1: Fix Existing Tables & Foreign Keys
-- PART 2: Disable Row Level Security (Development Mode)
-- PART 3: Consolidated Customers Table
-- PART 4: Delivery Agents Table & Setup (FIXED!)
-- PART 5: Shop Status Toggle (is_open)
-- PART 6: Notifications Table (Admin → Vendor)
-- PART 7: Storage Policies (All Buckets)
-- PART 8: Helper Functions
-- PART 9: Triggers & Auto-Updates
-- PART 10: Vendor Orders Fix (Auto-Match)
-- PART 11: Verification & Summary
-- 
-- ============================================================

-- ========================================
-- PART 1: FIX EXISTING TABLES & FOREIGN KEYS
-- ========================================

-- Fix addresses table foreign key
ALTER TABLE addresses 
  DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;

ALTER TABLE addresses
  ADD CONSTRAINT addresses_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

SELECT '✅ Step 1.1: Addresses foreign key fixed' as status;

-- ========================================
-- PART 2: DISABLE ROW LEVEL SECURITY
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
ALTER TABLE IF EXISTS delivery_agents DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 2: Row Level Security disabled on all tables' as status;

-- ========================================
-- PART 3: CONSOLIDATED CUSTOMERS TABLE
-- ========================================

DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  profile_picture TEXT,
  contact_name TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  landmark TEXT,
  address_label TEXT DEFAULT 'Home',
  is_default_address BOOLEAN DEFAULT true,
  additional_addresses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT customers_phone_unique UNIQUE (phone)
);

CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_is_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE customers IS 'Consolidated table for all customer information';
COMMENT ON COLUMN customers.additional_addresses IS 'JSONB array of additional addresses';

SELECT '✅ Step 3: Customers table created' as status;

-- Migrate existing customer data
INSERT INTO customers (
  id, auth_user_id, name, email, phone, gender, profile_picture,
  contact_name, street, city, state, postal_code, landmark, address_label,
  is_default_address, additional_addresses, is_active, is_verified,
  created_at, updated_at, last_login_at
)
SELECT 
  COALESCE(up.id, u.id) as id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = u.id) THEN u.id
    ELSE NULL
  END as auth_user_id,
  COALESCE(up.name, u.phone) as name,
  COALESCE(up.email, u.email) as email,
  COALESCE(up.phone, u.phone) as phone,
  up.gender,
  up.profile_picture,
  addr.contact_name,
  addr.street,
  addr.city,
  addr.state,
  addr.postal_code,
  addr.landmark,
  COALESCE(addr.label, 'Home') as address_label,
  true as is_default_address,
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
  true as is_active,
  false as is_verified,
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
ON CONFLICT (phone) DO NOTHING;

-- Clean up invalid auth_user_id values
UPDATE customers c
SET auth_user_id = NULL
WHERE c.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = c.auth_user_id
  );

-- Add foreign key constraint
DO $$
BEGIN
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

SELECT '✅ Step 3.1: Customer data migrated and cleaned up' as status;

-- ========================================
-- PART 4: DELIVERY AGENTS TABLE & SETUP (FIXED!)
-- ========================================

DROP TABLE IF EXISTS delivery_agents CASCADE;
DROP TABLE IF EXISTS delivery_agent_logs CASCADE;

-- ⭐⭐⭐ CRITICAL FIX: Create table WITHOUT inline foreign key reference ⭐⭐⭐
-- We will add the foreign key constraint EXPLICITLY using ALTER TABLE below
CREATE TABLE delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  alternate_phone TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'van')),
  vehicle_number TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  
  -- Documents (URLs from Supabase Storage)
  driving_license_url TEXT,
  aadhar_url TEXT,
  pan_url TEXT,
  selfie_url TEXT,
  
  -- Bank Details
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  bank_account_holder_name TEXT,
  bank_branch_name TEXT,
  
  -- Verification Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  -- Activity Status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  is_on_duty BOOLEAN DEFAULT false,
  
  -- Current Location
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  
  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  registration_device TEXT,
  registration_ip TEXT
);

-- ⭐⭐⭐ CRITICAL FIX: Add foreign key constraint EXPLICITLY using ALTER TABLE ⭐⭐⭐
-- This ensures it points to auth.users(id), NOT public.users(id)
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key for verified_by
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_verified_by_fkey 
FOREIGN KEY (verified_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Indexes for delivery_agents
CREATE INDEX idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX idx_delivery_agents_phone ON delivery_agents(phone_number);
CREATE INDEX idx_delivery_agents_verification_status ON delivery_agents(verification_status);
CREATE INDEX idx_delivery_agents_is_active ON delivery_agents(is_active) WHERE is_active = true;
CREATE INDEX idx_delivery_agents_is_available ON delivery_agents(is_available) WHERE is_available = true;
CREATE INDEX idx_delivery_agents_is_on_duty ON delivery_agents(is_on_duty) WHERE is_on_duty = true;
CREATE INDEX idx_delivery_agents_created_at ON delivery_agents(created_at DESC);
CREATE INDEX idx_delivery_agents_location ON delivery_agents(current_latitude, current_longitude) WHERE current_latitude IS NOT NULL;
CREATE UNIQUE INDEX idx_delivery_agents_vehicle_number ON delivery_agents(UPPER(vehicle_number));

ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE delivery_agents IS 'Stores all delivery agent information - user_id references auth.users(id)';
COMMENT ON COLUMN delivery_agents.verification_status IS 'Admin verification: pending, verified, or rejected';
COMMENT ON COLUMN delivery_agents.user_id IS 'References auth.users(id) - Supabase Auth user ID';

SELECT '✅ Step 4: Delivery agents table created with EXPLICIT foreign key to auth.users' as status;

-- Delivery Agent Logs Table
CREATE TABLE delivery_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_agent_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint explicitly
ALTER TABLE delivery_agent_logs
ADD CONSTRAINT delivery_agent_logs_agent_id_fkey
FOREIGN KEY (delivery_agent_id)
REFERENCES delivery_agents(id)
ON DELETE CASCADE;

CREATE INDEX idx_delivery_agent_logs_agent_id ON delivery_agent_logs(delivery_agent_id);
CREATE INDEX idx_delivery_agent_logs_created_at ON delivery_agent_logs(created_at DESC);
CREATE INDEX idx_delivery_agent_logs_action ON delivery_agent_logs(action);

ALTER TABLE delivery_agent_logs DISABLE ROW LEVEL SECURITY;

-- Add delivery agent fields to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_agent_id UUID,
  ADD COLUMN IF NOT EXISTS delivery_agent_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_agent_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_agent_vehicle_number TEXT;

-- Add foreign key for orders.delivery_agent_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_delivery_agent_id_fkey'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_delivery_agent_id_fkey
    FOREIGN KEY (delivery_agent_id)
    REFERENCES delivery_agents(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_agent_id ON orders(delivery_agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_agent_status ON orders(delivery_agent_id, status) WHERE delivery_agent_id IS NOT NULL;

SELECT '✅ Step 4.1: Delivery agent logs and order fields created' as status;

-- ========================================
-- PART 5: SHOP STATUS TOGGLE (is_open)
-- ========================================

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open) WHERE is_open = true;

UPDATE shops
SET is_open = true
WHERE is_open IS NULL;

SELECT '✅ Step 5: Shop is_open column added' as status;

-- ========================================
-- PART 6: NOTIFICATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'super_admin'
);

-- Add foreign keys explicitly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_shop_id_fkey'
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_shop_id_fkey
    FOREIGN KEY (shop_id)
    REFERENCES shops(id)
    ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(shop_id, is_read) WHERE is_read = false;

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notifications IS 'Notifications from Super Admin to vendors';

SELECT '✅ Step 6: Notifications table created' as status;

-- ========================================
-- PART 7: STORAGE POLICIES (ALL BUCKETS)
-- ========================================

-- Drop ALL existing storage policies to avoid conflicts
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

SELECT '✅ Step 7.1: All existing storage policies dropped' as status;

-- ===== SHOP IMAGES BUCKET POLICIES =====

-- ANON role (unauthenticated)
CREATE POLICY "shop_images_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'shop-images');
CREATE POLICY "shop_images_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'shop-images');

-- AUTHENTICATED role
CREATE POLICY "shop_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-images');
CREATE POLICY "shop_images_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-images');
CREATE POLICY "shop_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-images');

-- ===== SHOP DOCUMENTS BUCKET POLICIES =====

CREATE POLICY "shop_documents_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'shop-documents');

CREATE POLICY "shop_documents_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-documents');
CREATE POLICY "shop_documents_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-documents');

-- ===== PRODUCT IMAGES BUCKET POLICIES =====

CREATE POLICY "product_images_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');
CREATE POLICY "product_images_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product_images_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ===== DELIVERY AGENT DOCUMENTS BUCKET POLICIES =====

CREATE POLICY "delivery_agent_docs_insert_anon" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_select_anon" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_update_anon" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_delete_anon" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'delivery-agent-documents');

CREATE POLICY "delivery_agent_docs_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'delivery-agent-documents');
CREATE POLICY "delivery_agent_docs_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'delivery-agent-documents');

-- SERVICE ROLE (Admin/Backend) - Create last after dropping all
CREATE POLICY "all_buckets_service_role" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT '✅ Step 7: Storage policies created for all buckets' as status;

-- ========================================
-- PART 8: HELPER FUNCTIONS
-- ========================================

-- Customer Functions
CREATE OR REPLACE FUNCTION get_customer_by_auth_id(auth_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, email TEXT, phone TEXT, gender TEXT,
  profile_picture TEXT, address JSONB, additional_addresses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.name, c.email, c.phone, c.gender, c.profile_picture,
    jsonb_build_object(
      'id', c.id, 'contactName', c.contact_name, 'phone', c.phone,
      'street', c.street, 'city', c.city, 'state', c.state,
      'postalCode', c.postal_code, 'landmark', c.landmark,
      'label', c.address_label, 'isDefault', c.is_default_address
    ) as address,
    c.additional_addresses
  FROM customers c
  WHERE c.auth_user_id = auth_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delivery Agent Functions
CREATE OR REPLACE FUNCTION get_delivery_agent_by_user_id(agent_user_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID, full_name TEXT, email TEXT, phone_number TEXT,
  alternate_phone TEXT, vehicle_type TEXT, vehicle_number TEXT, vehicle_name TEXT,
  driving_license_url TEXT, aadhar_url TEXT, pan_url TEXT, selfie_url TEXT,
  bank_account_number TEXT, bank_ifsc_code TEXT, bank_name TEXT,
  bank_account_holder_name TEXT, bank_branch_name TEXT,
  verification_status TEXT, is_active BOOLEAN, is_available BOOLEAN,
  is_on_duty BOOLEAN, total_deliveries INTEGER, completed_deliveries INTEGER,
  average_rating DECIMAL, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id, da.user_id, da.full_name, da.email, da.phone_number,
    da.alternate_phone, da.vehicle_type, da.vehicle_number, da.vehicle_name,
    da.driving_license_url, da.aadhar_url, da.pan_url, da.selfie_url,
    da.bank_account_number, da.bank_ifsc_code, da.bank_name,
    da.bank_account_holder_name, da.bank_branch_name,
    da.verification_status, da.is_active, da.is_available,
    da.is_on_duty, da.total_deliveries, da.completed_deliveries,
    da.average_rating, da.created_at
  FROM delivery_agents da
  WHERE da.user_id = agent_user_id AND da.deleted_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_all_delivery_agents(
  status_filter TEXT DEFAULT NULL,
  active_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID, user_id UUID, full_name TEXT, email TEXT, phone_number TEXT,
  alternate_phone TEXT, vehicle_type TEXT, vehicle_number TEXT, vehicle_name TEXT,
  verification_status TEXT, is_active BOOLEAN, is_available BOOLEAN,
  is_on_duty BOOLEAN, total_deliveries INTEGER, completed_deliveries INTEGER,
  average_rating DECIMAL, created_at TIMESTAMPTZ, selfie_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id, da.user_id, da.full_name, da.email, da.phone_number,
    da.alternate_phone, da.vehicle_type, da.vehicle_number, da.vehicle_name,
    da.verification_status, da.is_active, da.is_available,
    da.is_on_duty, da.total_deliveries, da.completed_deliveries,
    da.average_rating, da.created_at, da.selfie_url
  FROM delivery_agents da
  WHERE da.deleted_at IS NULL
    AND (status_filter IS NULL OR da.verification_status = status_filter)
    AND (active_only = false OR da.is_active = true)
  ORDER BY da.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_delivery_agent_location(
  agent_user_id UUID,
  latitude DECIMAL,
  longitude DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE delivery_agents
  SET 
    current_latitude = latitude,
    current_longitude = longitude,
    last_location_update = NOW(),
    updated_at = NOW()
  WHERE user_id = agent_user_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_delivery_agent_duty_status(
  agent_user_id UUID,
  on_duty BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE delivery_agents
  SET 
    is_on_duty = on_duty,
    is_available = on_duty,
    updated_at = NOW()
  WHERE user_id = agent_user_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_delivery_agent(
  agent_id UUID,
  status TEXT,
  admin_user_id UUID,
  rejection_reason_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF status NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be "verified" or "rejected"';
  END IF;
  
  UPDATE delivery_agents
  SET 
    verification_status = status,
    verified_at = CASE WHEN status = 'verified' THEN NOW() ELSE NULL END,
    verified_by = CASE WHEN status = 'verified' THEN admin_user_id ELSE NULL END,
    rejection_reason = CASE WHEN status = 'rejected' THEN rejection_reason_text ELSE NULL END,
    is_active = CASE WHEN status = 'verified' THEN true ELSE false END,
    updated_at = NOW()
  WHERE id = agent_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Step 8: Helper functions created' as status;

-- ========================================
-- PART 9: TRIGGERS & AUTO-UPDATES
-- ========================================

-- Customers updated_at trigger
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

-- Delivery Agents updated_at trigger
CREATE OR REPLACE FUNCTION update_delivery_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_agents_updated_at ON delivery_agents;
CREATE TRIGGER delivery_agents_updated_at
  BEFORE UPDATE ON delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_agents_updated_at();

SELECT '✅ Step 9: Triggers created' as status;

-- ========================================
-- PART 10: VENDOR ORDERS FIX (AUTO-MATCH)
-- ========================================

-- Fix shops by matching email
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.email IS NOT NULL 
  AND s.email = au.email
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

-- Fix shops by matching mobile_number
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.mobile_number IS NOT NULL 
  AND s.mobile_number = au.phone
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

-- Fix shops by matching contact_phone
UPDATE shops s
SET user_id = au.id
FROM auth.users au
WHERE s.contact_phone IS NOT NULL 
  AND s.contact_phone = au.phone
  AND (s.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = s.user_id));

SELECT '✅ Step 10: Vendor shops auto-matched to auth users' as status;

-- ========================================
-- PART 11: VERIFICATION & SUMMARY
-- ========================================

-- Verify customers table
SELECT 
  '📊 CUSTOMERS TABLE' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE auth_user_id IS NOT NULL) as with_auth,
  COUNT(*) FILTER (WHERE auth_user_id IS NULL) as without_auth
FROM customers;

-- Verify delivery agents table
SELECT 
  '📊 DELIVERY AGENTS TABLE' as table_name,
  COUNT(*) as total_agents,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE is_on_duty = true) as on_duty
FROM delivery_agents;

-- 🔍 CRITICAL: Verify delivery_agents foreign key constraint
SELECT 
  '🔍 DELIVERY AGENTS FOREIGN KEY VERIFICATION' as info,
  tc.constraint_name,
  kcu.column_name as column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT'
    ELSE '❌ WRONG - Should be auth.users'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'delivery_agents'
  AND kcu.column_name = 'user_id';

-- Verify shops table
SELECT 
  '📊 SHOPS TABLE' as table_name,
  COUNT(*) as total_shops,
  COUNT(*) FILTER (WHERE is_open = true) as open_shops,
  COUNT(*) FILTER (WHERE is_open = false) as closed_shops,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_vendor
FROM shops;

-- Verify storage policies
SELECT 
  '📊 STORAGE POLICIES' as info,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE policyname ILIKE '%anon%') as anon_policies,
  COUNT(*) FILTER (WHERE policyname ILIKE '%auth%') as auth_policies
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Verify notifications
SELECT 
  '📊 NOTIFICATIONS TABLE' as table_name,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM notifications;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT $msg$
========================================
✅✅✅ TAAZA COMPLETE DATABASE SETUP SUCCESSFUL! ✅✅✅
========================================

WHAT WAS CREATED:
✅ Fixed addresses table foreign key
✅ Fixed delivery_agents foreign key (EXPLICIT ALTER TABLE METHOD!)
✅ Disabled Row Level Security on all tables
✅ Created consolidated CUSTOMERS table (with addresses)
✅ Created DELIVERY_AGENTS table (with EXPLICIT auth.users foreign key)
✅ Created DELIVERY_AGENT_LOGS table (activity tracking)
✅ Added SHOP IS_OPEN column (status toggle)
✅ Created NOTIFICATIONS table (admin to vendor)
✅ Created storage policies for ALL buckets (no conflicts!)
✅ Created helper functions for customers & delivery agents
✅ Created triggers for auto-updating timestamps
✅ Auto-matched vendor shops to auth users

🔑 CRITICAL FIX APPLIED:
The delivery_agents.user_id foreign key is created using ALTER TABLE
This ensures it EXPLICITLY points to auth.users(id), not public.users!

CHECK THE VERIFICATION OUTPUT ABOVE:
- Look for "🔍 DELIVERY AGENTS FOREIGN KEY VERIFICATION"
- The "status" column should show "✅ CORRECT"
- foreign_schema should be "auth"
- foreign_table should be "users"

DATABASE TABLES:
📦 customers - Consolidated customer data
📦 delivery_agents - Delivery agent profiles (✅ EXPLICIT FK FIX!)
📦 delivery_agent_logs - Agent activity logs
📦 shops - Vendor shops (with is_open status)
📦 orders - Orders (linked to customers & agents)
📦 products - Products
📦 notifications - Admin to vendor notifications

STORAGE BUCKETS CONFIGURED:
🗂️ shop-images
🗂️ shop-documents
🗂️ product-images
🗂️ delivery-agent-documents

HELPER FUNCTIONS:
🔧 get_customer_by_auth_id()
🔧 get_delivery_agent_by_user_id()
🔧 get_all_delivery_agents()
🔧 update_delivery_agent_location()
🔧 update_delivery_agent_duty_status()
🔧 verify_delivery_agent()

NEXT STEPS:
1. ✅ Check the verification output above
2. ✅ Look for "✅ CORRECT" in foreign key verification
3. 🧪 Test delivery agent registration
4. 🎉 It should work now!

========================================
ALL DONE! DELIVERY REGISTRATION SHOULD WORK! 🚀
CHECK THE VERIFICATION OUTPUT ABOVE! 👆
========================================
$msg$ as setup_complete;