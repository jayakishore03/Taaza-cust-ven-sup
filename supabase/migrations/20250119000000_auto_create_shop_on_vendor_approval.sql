-- ============================================================
-- Auto-Create Shop When Vendor is Approved
-- This trigger automatically creates a shop in shops table
-- when a vendor's is_approved status changes to true
-- ============================================================

-- Function to create shop from vendor data when vendor is approved
CREATE OR REPLACE FUNCTION create_shop_on_vendor_approval()
RETURNS TRIGGER AS $$
DECLARE
  shop_id_text TEXT;
  full_address TEXT;
  shop_latitude DOUBLE PRECISION;
  shop_longitude DOUBLE PRECISION;
  shop_image_url TEXT;
BEGIN
  -- Only proceed if vendor is being approved (is_approved changed from false to true)
  IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
    
    -- Check if shop already exists for this vendor
    IF EXISTS (SELECT 1 FROM shops WHERE vendor_id = NEW.id) THEN
      -- Shop exists, just activate it
      UPDATE shops 
      SET is_active = true,
          updated_at = NOW()
      WHERE vendor_id = NEW.id;
      
      RAISE NOTICE 'Shop already exists for vendor %, activated it', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Generate shop ID
    shop_id_text := 'shop-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 9);
    
    -- Construct full address
    full_address := COALESCE(
      TRIM(
        CONCAT_WS(', ',
          NULLIF(NEW.shop_plot, ''),
          NULLIF(NEW.floor, ''),
          NULLIF(NEW.building, ''),
          NULLIF(NEW.area, ''),
          NULLIF(NEW.city, ''),
          NULLIF(NEW.pincode, '')
        )
      ),
      NEW.shop_name,
      'Address not provided'
    );
    
    -- Get coordinates (with defaults)
    shop_latitude := COALESCE(NEW.latitude, 16.5062); -- Default: Vijayawada
    shop_longitude := COALESCE(NEW.longitude, 80.6480); -- Default: Vijayawada
    
    -- Get first photo or default
    shop_image_url := COALESCE(
      CASE 
        WHEN array_length(NEW.store_photos, 1) > 0 THEN NEW.store_photos[1]
        ELSE NULL
      END,
      'https://via.placeholder.com/400x300?text=Shop+Photo'
    );
    
    -- Insert shop into shops table
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
      vendor_id,
      is_active
    ) VALUES (
      shop_id_text,
      NEW.shop_name,
      NEW.owner_name,
      full_address,
      shop_latitude,
      shop_longitude,
      shop_image_url,
      NEW.email,
      NEW.mobile_number,
      COALESCE(NEW.whatsapp_number, NEW.mobile_number),
      NEW.mobile_number,
      NEW.shop_plot,
      NEW.floor,
      NEW.building,
      NEW.pincode,
      NEW.area,
      NEW.city,
      COALESCE(NEW.store_photos, ARRAY[]::TEXT[]),
      NEW.shop_type,
      COALESCE(NEW.working_days, ARRAY[]::TEXT[]),
      COALESCE(NEW.same_time, true),
      NEW.common_open_time,
      NEW.common_close_time,
      NEW.day_times,
      NEW.pan_document,
      NEW.gst_document,
      NEW.fssai_document,
      NEW.shop_license_document,
      NEW.aadhaar_document,
      NEW.ifsc_code,
      NEW.account_number,
      NEW.account_holder_name,
      NEW.bank_name,
      NEW.bank_branch,
      NEW.account_type,
      COALESCE(NEW.contract_accepted, false),
      COALESCE(NEW.profit_share, 20),
      NEW.signature,
      NEW.id,
      true
    );
    
    RAISE NOTICE 'Shop created automatically for approved vendor %: %', NEW.id, shop_id_text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires when vendor is updated
DROP TRIGGER IF EXISTS trigger_create_shop_on_vendor_approval ON vendors;
CREATE TRIGGER trigger_create_shop_on_vendor_approval
  AFTER UPDATE OF is_approved ON vendors
  FOR EACH ROW
  WHEN (NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL))
  EXECUTE FUNCTION create_shop_on_vendor_approval();

COMMENT ON FUNCTION create_shop_on_vendor_approval() IS 'Automatically creates a shop in shops table when a vendor is approved (is_approved changes to true)';
COMMENT ON TRIGGER trigger_create_shop_on_vendor_approval ON vendors IS 'Triggers shop creation when vendor is_approved status changes to true';
