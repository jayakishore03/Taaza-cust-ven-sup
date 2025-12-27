-- ============================================================
-- Add Complete Shop Registration Fields to Shops Table
-- This migration adds all fields needed to store complete vendor registration data
-- ============================================================

-- Add missing columns to shops table for complete registration data
ALTER TABLE shops
  -- Step 1: Basic Details (some already exist, adding missing ones)
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_plot TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS store_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shop_type TEXT,
  
  -- Step 2: Contact Details (some already exist)
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT, -- Keep for backward compatibility
  
  -- Step 3: Working Days & Timings
  ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS same_time BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS common_open_time TEXT,
  ADD COLUMN IF NOT EXISTS common_close_time TEXT,
  ADD COLUMN IF NOT EXISTS day_times JSONB,
  
  -- Step 4: Documents (all document image URLs)
  ADD COLUMN IF NOT EXISTS pan_document TEXT,
  ADD COLUMN IF NOT EXISTS gst_document TEXT,
  ADD COLUMN IF NOT EXISTS fssai_document TEXT,
  ADD COLUMN IF NOT EXISTS shop_license_document TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_document TEXT,
  
  -- Step 5: Bank Details
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  
  -- Step 6: Contract & Signature
  ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profit_share INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS signature TEXT,
  
  -- Vendor Link
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing shops to have default values where needed
UPDATE shops
SET 
  store_photos = COALESCE(store_photos, '{}'),
  working_days = COALESCE(working_days, '{}'),
  same_time = COALESCE(same_time, true),
  contract_accepted = COALESCE(contract_accepted, false),
  profit_share = COALESCE(profit_share, 20),
  is_active = COALESCE(is_active, true)
WHERE store_photos IS NULL 
   OR working_days IS NULL 
   OR same_time IS NULL 
   OR contract_accepted IS NULL 
   OR profit_share IS NULL
   OR is_active IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shops_vendor_id ON shops(vendor_id);
CREATE INDEX IF NOT EXISTS idx_shops_email ON shops(email);
CREATE INDEX IF NOT EXISTS idx_shops_mobile_number ON shops(mobile_number);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_shop_type ON shops(shop_type);
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);

-- Add comments for documentation
COMMENT ON COLUMN shops.owner_name IS 'Shop owner full name';
COMMENT ON COLUMN shops.shop_plot IS 'Shop/Plot number in address';
COMMENT ON COLUMN shops.floor IS 'Floor number (optional)';
COMMENT ON COLUMN shops.building IS 'Building/Complex name';
COMMENT ON COLUMN shops.pincode IS 'Postal code';
COMMENT ON COLUMN shops.area IS 'Area name (auto-detected from location)';
COMMENT ON COLUMN shops.city IS 'City name (auto-detected from location)';
COMMENT ON COLUMN shops.store_photos IS 'Array of store photo URLs';
COMMENT ON COLUMN shops.shop_type IS 'Shop type: chicken, mutton, pork, meat, multi';
COMMENT ON COLUMN shops.email IS 'Shop email address';
COMMENT ON COLUMN shops.mobile_number IS 'Primary contact mobile number';
COMMENT ON COLUMN shops.whatsapp_number IS 'WhatsApp contact number';
COMMENT ON COLUMN shops.working_days IS 'Array of working days: [Monday, Tuesday, ...]';
COMMENT ON COLUMN shops.same_time IS 'If true, use common_open_time and common_close_time for all days';
COMMENT ON COLUMN shops.common_open_time IS 'Common opening time (HH:MM format) when same_time is true';
COMMENT ON COLUMN shops.common_close_time IS 'Common closing time (HH:MM format) when same_time is true';
COMMENT ON COLUMN shops.day_times IS 'JSON object with day-wise timings: {"Monday": {"open_time": "09:00", "close_time": "18:00"}}';
COMMENT ON COLUMN shops.pan_document IS 'PAN card document image URL';
COMMENT ON COLUMN shops.gst_document IS 'GSTIN document image URL (optional)';
COMMENT ON COLUMN shops.fssai_document IS 'FSSAI license document image URL';
COMMENT ON COLUMN shops.shop_license_document IS 'Shop/Trade license document image URL';
COMMENT ON COLUMN shops.aadhaar_document IS 'Aadhaar card document image URL';
COMMENT ON COLUMN shops.ifsc_code IS 'Bank IFSC code';
COMMENT ON COLUMN shops.account_number IS 'Bank account number';
COMMENT ON COLUMN shops.account_holder_name IS 'Bank account holder name';
COMMENT ON COLUMN shops.bank_name IS 'Bank name';
COMMENT ON COLUMN shops.bank_branch IS 'Bank branch name';
COMMENT ON COLUMN shops.account_type IS 'Account type: Savings, Current, etc.';
COMMENT ON COLUMN shops.contract_accepted IS 'Whether vendor accepted terms and conditions';
COMMENT ON COLUMN shops.profit_share IS 'Profit share percentage (default: 20)';
COMMENT ON COLUMN shops.signature IS 'Vendor signature image URL';
COMMENT ON COLUMN shops.vendor_id IS 'Reference to auth.users(id) - links shop to vendor account';

