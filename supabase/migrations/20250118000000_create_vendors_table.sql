-- ============================================================
-- Create Vendors Table for Complete Vendor Registration Data
-- This table stores all vendor registration details separately from shops
-- ============================================================

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vendor Account Link (no foreign key constraint to allow flexible creation)
  user_id UUID UNIQUE,
  
  -- Step 1: Basic Details
  owner_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_plot TEXT,
  floor TEXT,
  building TEXT,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area TEXT,
  city TEXT,
  store_photos TEXT[] DEFAULT '{}',
  shop_type TEXT, -- 'chicken', 'mutton', 'pork', 'meat', 'multi'
  
  -- Step 2: Contact Details
  email TEXT NOT NULL UNIQUE,
  mobile_number TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,
  
  -- Step 3: Working Days & Timings
  working_days TEXT[] DEFAULT '{}',
  same_time BOOLEAN DEFAULT true,
  common_open_time TEXT,
  common_close_time TEXT,
  day_times JSONB,
  
  -- Step 4: Documents (all document image URLs)
  pan_document TEXT,
  gst_document TEXT,
  fssai_document TEXT,
  shop_license_document TEXT,
  aadhaar_document TEXT,
  
  -- Step 5: Bank Details
  ifsc_code TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  account_type TEXT,
  
  -- Step 6: Contract & Signature
  contract_accepted BOOLEAN DEFAULT false,
  profit_share INTEGER DEFAULT 20,
  signature TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Admin verification status
  is_approved BOOLEAN DEFAULT false, -- Admin approval status
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_mobile_number ON vendors(mobile_number);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON vendors(is_approved);
CREATE INDEX IF NOT EXISTS idx_vendors_shop_type ON vendors(shop_type);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);

-- Add comments for documentation
COMMENT ON TABLE vendors IS 'Complete vendor registration data and profile information';
COMMENT ON COLUMN vendors.user_id IS 'Reference to auth.users(id) - links vendor to Supabase Auth account';
COMMENT ON COLUMN vendors.owner_name IS 'Shop owner full name';
COMMENT ON COLUMN vendors.shop_name IS 'Shop/store name';
COMMENT ON COLUMN vendors.shop_plot IS 'Shop/Plot number in address';
COMMENT ON COLUMN vendors.floor IS 'Floor number (optional)';
COMMENT ON COLUMN vendors.building IS 'Building/Complex name';
COMMENT ON COLUMN vendors.pincode IS 'Postal code';
COMMENT ON COLUMN vendors.area IS 'Area name (auto-detected from location)';
COMMENT ON COLUMN vendors.city IS 'City name (auto-detected from location)';
COMMENT ON COLUMN vendors.store_photos IS 'Array of store photo URLs';
COMMENT ON COLUMN vendors.shop_type IS 'Shop type: chicken, mutton, pork, meat, multi';
COMMENT ON COLUMN vendors.email IS 'Vendor email address (unique)';
COMMENT ON COLUMN vendors.mobile_number IS 'Primary contact mobile number (unique)';
COMMENT ON COLUMN vendors.whatsapp_number IS 'WhatsApp contact number';
COMMENT ON COLUMN vendors.working_days IS 'Array of working days: [Monday, Tuesday, ...]';
COMMENT ON COLUMN vendors.same_time IS 'If true, use common_open_time and common_close_time for all days';
COMMENT ON COLUMN vendors.common_open_time IS 'Common opening time (HH:MM format) when same_time is true';
COMMENT ON COLUMN vendors.common_close_time IS 'Common closing time (HH:MM format) when same_time is true';
COMMENT ON COLUMN vendors.day_times IS 'JSON object with day-wise timings: {"Monday": {"open_time": "09:00", "close_time": "18:00"}}';
COMMENT ON COLUMN vendors.pan_document IS 'PAN card document image URL';
COMMENT ON COLUMN vendors.gst_document IS 'GSTIN document image URL (optional)';
COMMENT ON COLUMN vendors.fssai_document IS 'FSSAI license document image URL';
COMMENT ON COLUMN vendors.shop_license_document IS 'Shop/Trade license document image URL';
COMMENT ON COLUMN vendors.aadhaar_document IS 'Aadhaar card document image URL';
COMMENT ON COLUMN vendors.ifsc_code IS 'Bank IFSC code';
COMMENT ON COLUMN vendors.account_number IS 'Bank account number';
COMMENT ON COLUMN vendors.account_holder_name IS 'Bank account holder name';
COMMENT ON COLUMN vendors.bank_name IS 'Bank name';
COMMENT ON COLUMN vendors.bank_branch IS 'Bank branch name';
COMMENT ON COLUMN vendors.account_type IS 'Account type: Savings, Current, etc.';
COMMENT ON COLUMN vendors.contract_accepted IS 'Whether vendor accepted terms and conditions';
COMMENT ON COLUMN vendors.profit_share IS 'Profit share percentage (default: 20)';
COMMENT ON COLUMN vendors.signature IS 'Vendor signature image URL';
COMMENT ON COLUMN vendors.is_active IS 'Whether vendor account is active';
COMMENT ON COLUMN vendors.is_verified IS 'Whether vendor documents are verified by admin';
COMMENT ON COLUMN vendors.is_approved IS 'Whether vendor is approved by admin to operate';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Add vendor_id column to shops table to link shops to vendors
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

-- Create index for vendor_id in shops table
CREATE INDEX IF NOT EXISTS idx_shops_vendor_id ON shops(vendor_id);

COMMENT ON COLUMN shops.vendor_id IS 'Reference to vendors(id) - links shop to vendor profile';

