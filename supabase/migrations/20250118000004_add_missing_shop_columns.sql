-- ========================================
-- Add Missing Columns to Shops Table
-- Fixes "Could not find column" errors
-- ========================================

-- Add missing document columns to shops table
ALTER TABLE IF EXISTS shops
  ADD COLUMN IF NOT EXISTS aadhaar_document TEXT;

-- Verify all document columns exist
ALTER TABLE IF EXISTS shops
  ADD COLUMN IF NOT EXISTS pan_document TEXT,
  ADD COLUMN IF NOT EXISTS gst_document TEXT,
  ADD COLUMN IF NOT EXISTS fssai_document TEXT,
  ADD COLUMN IF NOT EXISTS shop_license_document TEXT;

-- Verify all bank detail columns exist
ALTER TABLE IF EXISTS shops
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Verify all other registration columns exist
ALTER TABLE IF EXISTS shops
  ADD COLUMN IF NOT EXISTS shop_plot TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS store_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shop_type TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS same_time BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS common_open_time TEXT,
  ADD COLUMN IF NOT EXISTS common_close_time TEXT,
  ADD COLUMN IF NOT EXISTS day_times JSONB,
  ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profit_share INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS signature TEXT;

-- Reload schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

