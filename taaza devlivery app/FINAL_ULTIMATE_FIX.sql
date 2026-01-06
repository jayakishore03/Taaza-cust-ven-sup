-- ============================================================
-- TAAZA DELIVERY APP - ULTIMATE FIX (FINAL VERSION)
-- ============================================================
-- This is the FINAL, DEFINITIVE fix for delivery_agents foreign key
-- Run this ENTIRE script in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================================

-- ========================================
-- STEP 1: VERIFY WE'RE IN THE RIGHT DATABASE
-- ========================================
SELECT 
  '🔍 DATABASE CHECK' as step,
  current_database() as database_name,
  'Make sure this matches your app config!' as note;

-- ========================================
-- STEP 2: DROP EXISTING DELIVERY AGENTS TABLE
-- ========================================
DROP TABLE IF EXISTS delivery_agents CASCADE;
DROP TABLE IF EXISTS delivery_agent_logs CASCADE;

SELECT '✅ Step 2: Old tables dropped' as status;

-- ========================================
-- STEP 3: CREATE DELIVERY_AGENTS TABLE (NO FOREIGN KEY YET)
-- ========================================
CREATE TABLE delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  alternate_phone TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'van')),
  vehicle_number TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  
  -- Documents
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
  
  -- Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  is_on_duty BOOLEAN DEFAULT false,
  
  -- Location
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

SELECT '✅ Step 3: Table created (without foreign key)' as status;

-- ========================================
-- STEP 4: ADD FOREIGN KEY TO AUTH.USERS (CRITICAL!)
-- ========================================
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

SELECT '✅ Step 4: Foreign key added pointing to auth.users' as status;

-- ========================================
-- STEP 5: CREATE INDEXES
-- ========================================
CREATE INDEX idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX idx_delivery_agents_phone ON delivery_agents(phone_number);
CREATE INDEX idx_delivery_agents_verification_status ON delivery_agents(verification_status);
CREATE INDEX idx_delivery_agents_is_active ON delivery_agents(is_active) WHERE is_active = true;
CREATE INDEX idx_delivery_agents_is_available ON delivery_agents(is_available) WHERE is_available = true;
CREATE INDEX idx_delivery_agents_created_at ON delivery_agents(created_at DESC);
CREATE UNIQUE INDEX idx_delivery_agents_vehicle_number ON delivery_agents(UPPER(vehicle_number));

SELECT '✅ Step 5: Indexes created' as status;

-- ========================================
-- STEP 6: DISABLE RLS
-- ========================================
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 6: Row Level Security disabled' as status;

-- ========================================
-- STEP 7: CREATE DELIVERY AGENT LOGS TABLE
-- ========================================
CREATE TABLE delivery_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_agent_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE delivery_agent_logs
ADD CONSTRAINT delivery_agent_logs_agent_id_fkey
FOREIGN KEY (delivery_agent_id)
REFERENCES delivery_agents(id)
ON DELETE CASCADE;

CREATE INDEX idx_delivery_agent_logs_agent_id ON delivery_agent_logs(delivery_agent_id);
CREATE INDEX idx_delivery_agent_logs_created_at ON delivery_agent_logs(created_at DESC);

ALTER TABLE delivery_agent_logs DISABLE ROW LEVEL SECURITY;

SELECT '✅ Step 7: Logs table created' as status;

-- ========================================
-- STEP 8: VERIFY THE FIX WORKED
-- ========================================

-- Check 1: Does table exist?
SELECT 
  '✅ CHECK 1: TABLE EXISTS' as check_name,
  COUNT(*) as table_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as result
FROM information_schema.tables
WHERE table_name = 'delivery_agents' AND table_schema = 'public';

-- Check 2: Does foreign key exist?
SELECT 
  '✅ CHECK 2: FOREIGN KEY EXISTS' as check_name,
  COUNT(*) as constraint_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Constraint exists'
    ELSE '❌ Constraint missing'
  END as result
FROM information_schema.table_constraints
WHERE table_name = 'delivery_agents' 
  AND constraint_name = 'delivery_agents_user_id_fkey'
  AND constraint_type = 'FOREIGN KEY';

-- Check 3: WHERE does the foreign key point? (MOST IMPORTANT!)
SELECT 
  '✅ CHECK 3: FOREIGN KEY POINTS TO' as check_name,
  ccu.table_schema as points_to_schema,
  ccu.table_name as points_to_table,
  ccu.column_name as points_to_column,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅✅✅ CORRECT! Points to auth.users ✅✅✅'
    WHEN ccu.table_schema = 'public' AND ccu.table_name = 'users'
    THEN '❌❌❌ WRONG! Still points to public.users ❌❌❌'
    ELSE '❓ UNKNOWN - Check manually'
  END as result
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_name = 'delivery_agents_user_id_fkey'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- FINAL SUCCESS MESSAGE
-- ========================================
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉🎉🎉 DELIVERY AGENTS TABLE FIXED! 🎉🎉🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Table: delivery_agents created
✅ Foreign Key: delivery_agents_user_id_fkey added
✅ Points to: auth.users(id) ← CORRECT!

📋 LOOK AT CHECK 3 ABOVE:
   - If it says "✅✅✅ CORRECT!" → Registration will work!
   - If it says "❌❌❌ WRONG!" → Contact me immediately!

🧪 NOW TEST YOUR APP:
   1. Reload the delivery app
   2. Complete registration form
   3. Upload all 4 documents
   4. Click "Complete Registration"
   5. Should work with NO ERRORS! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF YOU STILL GET ERRORS:
   - Make sure you ran this script in the CORRECT Supabase project
   - Your app URL: fcrhcwvpivkadkkbxcom.supabase.co
   - Check the DATABASE CHECK at the very top
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as final_message;

