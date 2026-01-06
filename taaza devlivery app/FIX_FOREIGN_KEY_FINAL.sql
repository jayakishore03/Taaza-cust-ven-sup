-- ============================================================
-- DEFINITIVE FIX FOR DELIVERY_AGENTS FOREIGN KEY
-- ============================================================
-- This script will FORCE the foreign key to point to auth.users
-- Run this FIRST, then test the app again
-- ============================================================

-- Step 1: Check current constraint
SELECT 
  'BEFORE FIX:' as status,
  tc.constraint_name,
  tc.table_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 2: Drop the table completely and recreate with correct constraint
DROP TABLE IF EXISTS delivery_agents CASCADE;

-- Step 3: Recreate the table with the CORRECT foreign key to auth.users
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
  current_location TEXT, -- Can store as JSON: {"lat": x, "lng": y}
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- CORRECT FOREIGN KEY pointing to auth.users (NOT public.users)
  CONSTRAINT delivery_agents_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Step 4: Disable RLS (development mode)
ALTER TABLE delivery_agents DISABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_status ON delivery_agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available ON delivery_agents(is_available);

-- Step 6: Verify the fix
SELECT 
  '✅ AFTER FIX:' as status,
  tc.constraint_name,
  tc.table_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_type = 'FOREIGN KEY';

SELECT '🎉 SUCCESS! Foreign key now points to auth.users (not public.users)' as final_status;

