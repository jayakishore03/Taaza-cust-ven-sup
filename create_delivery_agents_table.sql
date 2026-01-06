/*
  # Delivery Agents Table - Complete Registration Data
  
  This script creates a comprehensive table to store all delivery agent details
  collected during the registration process in the Taaza Delivery App.
  
  ## Registration Data Collected:
  
  ### Step 1: Personal Details (from register.tsx)
  - full_name
  - email
  - phone_number (primary)
  - alternate_phone
  - password (stored in auth.users, not here)
  
  ### Step 2: Vehicle Details (from register.tsx)
  - vehicle_type (bike, auto, van)
  - vehicle_number
  - vehicle_name
  
  ### Step 3: Documents (from register-documents.tsx)
  - driving_license_url
  - aadhar_url
  - pan_url
  
  ### Step 4: Bank Details (from register-documents.tsx)
  - account_holder_name
  - account_number
  - ifsc_code
  - bank_name
  - branch_name
  
  ## Additional Fields:
  - user_id (links to auth.users)
  - verification_status (pending, verified, rejected)
  - is_active (whether agent can accept orders)
  - on_duty (current duty status)
  - created_at, updated_at
*/

-- ============================================
-- CREATE DELIVERY AGENTS TABLE
-- ============================================

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

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE delivery_agents IS 'Stores complete registration details for delivery agents/riders';
COMMENT ON COLUMN delivery_agents.user_id IS 'Links to Supabase auth.users table for authentication';
COMMENT ON COLUMN delivery_agents.vehicle_type IS 'Type of vehicle: bike, auto, or van';
COMMENT ON COLUMN delivery_agents.verification_status IS 'Document verification status: pending, verified, or rejected';
COMMENT ON COLUMN delivery_agents.is_active IS 'Whether the agent is approved and can accept orders';
COMMENT ON COLUMN delivery_agents.on_duty IS 'Current duty status (On Duty/Off Duty toggle)';

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_delivery_agents_user_id ON delivery_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_email ON delivery_agents(email);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_phone_number ON delivery_agents(phone_number);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_verification_status ON delivery_agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_is_active ON delivery_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_on_duty ON delivery_agents(on_duty);

-- ============================================
-- UPDATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_delivery_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_agents_updated_at
  BEFORE UPDATE ON delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_agents_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE delivery_agents ENABLE ROW LEVEL SECURITY;

-- Policy: Delivery agents can view their own profile
CREATE POLICY "Delivery agents can view own profile"
  ON delivery_agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own delivery agent profile
CREATE POLICY "Users can create own delivery agent profile"
  ON delivery_agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Delivery agents can update their own profile
CREATE POLICY "Delivery agents can update own profile"
  ON delivery_agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all delivery agents (optional - adjust based on your admin role)
-- Uncomment and modify if you have an admin role
-- CREATE POLICY "Admins can view all delivery agents"
--   ON delivery_agents FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_profiles.id = auth.uid()
--       AND user_profiles.role = 'admin'
--     )
--   );

-- ============================================
-- OPTIONAL: UPDATE ORDERS TABLE TO USE rider_id
-- ============================================
-- If you want to link orders to delivery_agents instead of using text fields,
-- you can add this column to the orders table:

-- ALTER TABLE orders 
--   ADD COLUMN IF NOT EXISTS rider_id uuid REFERENCES delivery_agents(id) ON DELETE SET NULL;

-- Then update existing orders to link to delivery_agents:
-- UPDATE orders o
-- SET rider_id = da.id
-- FROM delivery_agents da
-- WHERE o.delivery_agent_name = da.full_name
--   AND o.delivery_agent_mobile = da.phone_number
--   AND o.rider_id IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify table was created
SELECT 
  '✅ Delivery Agents table created successfully' as status,
  COUNT(*) as total_agents
FROM delivery_agents;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'delivery_agents'
ORDER BY ordinal_position;


