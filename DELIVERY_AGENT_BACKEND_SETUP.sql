-- ============================================================
-- COMPLETE DELIVERY AGENT BACKEND SETUP
-- ============================================================
-- This script creates:
-- 1. delivery_agents table with all registration fields
-- 2. Storage policies for delivery-agent-documents bucket
-- 3. Indexes for performance
-- 4. Helper functions
-- 5. Triggers for auto-updates
-- ============================================================

-- ========================================
-- PART 1: CREATE DELIVERY_AGENTS TABLE
-- ========================================

-- Drop existing table if you want a fresh start (CAREFUL!)
DROP TABLE IF EXISTS delivery_agents CASCADE;

-- Create delivery_agents table
CREATE TABLE delivery_agents (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication (links to auth.users)
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  alternate_phone TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'van')),
  vehicle_number TEXT NOT NULL,
  vehicle_name TEXT NOT NULL, -- Vehicle model/name
  
  -- Documents (URLs from Supabase Storage)
  driving_license_url TEXT,
  aadhar_url TEXT,
  pan_url TEXT,
  selfie_url TEXT, -- Profile picture/selfie
  
  -- Bank Details
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  bank_account_holder_name TEXT,
  bank_branch_name TEXT,
  
  -- Verification Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT, -- If rejected, reason for rejection
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified
  
  -- Activity Status
  is_active BOOLEAN DEFAULT true, -- Can login and work
  is_available BOOLEAN DEFAULT false, -- Currently available for deliveries
  is_on_duty BOOLEAN DEFAULT false, -- Currently on duty
  
  -- Current Location (for tracking)
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
  
  -- Soft Delete (instead of hard delete)
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT, -- Admin notes about this agent
  registration_device TEXT, -- Device info during registration
  registration_ip TEXT -- IP address during registration
);

-- Add comments for documentation
COMMENT ON TABLE delivery_agents IS 'Stores all delivery agent information including profile, documents, and activity status';
COMMENT ON COLUMN delivery_agents.user_id IS 'Links to Supabase auth.users for authentication';
COMMENT ON COLUMN delivery_agents.verification_status IS 'Admin verification status: pending, verified, or rejected';
COMMENT ON COLUMN delivery_agents.is_active IS 'Whether agent can login and accept deliveries';
COMMENT ON COLUMN delivery_agents.is_available IS 'Whether agent is currently available for new deliveries';
COMMENT ON COLUMN delivery_agents.is_on_duty IS 'Whether agent is currently on duty (working)';

SELECT '✅ Step 1: delivery_agents table created' as status;

-- ========================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for fast lookups
CREATE INDEX idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX idx_delivery_agents_phone ON delivery_agents(phone_number);
CREATE INDEX idx_delivery_agents_verification_status ON delivery_agents(verification_status);
CREATE INDEX idx_delivery_agents_is_active ON delivery_agents(is_active) WHERE is_active = true;
CREATE INDEX idx_delivery_agents_is_available ON delivery_agents(is_available) WHERE is_available = true;
CREATE INDEX idx_delivery_agents_is_on_duty ON delivery_agents(is_on_duty) WHERE is_on_duty = true;
CREATE INDEX idx_delivery_agents_created_at ON delivery_agents(created_at DESC);
CREATE INDEX idx_delivery_agents_location ON delivery_agents(current_latitude, current_longitude) WHERE current_latitude IS NOT NULL;

-- Unique index on vehicle number (case-insensitive)
CREATE UNIQUE INDEX idx_delivery_agents_vehicle_number ON delivery_agents(UPPER(vehicle_number));

SELECT '✅ Step 2: Indexes created' as status;

-- ========================================
-- PART 3: DISABLE RLS (FOR DEVELOPMENT)
-- ========================================

-- Disable Row Level Security for easier development
-- Enable this in production with proper policies
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 3: RLS disabled on delivery_agents' as status;

-- ========================================
-- PART 4: CREATE TRIGGER FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS delivery_agents_updated_at ON delivery_agents;
CREATE TRIGGER delivery_agents_updated_at
  BEFORE UPDATE ON delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_agents_updated_at();

SELECT '✅ Step 4: Trigger for updated_at created' as status;

-- ========================================
-- PART 5: STORAGE POLICIES FOR DELIVERY-AGENT-DOCUMENTS
-- ========================================
-- The bucket already exists, we just need to create policies
-- Policies for both 'anon' (unauthenticated) and 'authenticated' roles
-- ========================================

-- Drop existing policies (clean slate)
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (policyname ILIKE '%delivery%agent%' OR policyname ILIKE '%delivery_agent%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- ===== POLICIES FOR ANON ROLE (Unauthenticated - During Registration) =====

-- Allow INSERT (upload during registration)
CREATE POLICY "delivery_agent_documents_insert_anon"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'delivery-agent-documents');

