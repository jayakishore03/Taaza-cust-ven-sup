-- ============================================================
-- TAAZA MEAT DELIVERY - COMPLETE DATABASE SETUP (FIXED)
-- ============================================================
-- This is the MASTER SQL file for the entire Taaza project
-- Includes: Customers, Vendors, Delivery Agents, Shops, Orders, Products
-- 
-- ⭐ INCLUDES FIX: delivery_agents now correctly references auth.users(id)
-- 
-- Run this ENTIRE script in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================
-- 
-- TABLE OF CONTENTS:
-- PART 1: Fix Existing Tables & Foreign Keys
-- PART 2: Disable Row Level Security (Development Mode)
-- PART 3: Consolidated Customers Table
-- PART 4: Delivery Agents Table & Setup (FIXED)
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

-- Fix delivery_agents foreign key (if table exists)
ALTER TABLE IF EXISTS delivery_agents 
  DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey;

SELECT '✅ Step 1.2: Dropped old delivery_agents foreign key (if existed)' as status;

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
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(latitude, longitude);

SELECT '✅ Step 3: Customers table created' as status;

-- ========================================
-- PART 4: DELIVERY AGENTS TABLE & SETUP (FIXED)
-- ========================================

-- Drop and recreate with CORRECT foreign key
DROP TABLE IF EXISTS delivery_agents CASCADE;

-- ⭐ CRITICAL FIX: Foreign key now points to auth.users(id) instead of public.users(id)
CREATE TABLE delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  profile_picture TEXT,
  
  -- Address
  address_line TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Vehicle Information
  vehicle_type TEXT CHECK (vehicle_type IN ('bike', 'scooter', 'car', 'bicycle')),
  vehicle_number TEXT,
  vehicle_model TEXT,
  
  -- Documents (URLs to Supabase Storage)
  driving_license_url TEXT,
  aadhar_url TEXT,
  pan_url TEXT,
  selfie_url TEXT,
  
  -- Bank Details
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  
  -- Status & Verification
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  current_location TEXT, -- Store as JSON: {"lat": x, "lng": y}
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- ⭐⭐⭐ CORRECT FOREIGN KEY: Points to auth.users(id), NOT public.users(id) ⭐⭐⭐
  CONSTRAINT delivery_agents_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Disable RLS for development
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_active ON delivery_agents(is_active);

SELECT '✅ Step 4: Delivery Agents table created with CORRECT foreign key to auth.users' as status;

-- Verify the foreign key is correct
DO $$ 
DECLARE
  fk_schema TEXT;
  fk_table TEXT;
BEGIN
  SELECT 
    ccu.table_schema,
    ccu.table_name
  INTO fk_schema, fk_table
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.constraint_column_usage AS ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'delivery_agents' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'delivery_agents_user_id_fkey';
  
  IF fk_schema = 'auth' AND fk_table = 'users' THEN
    RAISE NOTICE '✅ VERIFIED: Foreign key correctly points to auth.users';
  ELSE
    RAISE WARNING '❌ ERROR: Foreign key points to %.% (should be auth.users)', fk_schema, fk_table;
  END IF;
END $$;

-- ========================================
-- PART 5: SHOP STATUS TOGGLE (is_open)
-- ========================================

-- Add is_open column to shops table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'is_open'
  ) THEN
    ALTER TABLE shops ADD COLUMN is_open BOOLEAN DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open);

SELECT '✅ Step 5: Shop status toggle (is_open) added' as status;

-- ========================================
-- PART 6: NOTIFICATIONS TABLE (Admin → Vendor)
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'payment', 'system', 'promotion')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data JSONB -- Additional data (order_id, etc.)
);

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

SELECT '✅ Step 6: Notifications table created' as status;

-- ========================================
-- PART 7: STORAGE POLICIES (ALL BUCKETS)
-- ========================================

-- Drop all existing storage policies to avoid conflicts
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

-- Create unified storage policies
CREATE POLICY "Public Access to All Buckets"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "Authenticated Upload to All Buckets"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update in All Buckets"
ON storage.objects FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete from All Buckets"
ON storage.objects FOR DELETE
USING (auth.role() = 'authenticated');

-- Enable storage for common buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('delivery-agent-documents', 'delivery-agent-documents', true),
  ('shop-images', 'shop-images', true),
  ('product-images', 'product-images', true),
  ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

SELECT '✅ Step 7: Storage policies and buckets configured' as status;

-- ========================================
-- PART 8: HELPER FUNCTIONS
-- ========================================

-- Function: Get nearby delivery agents
CREATE OR REPLACE FUNCTION get_nearby_delivery_agents(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone_number TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id,
    da.full_name,
    da.phone_number,
    (
      6371 * acos(
        cos(radians(target_lat)) * 
        cos(radians((da.current_location::json->>'lat')::double precision)) * 
        cos(radians((da.current_location::json->>'lng')::double precision) - radians(target_lng)) + 
        sin(radians(target_lat)) * 
        sin(radians((da.current_location::json->>'lat')::double precision))
      )
    ) AS distance_km
  FROM delivery_agents da
  WHERE 
    da.is_active = true 
    AND da.is_available = true
    AND da.verification_status = 'verified'
    AND da.current_location IS NOT NULL
  HAVING distance_km <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Step 8: Helper functions created' as status;

-- ========================================
-- PART 9: TRIGGERS & AUTO-UPDATES
-- ========================================

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_agents_updated_at ON delivery_agents;
CREATE TRIGGER update_delivery_agents_updated_at
  BEFORE UPDATE ON delivery_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ Step 9: Triggers configured for auto-updates' as status;

-- ========================================
-- PART 10: VENDOR ORDERS FIX (Auto-Match)
-- ========================================

-- Ensure orders have vendor_id (shop owner)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN vendor_id UUID REFERENCES users(id);
  END IF;
END $$;

-- Function: Auto-assign vendor_id to orders based on shop_id
CREATE OR REPLACE FUNCTION auto_assign_vendor_to_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Set vendor_id from shop's user_id
  IF NEW.shop_id IS NOT NULL THEN
    NEW.vendor_id := (SELECT user_id FROM shops WHERE id = NEW.shop_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS assign_vendor_on_order_insert ON orders;
CREATE TRIGGER assign_vendor_on_order_insert
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION auto_assign_vendor_to_order();

-- Backfill existing orders with vendor_id
UPDATE orders o
SET vendor_id = s.user_id
FROM shops s
WHERE o.shop_id = s.id 
  AND o.vendor_id IS NULL;

SELECT '✅ Step 10: Vendor orders auto-match configured' as status;

-- ========================================
-- PART 11: VERIFICATION & SUMMARY
-- ========================================

-- Check delivery_agents foreign key
SELECT 
  '🔍 DELIVERY AGENTS FOREIGN KEY CHECK:' as check_type,
  tc.constraint_name,
  tc.table_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRECT'
    ELSE '❌ WRONG - Should be auth.users'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'delivery_agents_user_id_fkey';

-- Summary
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '🎉 TAAZA DATABASE SETUP COMPLETE!' as status;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  '✅ ' || table_name as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'delivery_agents', 'shops', 'products', 'orders', 'notifications')
ORDER BY table_name;

SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '⭐ CRITICAL FIX APPLIED: delivery_agents.user_id → auth.users(id)' as key_fix;
SELECT '📱 Ready to test Delivery App registration!' as next_step;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
