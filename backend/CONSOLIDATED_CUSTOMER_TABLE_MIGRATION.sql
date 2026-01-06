-- ============================================================
-- CONSOLIDATED CUSTOMER TABLE MIGRATION
-- All customer details in a single table
-- ============================================================
-- 
-- This migration:
-- 1. Creates a single 'customers' table with all customer details
-- 2. Migrates existing data from users + user_profiles + addresses
-- 3. Updates foreign key references
-- 4. Keeps backward compatibility with existing structure
-- 
-- Run this in Supabase SQL Editor
-- ============================================================

-- ========================================
-- PART 1: CREATE CONSOLIDATED CUSTOMERS TABLE
-- ========================================

-- Drop the table if it exists (for fresh start)
DROP TABLE IF EXISTS customers CASCADE;

-- Create the consolidated customers table
CREATE TABLE customers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication (links to auth.users)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
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
  -- Format: [{"id": "uuid", "contactName": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "landmark": "...", "label": "Home/Office/Other", "isDefault": false}]
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Indexes for performance
  CONSTRAINT customers_phone_unique UNIQUE (phone)
);

-- Create indexes
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);
-- Create partial unique index for email (only when email is not null)
CREATE UNIQUE INDEX idx_customers_email_unique ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_is_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Add comments
COMMENT ON TABLE customers IS 'Consolidated table for all customer information including profile and address data';
COMMENT ON COLUMN customers.auth_user_id IS 'Links to Supabase auth.users(id) for authentication';
COMMENT ON COLUMN customers.additional_addresses IS 'JSONB array of additional addresses. Format: [{"id": "uuid", "contactName": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "landmark": "...", "label": "Home/Office/Other", "isDefault": false}]';

-- ========================================
-- PART 2: MIGRATE EXISTING DATA
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
  
  -- Link to auth user
  u.id as auth_user_id,
  
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
WHERE u.id IS NOT NULL;

-- ========================================
-- PART 3: UPDATE FOREIGN KEY REFERENCES
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

-- ========================================
-- PART 4: DISABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PART 5: CREATE HELPER FUNCTIONS
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
    UPDATE customers
    SET 
      is_default_address = false,
      additional_addresses = jsonb_set(
        jsonb_set(
          additional_addresses,
          '{*}'::text[],
          jsonb_set(
            jsonb_extract_path(additional_addresses, '*'),
            '{isDefault}',
            'false'::jsonb
          )
        ),
        '{*}'::text[],
        jsonb_set(
          jsonb_extract_path(additional_addresses, '*'),
          '{isDefault}',
          'false'::jsonb
        )
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
      is_default_address = true
    WHERE id = customer_uuid;
  ELSE
    -- Add to additional_addresses array
    UPDATE customers
    SET additional_addresses = additional_addresses || jsonb_build_array(address_json)
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

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- ========================================
-- PART 7: VERIFICATION QUERIES
-- ========================================

-- Count customers
SELECT 
  '✅ Customers table created' as status,
  COUNT(*) as total_customers,
  COUNT(auth_user_id) as customers_with_auth,
  COUNT(CASE WHEN street IS NOT NULL THEN 1 END) as customers_with_address,
  COUNT(CASE WHEN jsonb_array_length(additional_addresses) > 0 THEN 1 END) as customers_with_multiple_addresses
FROM customers;

-- Sample customer data
SELECT 
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

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '
========================================
✅ CONSOLIDATED CUSTOMER TABLE CREATED!
========================================

WHAT WAS DONE:
✅ Created single "customers" table with all customer details
✅ Migrated data from users + user_profiles + addresses
✅ Created helper functions for address management
✅ Updated foreign key references in orders and login_sessions
✅ Added indexes for performance

TABLE STRUCTURE:
- id (UUID, Primary Key)
- auth_user_id (links to auth.users)
- name, email, phone, gender, profile_picture
- Primary address fields (street, city, state, postal_code, etc.)
- additional_addresses (JSONB array for multiple addresses)
- Timestamps and status fields

HELPER FUNCTIONS:
- get_customer_by_auth_id(auth_id) - Get customer by auth user ID
- add_customer_address(...) - Add new address
- update_customer_address(...) - Update existing address
- delete_customer_address(...) - Delete address

NEXT STEPS:
1. Update backend API to use "customers" table instead of separate tables
2. Update frontend to work with consolidated customer data
3. Test customer registration and address management

========================================
' as migration_complete;

