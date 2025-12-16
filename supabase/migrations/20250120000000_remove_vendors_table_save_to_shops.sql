-- ============================================================
-- Remove Vendors Table - Save All Data Directly to Shops Table
-- This migration:
-- 1. Adds user_id, is_verified, is_approved to shops table
-- 2. Migrates any existing vendor data to shops table (if needed)
-- 3. Drops the vendors table
-- ============================================================

-- Step 1: Add missing columns to shops table for vendor registration data
ALTER TABLE shops
  -- User Account Link (replaces vendor_id)
  ADD COLUMN IF NOT EXISTS user_id UUID,
  
  -- Verification & Approval Status
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Step 2: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shops_is_verified ON shops(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_shops_is_approved ON shops(is_approved) WHERE is_approved = true;

-- Step 3: Migrate existing vendor data to shops (if vendors table exists and has data)
-- This handles any existing vendors that need to be converted to shops
DO $$
DECLARE
  vendor_record RECORD;
  shop_exists BOOLEAN;
BEGIN
  -- Check if vendors table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') THEN
    -- Loop through all vendors and create shops if they don't exist
    FOR vendor_record IN 
      SELECT * FROM vendors WHERE id IS NOT NULL
    LOOP
      -- Check if shop already exists for this vendor
      SELECT EXISTS(
        SELECT 1 FROM shops 
        WHERE vendor_id = vendor_record.id 
        OR (user_id = vendor_record.user_id AND user_id IS NOT NULL)
      ) INTO shop_exists;
      
      -- If shop doesn't exist, create it from vendor data
      IF NOT shop_exists THEN
        INSERT INTO shops (
          id,
          name,
          owner_name,
          address,
          latitude,
          longitude,
          image_url,
          email,
          mobile_number,
          whatsapp_number,
          contact_phone,
          shop_plot,
          floor,
          building,
          pincode,
          area,
          city,
          store_photos,
          shop_type,
          working_days,
          same_time,
          common_open_time,
          common_close_time,
          day_times,
          pan_document,
          gst_document,
          fssai_document,
          shop_license_document,
          aadhaar_document,
          ifsc_code,
          account_number,
          account_holder_name,
          bank_name,
          bank_branch,
          account_type,
          contract_accepted,
          profit_share,
          signature,
          user_id,
          is_active,
          is_verified,
          is_approved,
          created_at,
          updated_at
        ) VALUES (
          'shop-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 9),
          vendor_record.shop_name,
          vendor_record.owner_name,
          COALESCE(
            TRIM(
              CONCAT_WS(', ',
                NULLIF(vendor_record.shop_plot, ''),
                NULLIF(vendor_record.floor, ''),
                NULLIF(vendor_record.building, ''),
                NULLIF(vendor_record.area, ''),
                NULLIF(vendor_record.city, ''),
                NULLIF(vendor_record.pincode, '')
              )
            ),
            vendor_record.shop_name,
            'Address not provided'
          ),
          COALESCE(vendor_record.latitude, 16.5062),
          COALESCE(vendor_record.longitude, 80.6480),
          COALESCE(
            CASE 
              WHEN array_length(vendor_record.store_photos, 1) > 0 THEN vendor_record.store_photos[1]
              ELSE NULL
            END,
            'https://via.placeholder.com/400x300?text=Shop+Photo'
          ),
          vendor_record.email,
          vendor_record.mobile_number,
          COALESCE(vendor_record.whatsapp_number, vendor_record.mobile_number),
          vendor_record.mobile_number,
          vendor_record.shop_plot,
          vendor_record.floor,
          vendor_record.building,
          vendor_record.pincode,
          vendor_record.area,
          vendor_record.city,
          COALESCE(vendor_record.store_photos, ARRAY[]::TEXT[]),
          vendor_record.shop_type,
          COALESCE(vendor_record.working_days, ARRAY[]::TEXT[]),
          COALESCE(vendor_record.same_time, true),
          vendor_record.common_open_time,
          vendor_record.common_close_time,
          vendor_record.day_times,
          vendor_record.pan_document,
          vendor_record.gst_document,
          vendor_record.fssai_document,
          vendor_record.shop_license_document,
          vendor_record.aadhaar_document,
          vendor_record.ifsc_code,
          vendor_record.account_number,
          vendor_record.account_holder_name,
          vendor_record.bank_name,
          vendor_record.bank_branch,
          vendor_record.account_type,
          COALESCE(vendor_record.contract_accepted, false),
          COALESCE(vendor_record.profit_share, 20),
          vendor_record.signature,
          vendor_record.user_id,
          COALESCE(vendor_record.is_active, true),
          COALESCE(vendor_record.is_verified, false),
          COALESCE(vendor_record.is_approved, false),
          vendor_record.created_at,
          vendor_record.updated_at
        );
        
        RAISE NOTICE 'Migrated vendor % to shops table', vendor_record.id;
      ELSE
        RAISE NOTICE 'Shop already exists for vendor %, skipping', vendor_record.id;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Step 4: Drop vendor_id column from shops table (no longer needed)
ALTER TABLE shops DROP COLUMN IF EXISTS vendor_id;

-- Step 5: Drop foreign key constraint on vendors if it exists
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_vendor_id_fkey;

-- Step 6: Drop indexes related to vendors table
DROP INDEX IF EXISTS idx_shops_vendor_id;

-- Step 7: Drop the vendors table (after migration is complete)
DROP TABLE IF EXISTS vendors CASCADE;

-- Step 8: Drop trigger that was creating shops from vendors (no longer needed)
DROP TRIGGER IF EXISTS trigger_create_shop_on_vendor_approval ON vendors;
DROP FUNCTION IF EXISTS create_shop_on_vendor_approval();

-- Add comments
COMMENT ON COLUMN shops.user_id IS 'Links to auth.users(id) - vendor account';
COMMENT ON COLUMN shops.is_verified IS 'Whether vendor documents are verified by admin';
COMMENT ON COLUMN shops.is_approved IS 'Whether vendor is approved by admin (only approved shops appear in customer app)';