-- Allow SELECT (view documents)
CREATE POLICY "delivery_agent_documents_select_anon"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'delivery-agent-documents');

-- Allow UPDATE (update documents)
CREATE POLICY "delivery_agent_documents_update_anon"
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'delivery-agent-documents');

-- Allow DELETE (delete documents if needed)
CREATE POLICY "delivery_agent_documents_delete_anon"
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'delivery-agent-documents');

-- ===== POLICIES FOR AUTHENTICATED ROLE (Logged In) =====

-- Allow INSERT (upload documents)
CREATE POLICY "delivery_agent_documents_insert_auth"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'delivery-agent-documents');

-- Allow SELECT (view documents)
CREATE POLICY "delivery_agent_documents_select_auth"
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'delivery-agent-documents');

-- Allow UPDATE (update documents)
CREATE POLICY "delivery_agent_documents_update_auth"
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'delivery-agent-documents');

-- Allow DELETE (delete documents)
CREATE POLICY "delivery_agent_documents_delete_auth"
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'delivery-agent-documents');

-- ===== POLICIES FOR SERVICE_ROLE (Super Admin) =====

-- Allow all operations for service role (backend/admin)
CREATE POLICY "delivery_agent_documents_all_service"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'delivery-agent-documents')
WITH CHECK (bucket_id = 'delivery-agent-documents');

SELECT '✅ Step 5: Storage policies created for delivery-agent-documents bucket' as status;

-- Verify policies
SELECT 
  '📋 Storage Policies for delivery-agent-documents:' as info,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%delivery%agent%'
ORDER BY policyname;

-- ========================================
-- PART 6: HELPER FUNCTIONS
-- ========================================

