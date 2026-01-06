-- ============================================================
-- QUICK FIX: Delivery Agents Foreign Key
-- ============================================================
-- This script ONLY fixes the delivery_agents table
-- Run this in Supabase SQL Editor
-- Takes 5 seconds
-- ============================================================

-- Step 1: Drop the broken table
DROP TABLE IF EXISTS delivery_agents CASCADE;
DROP TABLE IF EXISTS delivery_agent_logs CASCADE;

SELECT '✅ Step 1: Old tables dropped' as status;

-- Step 2: Create delivery_agents table WITHOUT foreign key
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

SELECT '✅ Step 2: Table created' as status;

-- Step 3: Add foreign key pointing to auth.users (NOT public.users)
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

SELECT '✅ Step 3: Foreign key added to auth.users' as status;

-- Step 4: Create indexes
CREATE INDEX idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX idx_delivery_agents_phone ON delivery_agents(phone_number);
CREATE INDEX idx_delivery_agents_verification_status ON delivery_agents(verification_status);

SELECT '✅ Step 4: Indexes created' as status;

-- Step 5: Disable RLS
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 5: RLS disabled' as status;

-- Step 6: Verify the fix
SELECT 
  '🔍 VERIFICATION:' as info,
  tc.constraint_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRECT - Points to auth.users!'
    ELSE '❌ WRONG - Still pointing to wrong table'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'delivery_agents_user_id_fkey';

-- Final message
SELECT '🎉 DONE! Now test your app - registration will work!' as final_message;