-- Function to get delivery agent by user_id
CREATE OR REPLACE FUNCTION get_delivery_agent_by_user_id(agent_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  alternate_phone TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  vehicle_name TEXT,
  driving_license_url TEXT,
  aadhar_url TEXT,
  pan_url TEXT,
  selfie_url TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_name TEXT,
  bank_account_holder_name TEXT,
  bank_branch_name TEXT,
  verification_status TEXT,
  is_active BOOLEAN,
  is_available BOOLEAN,
  is_on_duty BOOLEAN,
  total_deliveries INTEGER,
  completed_deliveries INTEGER,
  average_rating DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id,
    da.user_id,
    da.full_name,
    da.email,
    da.phone_number,
    da.alternate_phone,
    da.vehicle_type,
    da.vehicle_number,
    da.vehicle_name,
    da.driving_license_url,
    da.aadhar_url,
    da.pan_url,
    da.selfie_url,
    da.bank_account_number,
    da.bank_ifsc_code,
    da.bank_name,
    da.bank_account_holder_name,
    da.bank_branch_name,
    da.verification_status,
    da.is_active,
    da.is_available,
    da.is_on_duty,
    da.total_deliveries,
    da.completed_deliveries,
    da.average_rating,
    da.created_at
  FROM delivery_agents da
  WHERE da.user_id = agent_user_id
    AND da.deleted_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all delivery agents (for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_delivery_agents(
  status_filter TEXT DEFAULT NULL, -- 'pending', 'verified', 'rejected', or NULL for all
  active_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  alternate_phone TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  vehicle_name TEXT,
  verification_status TEXT,
  is_active BOOLEAN,
  is_available BOOLEAN,
  is_on_duty BOOLEAN,
  total_deliveries INTEGER,
  completed_deliveries INTEGER,
  average_rating DECIMAL,
  created_at TIMESTAMPTZ,
  selfie_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id,
    da.user_id,
    da.full_name,
    da.email,
    da.phone_number,
    da.alternate_phone,
    da.vehicle_type,
    da.vehicle_number,
    da.vehicle_name,
    da.verification_status,
    da.is_active,
    da.is_available,
    da.is_on_duty,
    da.total_deliveries,
    da.completed_deliveries,
    da.average_rating,
    da.created_at,
    da.selfie_url
  FROM delivery_agents da
  WHERE da.deleted_at IS NULL
    AND (status_filter IS NULL OR da.verification_status = status_filter)
    AND (active_only = false OR da.is_active = true)
  ORDER BY da.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update delivery agent location
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
  WHERE user_id = agent_user_id
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update delivery agent duty status
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
    is_available = on_duty, -- When going on duty, become available; when going off duty, become unavailable
    updated_at = NOW()
  WHERE user_id = agent_user_id
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify/reject delivery agent (for admin)
CREATE OR REPLACE FUNCTION verify_delivery_agent(
  agent_id UUID,
  status TEXT, -- 'verified' or 'rejected'
  admin_user_id UUID,
  rejection_reason_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Validate status
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
  WHERE id = agent_id
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Step 6: Helper functions created' as status;

-- ========================================
-- PART 7: ADD FOREIGN KEY TO ORDERS TABLE
-- ========================================
-- Link orders to delivery agents for tracking
-- ========================================

-- Add delivery_agent_id column to orders if it doesn't exist
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES delivery_agents(id) ON DELETE SET NULL;

-- Add delivery agent info columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_agent_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_agent_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_agent_vehicle_number TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_agent_id ON orders(delivery_agent_id);

-- Create index for agent's orders
CREATE INDEX IF NOT EXISTS idx_orders_delivery_agent_status ON orders(delivery_agent_id, status) WHERE delivery_agent_id IS NOT NULL;

SELECT '✅ Step 7: Orders table updated with delivery agent fields' as status;

-- ========================================
-- PART 8: CREATE DELIVERY_AGENT_LOGS TABLE
-- ========================================
-- Track agent activity logs
-- ========================================

CREATE TABLE IF NOT EXISTS delivery_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_agent_id UUID REFERENCES delivery_agents(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'logout', 'duty_on', 'duty_off', 'location_update', 'order_accepted', 'order_completed', etc.
  details JSONB DEFAULT '{}'::jsonb, -- Additional details as JSON
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_delivery_agent_logs_agent_id ON delivery_agent_logs(delivery_agent_id);
CREATE INDEX idx_delivery_agent_logs_created_at ON delivery_agent_logs(created_at DESC);
CREATE INDEX idx_delivery_agent_logs_action ON delivery_agent_logs(action);

-- Disable RLS
ALTER TABLE delivery_agent_logs DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 8: delivery_agent_logs table created' as status;

-- ========================================
-- PART 9: VERIFICATION & SUMMARY
-- ========================================

-- Verify delivery_agents table
SELECT 
  '✅ VERIFICATION: delivery_agents table' as check_type,
  COUNT(*) as total_agents,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_agents,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_agents,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_agents,
  COUNT(*) FILTER (WHERE is_active = true) as active_agents,
  COUNT(*) FILTER (WHERE is_on_duty = true) as on_duty_agents
FROM delivery_agents;

-- Verify storage policies
SELECT 
  '✅ VERIFICATION: Storage policies' as check_type,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname ILIKE '%delivery%agent%';

-- Verify indexes
SELECT 
  '✅ VERIFICATION: Indexes' as check_type,
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE tablename = 'delivery_agents';

-- Verify helper functions
SELECT 
  '✅ VERIFICATION: Helper functions' as check_type,
  COUNT(*) as total_functions
FROM pg_proc
WHERE proname ILIKE '%delivery_agent%';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT $msg$
========================================
✅✅✅ DELIVERY AGENT BACKEND SETUP COMPLETE! ✅✅✅
========================================

WHAT WAS CREATED:
✅ delivery_agents table with all registration fields
✅ Storage policies for delivery-agent-documents bucket (anon, authenticated, service_role)
✅ Indexes for fast queries and lookups
✅ Trigger for auto-updating updated_at timestamp
✅ Helper functions:
   - get_delivery_agent_by_user_id()
   - get_all_delivery_agents()
   - update_delivery_agent_location()
   - update_delivery_agent_duty_status()
   - verify_delivery_agent()
✅ delivery_agent_logs table for activity tracking
✅ Foreign key in orders table for delivery assignment

DELIVERY AGENT REGISTRATION FIELDS:
- Personal: full_name, email, phone_number, alternate_phone
- Vehicle: vehicle_type, vehicle_number, vehicle_name
- Documents: driving_license_url, aadhar_url, pan_url, selfie_url
- Bank: account_number, ifsc_code, bank_name, account_holder_name, branch_name
- Status: verification_status, is_active, is_available, is_on_duty
- Location: current_latitude, current_longitude
- Stats: total_deliveries, completed_deliveries, average_rating

STORAGE BUCKET:
- Bucket name: delivery-agent-documents
- Policies: Full access for anon, authenticated, and service_role
- File types: Any (for documents, images, PDFs)

SUPER ADMIN DASHBOARD:
- Can view all delivery agents with get_all_delivery_agents()
- Can verify/reject agents with verify_delivery_agent()
- Can track agent location and status
- Can view agent statistics and logs

NEXT STEPS:
1. Update delivery app to save registration data to delivery_agents table
2. Update super admin dashboard to fetch agents from delivery_agents table
3. Implement backend API endpoints for:
   - POST /api/delivery-agents/register
   - GET /api/delivery-agents (for admin)
   - GET /api/delivery-agents/:id
   - PATCH /api/delivery-agents/:id/verify
   - PATCH /api/delivery-agents/:id/location
   - PATCH /api/delivery-agents/:id/duty-status

========================================
$msg$ as setup_complete;

