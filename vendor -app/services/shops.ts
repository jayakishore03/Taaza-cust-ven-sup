/**
 * Shop Service for Vendor App
 * Handles shop registration and management with Supabase
 */

import { supabase } from '../lib/supabase';

export interface ShopRegistrationData {
  // Step 1: Basic Details
  ownerName: string;
  storeName: string;
  shopPlot?: string;
  floor?: string;
  building?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  city?: string;
  storePhotos?: string[];
  shopType?: string;
  
  // Step 2: Contact Details
  email: string;
  mobileNumber: string;
  whatsappNumber?: string;
  isWhatsAppSame?: boolean;
  otpVerified?: boolean;
  
  // Step 3: Working Days
  workingDays?: string[];
  sameTime?: boolean;
  commonOpenTime?: string;
  commonCloseTime?: string;
  dayTimes?: Record<string, { open: string; close: string }>;
  
  // Step 4: Documents (stored as objects with uri, name, type)
  documents?: {
    pan?: { uri: string; name: string; type: string };
    gst?: { uri: string; name: string; type: string };
    fssai?: { uri: string; name: string; type: string };
    shopLicense?: { uri: string; name: string; type: string };
    aadhaar?: { uri: string; name: string; type: string };
  };
  // Legacy fields (kept for backward compatibility)
  panDocument?: string;
  gstDocument?: string;
  fssaiDocument?: string;
  shopLicenseDocument?: string;
  aadhaarDocument?: string;
  
  // Step 5: Bank Details
  bankDetails?: {
    ifsc?: string;
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
    bankBranch?: string;
    accountType?: string;
  };
  
  // Step 6: Contract
  contractAccepted?: boolean;
  profitShare?: number;
  signature?: string;
  
  // User account
  password: string;
}

export interface Vendor {
  id: string;
  user_id?: string;
  owner_name: string;
  shop_name: string;
  shop_plot?: string;
  floor?: string;
  building?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  city?: string;
  store_photos?: string[];
  shop_type?: string;
  email: string;
  mobile_number: string;
  whatsapp_number?: string;
  working_days?: string[];
  same_time?: boolean;
  common_open_time?: string;
  common_close_time?: string;
  day_times?: Record<string, { open_time: string; close_time: string }>;
  pan_document?: string;
  gst_document?: string;
  fssai_document?: string;
  shop_license_document?: string;
  aadhaar_document?: string;
  ifsc_code?: string;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  bank_branch?: string;
  account_type?: string;
  contract_accepted?: boolean;
  profit_share?: number;
  signature?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Shop {
  id: string;
  owner_name: string;
  name: string;
  address?: string;
  shop_plot?: string;
  floor?: string;
  building?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  city?: string;
  store_photos?: string[];
  shop_type?: string;
  image_url?: string;
  email: string;
  mobile_number: string;
  whatsapp_number?: string;
  contact_phone?: string;
  working_days?: string[];
  same_time?: boolean;
  common_open_time?: string;
  common_close_time?: string;
  day_times?: Record<string, { open_time: string; close_time: string }>;
  pan_document?: string;
  gst_document?: string;
  fssai_document?: string;
  shop_license_document?: string;
  aadhaar_document?: string;
  ifsc_code?: string;
  account_number?: string;
  account_holder_name?: string;
  bank_name?: string;
  bank_branch?: string;
  account_type?: string;
  contract_accepted?: boolean;
  profit_share?: number;
  signature?: string;
  user_id?: string; // Links to auth.users (replaces vendor_id)
  is_active?: boolean;
  is_verified?: boolean; // Admin verification status
  is_approved?: boolean; // Admin approval status (only approved shops appear in customer app)
  created_at?: string;
  updated_at?: string;
}

/**
 * Create vendor record in Supabase vendors table with all registration details
 */
export const createVendorInSupabase = async (
  registrationData: ShopRegistrationData,
  userId: string
): Promise<{ success: boolean; data?: Vendor; error?: string }> => {
  try {
    console.log('[createVendorInSupabase] Creating vendor record with all registration data...');
    
    // Prepare vendor data for Supabase
    const vendorData: any = {
      // Vendor Account Link
      user_id: userId,
      
      // Step 1: Basic Details
      owner_name: registrationData.ownerName,
      shop_name: registrationData.storeName,
      shop_plot: registrationData.shopPlot || null,
      floor: registrationData.floor || null,
      building: registrationData.building || null,
      pincode: registrationData.pincode || '',
      // CRITICAL: latitude and longitude are REQUIRED (NOT NULL in shops table)
      latitude: shopLatitude,
      longitude: shopLongitude,
      area: registrationData.area || null,
      city: registrationData.city || null,
      store_photos: registrationData.storePhotos 
        ? registrationData.storePhotos.map((photo: any) => {
            if (typeof photo === 'string') return photo;
            if (photo && typeof photo === 'object' && 'uri' in photo) return (photo as any).uri;
            return String(photo);
          })
        : [],
      shop_type: registrationData.shopType || null,
      
      // Step 2: Contact Details
      email: registrationData.email,
      mobile_number: registrationData.mobileNumber,
      whatsapp_number: registrationData.whatsappNumber || registrationData.mobileNumber,
      
      // Step 3: Working Days & Timings
      working_days: registrationData.workingDays || [],
      same_time: registrationData.sameTime ?? true,
      common_open_time: registrationData.commonOpenTime || null,
      common_close_time: registrationData.commonCloseTime || null,
      day_times: registrationData.dayTimes ? Object.keys(registrationData.dayTimes).reduce((acc, day) => {
        const times = registrationData.dayTimes![day] as any;
        const openTime = typeof times.open === 'string' 
          ? times.open 
          : (times.open instanceof Date 
              ? times.open.toTimeString().slice(0, 5) 
              : String(times.open || '09:00'));
        const closeTime = typeof times.close === 'string' 
          ? times.close 
          : (times.close instanceof Date 
              ? times.close.toTimeString().slice(0, 5) 
              : String(times.close || '18:00'));
        acc[day] = {
          open_time: openTime,
          close_time: closeTime,
        };
        return acc;
      }, {} as Record<string, { open_time: string; close_time: string }>) : null,
      
      // Step 4: Documents (all document image URLs)
      pan_document: registrationData.documents?.pan || null,
      gst_document: registrationData.documents?.gst || null,
      fssai_document: registrationData.documents?.fssai || null,
      shop_license_document: registrationData.documents?.shopLicense || null,
      aadhaar_document: registrationData.documents?.aadhaar || null,
      
      // Step 5: Bank Details
      ifsc_code: registrationData.bankDetails?.ifsc || null,
      account_number: registrationData.bankDetails?.accountNumber || null,
      account_holder_name: registrationData.bankDetails?.accountHolderName || null,
      bank_name: registrationData.bankDetails?.bankName || null,
      bank_branch: registrationData.bankDetails?.bankBranch || null,
      account_type: registrationData.bankDetails?.accountType || null,
      
      // Step 6: Contract & Signature
      contract_accepted: registrationData.contractAccepted || false,
      profit_share: registrationData.profitShare || 20,
      signature: registrationData.signature || null,
      
      // Status
      is_active: true,
      is_verified: false, // Will be verified by admin
      is_approved: false, // Will be approved by admin
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[createVendorInSupabase] Vendor data prepared:', {
      owner_name: vendorData.owner_name,
      shop_name: vendorData.shop_name,
      email: vendorData.email,
      mobile_number: vendorData.mobile_number,
      user_id: vendorData.user_id,
    });

    // Check if vendor already exists (by email or mobile_number)
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, email, mobile_number, user_id')
      .or(`email.eq.${vendorData.email},mobile_number.eq.${vendorData.mobile_number}`)
      .limit(1)
      .single();

    let data, error;

    if (existingVendor) {
      // Vendor exists - update it instead of creating duplicate
      console.log('[createVendorInSupabase] Vendor already exists, updating:', existingVendor.id);
      
      // Update existing vendor with new data
      const updateData = { ...vendorData };
      // Don't update created_at, preserve original
      delete updateData.created_at;
      updateData.updated_at = new Date().toISOString();
      
      const result = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', existingVendor.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      
      if (!error) {
        console.log('[createVendorInSupabase] Vendor updated successfully:', data.id);
      }
    } else {
      // Vendor doesn't exist - create new one
      console.log('[createVendorInSupabase] Creating new vendor record...');
      
      const result = await supabase
        .from('vendors')
        .insert(vendorData)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[createVendorInSupabase] Error:', error);
      
      // Handle duplicate key error with better message
      if (error.code === '23505') {
        if (error.message?.includes('mobile_number')) {
          return {
            success: false,
            error: 'A vendor with this mobile number already exists. Please use a different mobile number or contact support.',
          };
        }
        if (error.message?.includes('email')) {
          return {
            success: false,
            error: 'A vendor with this email already exists. Please use a different email or contact support.',
          };
        }
        return {
          success: false,
          error: 'A vendor with these details already exists. Please contact support if you need to update your registration.',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create vendor in Supabase',
      };
    }

    console.log('[createVendorInSupabase] Vendor created successfully:', {
      id: data.id,
      owner_name: data.owner_name,
      shop_name: data.shop_name,
      email: data.email,
    });

    return {
      success: true,
      data: data as Vendor,
    };
  } catch (error: any) {
    console.error('[createVendorInSupabase] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create vendor',
    };
  }
};

/**
 * Create shop from vendor data (called when vendor is approved by admin)
 * This function copies ALL vendor data to shops table
 * Shops table is the single source of truth for customer app display
 */
export const createShopFromVendor = async (
  vendor: Vendor
): Promise<{ success: boolean; data?: Shop; error?: string }> => {
  try {
    console.log('[createShopFromVendor] Creating shop from approved vendor data...');
    console.log('[createShopFromVendor] Vendor ID:', vendor.id);
    
    // Check if shop already exists for this vendor
    const existingShop = await getShopByVendorId(vendor.id);
    if (existingShop) {
      console.log('[createShopFromVendor] Shop already exists for vendor:', vendor.id);
      // Update existing shop to active
      const { data: updatedShop, error: updateError } = await supabase
        .from('shops')
        .update({ is_active: true })
        .eq('vendor_id', vendor.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[createShopFromVendor] Error updating shop:', updateError);
      } else {
        return {
          success: true,
          data: updatedShop as Shop,
        };
      }
    }
    
    // Generate unique shop ID (UUID format as string)
    const shopId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Construct full address from components
    const addressParts = [
      vendor.shop_plot,
      vendor.floor,
      vendor.building,
      vendor.area,
      vendor.city,
      vendor.pincode,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ') || vendor.shop_name || 'Address not provided';
    
    // CRITICAL: latitude and longitude are REQUIRED (NOT NULL constraint)
    const shopLatitude = vendor.latitude ?? 16.5062; // Default: Vijayawada
    const shopLongitude = vendor.longitude ?? 80.6480; // Default: Vijayawada

    // Get first store photo as image_url, or use a default
    const firstPhoto = vendor.store_photos && vendor.store_photos.length > 0 
      ? vendor.store_photos[0] 
      : null;
    const imageUrl = firstPhoto || 'https://via.placeholder.com/400x300?text=Shop+Photo';

    // Prepare shop data from vendor data
    const shopData: any = {
      id: shopId,
      // Step 1: Basic Details
      owner_name: vendor.owner_name,
      name: vendor.shop_name,
      shop_plot: vendor.shop_plot || null,
      floor: vendor.floor || null,
      building: vendor.building || null,
      pincode: vendor.pincode || '',
      latitude: shopLatitude,
      longitude: shopLongitude,
      area: vendor.area || null,
      city: vendor.city || null,
      address: fullAddress,
      store_photos: vendor.store_photos || [],
      shop_type: vendor.shop_type || null,
      image_url: imageUrl,
      
      // Step 2: Contact Details
      email: vendor.email,
      mobile_number: vendor.mobile_number,
      whatsapp_number: vendor.whatsapp_number || vendor.mobile_number,
      contact_phone: vendor.mobile_number,
      
      // Step 3: Working Days & Timings
      working_days: vendor.working_days || [],
      same_time: vendor.same_time ?? true,
      common_open_time: vendor.common_open_time || null,
      common_close_time: vendor.common_close_time || null,
      day_times: vendor.day_times || null,
      
      // Step 4: Documents
      pan_document: vendor.pan_document || null,
      gst_document: vendor.gst_document || null,
      fssai_document: vendor.fssai_document || null,
      shop_license_document: vendor.shop_license_document || null,
      aadhaar_document: vendor.aadhaar_document || null,
      
      // Step 5: Bank Details
      ifsc_code: vendor.ifsc_code || null,
      account_number: vendor.account_number || null,
      account_holder_name: vendor.account_holder_name || null,
      bank_name: vendor.bank_name || null,
      bank_branch: vendor.bank_branch || null,
      account_type: vendor.account_type || null,
      
      // Step 6: Contract & Signature
      contract_accepted: vendor.contract_accepted || false,
      profit_share: vendor.profit_share || 20,
      signature: vendor.signature || null,
      
      // Vendor Link
      vendor_id: vendor.id,
      
      // Status - Set to true so shop appears in customer app
      is_active: true,
    };

    console.log('[createShopFromVendor] Inserting shop with ID:', shopId);
    
    const { data, error } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single();

    if (error) {
      console.error('[createShopFromVendor] Error creating shop:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shop',
      };
    }

    if (!data) {
      console.error('[createShopFromVendor] Shop insert succeeded but no data returned');
      return {
        success: false,
        error: 'Shop created but data not returned',
      };
    }

    console.log('[createShopFromVendor] ✅ Shop created successfully:', {
      id: data.id,
      name: data.name,
      vendor_id: data.vendor_id,
      is_active: data.is_active,
    });

    return {
      success: true,
      data: data as Shop,
    };
  } catch (error: any) {
    console.error('[createShopFromVendor] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shop from vendor',
    };
  }
};

/**
 * Create shop in Supabase with ALL vendor registration data
 * All vendor registration data is saved directly to shops table (no vendors table)
 * Shops table is the single source of truth for both vendor registration and customer display
 */
export const createShopInSupabase = async (
  registrationData: ShopRegistrationData,
  userId: string
): Promise<{ success: boolean; data?: Shop; error?: string }> => {
  try {
    console.log('[createShopInSupabase] Creating shop with ALL vendor registration data (saving directly to shops table)...');
    
    // Generate unique shop ID (UUID format as string)
    // Using crypto.randomUUID() for unique IDs
    const shopId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[createShopInSupabase] Generated shop ID:', shopId);
    
    // Construct full address from components
    // CRITICAL: address is REQUIRED (NOT NULL constraint)
    const addressParts = [
      registrationData.shopPlot,
      registrationData.floor,
      registrationData.building,
      registrationData.area,
      registrationData.city,
      registrationData.pincode,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ') || registrationData.storeName || 'Address not provided';
    
    // CRITICAL: latitude and longitude are REQUIRED (NOT NULL constraint)
    // If not provided, use default coordinates (can be updated later)
    const shopLatitude = registrationData.latitude ?? 16.5062; // Default: Vijayawada
    const shopLongitude = registrationData.longitude ?? 80.6480; // Default: Vijayawada

    // ===== UPLOAD STORE PHOTOS TO SUPABASE STORAGE =====
    console.log('[createShopInSupabase] Uploading store photos...');
    let storePhotoUrls: string[] = [];
    let imageUrl = 'https://via.placeholder.com/400x300?text=Shop+Photo'; // Default image
    
    if (registrationData.storePhotos && registrationData.storePhotos.length > 0) {
      const { uploadShopPhotos } = require('./imageUpload');
      
      // Extract URIs from photo objects
      const photoUris = registrationData.storePhotos.map((photo: any) => {
        if (typeof photo === 'string') return photo;
        if (photo && typeof photo === 'object' && 'uri' in photo) return (photo as any).uri;
        return String(photo);
      });
      
      const uploadResult = await uploadShopPhotos(photoUris, shopId);
      
      if (uploadResult.success && uploadResult.urls.length > 0) {
        storePhotoUrls = uploadResult.urls;
        imageUrl = storePhotoUrls[0]; // Use first photo as main image
        console.log('[createShopInSupabase] Successfully uploaded', storePhotoUrls.length, 'photos');
      } else {
        console.warn('[createShopInSupabase] Photo upload failed:', uploadResult.errors);
        // Continue with registration even if photos failed to upload
        // Use local URIs as fallback (not ideal, but allows registration to complete)
        storePhotoUrls = photoUris;
        if (photoUris.length > 0) {
          imageUrl = photoUris[0];
        }
      }
    }

    // ===== UPLOAD DOCUMENTS TO SUPABASE STORAGE =====
    console.log('[createShopInSupabase] Uploading documents...');
    const { uploadDocument } = require('./imageUpload');
    
    // Extract document URIs from registration data
    // Documents are stored as { uri, name, type } objects
    let panDocUrl = registrationData.documents?.pan?.uri || registrationData.panDocument || null;
    let gstDocUrl = registrationData.documents?.gst?.uri || registrationData.gstDocument || null;
    let fssaiDocUrl = registrationData.documents?.fssai?.uri || registrationData.fssaiDocument || null;
    let shopLicenseDocUrl = registrationData.documents?.shopLicense?.uri || registrationData.shopLicenseDocument || null;
    let aadhaarDocUrl = registrationData.documents?.aadhaar?.uri || registrationData.aadhaarDocument || null;
    
    // Upload PAN document if present and is local URI
    if (panDocUrl && !panDocUrl.startsWith('https://')) {
      console.log('[createShopInSupabase] Uploading PAN document...');
      const result = await uploadDocument(panDocUrl, shopId, 'pan');
      if (result.success && result.url) {
        panDocUrl = result.url;
        console.log('[createShopInSupabase] PAN document uploaded:', panDocUrl);
      } else {
        console.warn('[createShopInSupabase] PAN document upload failed:', result.error);
      }
    }
    
    // Upload GST document if present and is local URI
    if (gstDocUrl && !gstDocUrl.startsWith('https://')) {
      console.log('[createShopInSupabase] Uploading GST document...');
      const result = await uploadDocument(gstDocUrl, shopId, 'gst');
      if (result.success && result.url) {
        gstDocUrl = result.url;
        console.log('[createShopInSupabase] GST document uploaded:', gstDocUrl);
      } else {
        console.warn('[createShopInSupabase] GST document upload failed:', result.error);
      }
    }
    
    // Upload FSSAI document if present and is local URI
    if (fssaiDocUrl && !fssaiDocUrl.startsWith('https://')) {
      console.log('[createShopInSupabase] Uploading FSSAI document...');
      const result = await uploadDocument(fssaiDocUrl, shopId, 'fssai');
      if (result.success && result.url) {
        fssaiDocUrl = result.url;
        console.log('[createShopInSupabase] FSSAI document uploaded:', fssaiDocUrl);
      } else {
        console.warn('[createShopInSupabase] FSSAI document upload failed:', result.error);
      }
    }
    
    // Upload Shop License document if present and is local URI
    if (shopLicenseDocUrl && !shopLicenseDocUrl.startsWith('https://')) {
      console.log('[createShopInSupabase] Uploading Shop License document...');
      const result = await uploadDocument(shopLicenseDocUrl, shopId, 'shop-license');
      if (result.success && result.url) {
        shopLicenseDocUrl = result.url;
        console.log('[createShopInSupabase] Shop License document uploaded:', shopLicenseDocUrl);
      } else {
        console.warn('[createShopInSupabase] Shop License upload failed:', result.error);
      }
    }
    
    // Upload Aadhaar document if present and is local URI
    if (aadhaarDocUrl && !aadhaarDocUrl.startsWith('https://')) {
      console.log('[createShopInSupabase] Uploading Aadhaar document...');
      const result = await uploadDocument(aadhaarDocUrl, shopId, 'aadhaar');
      if (result.success && result.url) {
        aadhaarDocUrl = result.url;
        console.log('[createShopInSupabase] Aadhaar document uploaded:', aadhaarDocUrl);
      } else {
        console.warn('[createShopInSupabase] Aadhaar upload failed:', result.error);
      }
    }
    
    console.log('[createShopInSupabase] Document upload complete!');

    // Prepare shop data for Supabase - ALL vendor registration data is saved to shops table
    // This ensures customer app can read complete shop data directly from shops table
    const shopData: any = {
      // Shop ID (required - shops table uses text PRIMARY KEY)
      id: shopId,
      // Step 1: Basic Details
      owner_name: registrationData.ownerName,
      name: registrationData.storeName,
      shop_plot: registrationData.shopPlot || null,
      floor: registrationData.floor || null,
      building: registrationData.building || null,
      pincode: registrationData.pincode || '',
      // CRITICAL: latitude and longitude are REQUIRED (NOT NULL in shops table)
      latitude: shopLatitude,
      longitude: shopLongitude,
      area: registrationData.area || null,
      city: registrationData.city || null,
      // CRITICAL: address is REQUIRED (NOT NULL in shops table)
      address: fullAddress, // Full address string (includes all components)
      store_photos: storePhotoUrls, // Uploaded Supabase Storage URLs
      shop_type: registrationData.shopType || null,
      image_url: imageUrl, // First uploaded photo or default
      
      // Step 2: Contact Details
      email: registrationData.email,
      mobile_number: registrationData.mobileNumber,
      whatsapp_number: registrationData.whatsappNumber || registrationData.mobileNumber,
      contact_phone: registrationData.mobileNumber, // For backward compatibility
      
      // Step 3: Working Days & Timings
      working_days: registrationData.workingDays || [],
      same_time: registrationData.sameTime ?? true,
      common_open_time: registrationData.commonOpenTime || null,
      common_close_time: registrationData.commonCloseTime || null,
      day_times: registrationData.dayTimes ? Object.keys(registrationData.dayTimes).reduce((acc, day) => {
        const times = registrationData.dayTimes![day] as any;
        const openTime = typeof times.open === 'string' 
          ? times.open 
          : (times.open instanceof Date 
              ? times.open.toTimeString().slice(0, 5) 
              : String(times.open || '09:00'));
        const closeTime = typeof times.close === 'string' 
          ? times.close 
          : (times.close instanceof Date 
              ? times.close.toTimeString().slice(0, 5) 
              : String(times.close || '18:00'));
        acc[day] = {
          open_time: openTime,
          close_time: closeTime,
        };
        return acc;
      }, {} as Record<string, { open_time: string; close_time: string }>) : null,
      
      // Step 4: Documents (all document image URLs - uploaded to Supabase Storage)
      pan_document: panDocUrl,
      gst_document: gstDocUrl,
      fssai_document: fssaiDocUrl,
      shop_license_document: shopLicenseDocUrl,
      aadhaar_document: aadhaarDocUrl,
      
      // Step 5: Bank Details
      ifsc_code: registrationData.bankDetails?.ifsc || null,
      account_number: registrationData.bankDetails?.accountNumber || null,
      account_holder_name: registrationData.bankDetails?.accountHolderName || null,
      bank_name: registrationData.bankDetails?.bankName || null,
      bank_branch: registrationData.bankDetails?.bankBranch || null,
      account_type: registrationData.bankDetails?.accountType || null,
      
      // Step 6: Contract & Signature
      contract_accepted: registrationData.contractAccepted || false,
      profit_share: registrationData.profitShare || 20,
      signature: registrationData.signature || null,
      
      // User Account Link (references auth.users)
      user_id: userId,
      
      // Status
      is_active: true, // Shop is active but may need approval to appear
      is_verified: false, // Will be verified by admin
      is_approved: false, // Will be approved by admin (only approved shops appear in customer app)
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // ============================================================
    // IMPORTANT: ALL vendor registration data is saved to shops table
    // ============================================================
    // This ensures that:
    // 1. Customer app can read complete shop data directly from shops table
    // 2. No need to join with vendors table in customer app queries
    // 3. All vendor registration fields are available in shops table
    // 4. Shops table is the single source of truth for customer app display
    // ============================================================

    console.log('[createShopInSupabase] Shop data prepared:', {
      id: shopId,
      owner_name: shopData.owner_name,
      name: shopData.name,
      email: shopData.email,
      mobile_number: shopData.mobile_number,
      user_id: shopData.user_id,
      is_active: shopData.is_active,
      is_verified: shopData.is_verified,
      is_approved: shopData.is_approved,
      has_all_fields: !!(
        shopData.owner_name &&
        shopData.name &&
        shopData.email &&
        shopData.mobile_number
      ),
    });

    // Insert shop into Supabase
    console.log('[createShopInSupabase] Inserting shop with ID:', shopId);
    console.log('[createShopInSupabase] Shop data keys:', Object.keys(shopData));
    
    const { data, error } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single();

    if (error) {
      console.error('[createShopInSupabase] Error creating shop:', error);
      console.error('[createShopInSupabase] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return {
        success: false,
        error: error.message || 'Failed to create shop in Supabase',
      };
    }

    if (!data) {
      console.error('[createShopInSupabase] Shop insert succeeded but no data returned');
      return {
        success: false,
        error: 'Shop created but no data returned from database',
      };
    }

    console.log('[createShopInSupabase] ✅ Shop created successfully:', {
      id: data.id,
      name: data.name,
      email: data.email,
      is_active: data.is_active,
      vendor_id: data.vendor_id,
      address: data.address,
      shop_type: data.shop_type,
    });
    
    // Verify shop will appear in customer app
    if (data.is_active === true) {
      console.log('[createShopInSupabase] ✅ Shop is ACTIVE - will appear in customer app');
    } else {
      console.warn('[createShopInSupabase] ⚠️ Shop is INACTIVE - will NOT appear in customer app');
    }

    return {
      success: true,
      data: data as Shop,
    };
  } catch (error: any) {
    console.error('[createShopInSupabase] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shop',
    };
  }
};

/**
 * Create vendor user account in Supabase Auth
 */
export const createVendorAccount = async (
  email: string,
  password: string,
  phone: string,
  ownerName: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    console.log('[createVendorAccount] Creating vendor account...');
    
    // Validate and sanitize email
    const sanitizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      };
    }
    
    // Validate and format phone number for Supabase
    // Remove all non-digit characters first
    let sanitizedPhone = phone.replace(/[^\d]/g, '');
    
    // If phone starts with country code (like 91 for India), keep it
    // Otherwise, ensure it's at least 10 digits
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      return {
        success: false,
        error: 'Please enter a valid phone number (at least 10 digits)',
      };
    }
    
    // Format phone number with + prefix if it doesn't have one and has country code
    // Supabase expects phone in E.164 format (e.g., +919876543210)
    if (sanitizedPhone.length >= 10 && !sanitizedPhone.startsWith('+')) {
      // If it's an Indian number (starts with 91 or 10 digits), add +91
      if (sanitizedPhone.startsWith('91') && sanitizedPhone.length === 12) {
        sanitizedPhone = '+' + sanitizedPhone;
      } else if (sanitizedPhone.length === 10) {
        // Assume Indian number, add +91
        sanitizedPhone = '+91' + sanitizedPhone;
      } else {
        // For other formats, just add +
        sanitizedPhone = '+' + sanitizedPhone;
      }
    }
    
    console.log('[createVendorAccount] Sanitized data:', {
      email: sanitizedEmail,
      phone: sanitizedPhone,
      ownerName: ownerName.trim(),
    });
    
    // Create user in Supabase Auth
    // Try with email and phone first
    let signUpData: any = {
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          name: ownerName.trim(),
          role: 'vendor',
        },
        // Disable email confirmation requirement for vendors (if configured)
        emailRedirectTo: undefined,
      },
    };
    
    // Add phone only if it's valid and formatted correctly
    if (sanitizedPhone && sanitizedPhone.length >= 10) {
      signUpData.phone = sanitizedPhone;
    }
    
    const { data: authData, error: authError } = await supabase.auth.signUp(signUpData);

    if (authError) {
      console.error('[createVendorAccount] Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        email: sanitizedEmail,
        fullError: JSON.stringify(authError),
      });
      
      // Provide user-friendly error messages
      let errorMessage = authError.message || 'Failed to create vendor account';
      
      // Handle specific Supabase Auth errors
      // Note: Supabase sometimes returns "invalid email" when email already exists
      const errorMsgLower = authError.message?.toLowerCase() || '';
      
      if (errorMsgLower.includes('already registered') || 
          errorMsgLower.includes('already exists') ||
          errorMsgLower.includes('user already registered') ||
          errorMsgLower.includes('email address is already registered') ||
          errorMsgLower.includes('email already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
      } else if (errorMsgLower.includes('invalid') && errorMsgLower.includes('email')) {
        // Supabase sometimes returns "invalid email" when email already exists
        // Check if email format is actually valid
        if (emailRegex.test(sanitizedEmail)) {
          // Email format is valid, so it's likely already registered
          // This is a common Supabase behavior - "invalid" often means "already exists"
          errorMessage = 'This email address is already registered. Please sign in if you have an account, or use a different email address.';
        } else {
          errorMessage = 'Please enter a valid email address (e.g., name@example.com).';
        }
      } else if (errorMsgLower.includes('password')) {
        if (errorMsgLower.includes('weak') || errorMsgLower.includes('short')) {
          errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
        } else {
          errorMessage = 'Password does not meet requirements. Please use a stronger password.';
        }
      } else if (authError.status === 400) {
        // Status 400 with "invalid email" usually means email already exists
        if (errorMsgLower.includes('email') && emailRegex.test(sanitizedEmail)) {
          errorMessage = 'This email address is already registered. Please sign in or use a different email address.';
        } else if (errorMsgLower.includes('phone')) {
          errorMessage = 'Invalid phone number format. Please enter a valid phone number.';
        } else {
          errorMessage = 'Invalid registration data. Please check your email and phone number format.';
        }
      } else if (authError.status === 422) {
        errorMessage = 'Email address format is invalid. Please enter a valid email (e.g., name@example.com).';
      } else if (authError.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
      } else if (authError.status === 500 || authError.status === 503) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'User account creation failed. Please try again.',
      };
    }

    console.log('[createVendorAccount] ✅ Vendor account created successfully:', {
      userId: authData.user.id,
      email: authData.user.email,
      phone: authData.user.phone,
    });

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error: any) {
    console.error('[createVendorAccount] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create vendor account. Please try again.',
    };
  }
};

/**
 * Link shop to vendor user
 */
export const linkShopToVendor = async (
  shopId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[linkShopToVendor] Linking shop to vendor:', { shopId, userId });
    
    // Update shop with vendor user ID
    const { error } = await supabase
      .from('shops')
      .update({
        vendor_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      console.error('[linkShopToVendor] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to link shop to vendor',
      };
    }

    console.log('[linkShopToVendor] Shop linked successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[linkShopToVendor] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to link shop to vendor',
    };
  }
};

/**
 * Sign in vendor using Supabase Auth
 * This authenticates the vendor and fetches their shop details from the shops table
 */
export const signInVendor = async (
  email: string,
  password: string
): Promise<{ 
  success: boolean; 
  user?: any; 
  shop?: Shop; 
  error?: string 
}> => {
  try {
    console.log('[signInVendor] Signing in vendor with:', email);
    
    // Step 1: Sign in with Supabase Auth
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (authError) {
      console.error('[signInVendor] Auth error:', authError);
      console.error('[signInVendor] Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      });
      
      // Handle "Email not confirmed" error by auto-confirming via backend
      // Check multiple possible error formats from Supabase
      const errorMessageLower = authError.message?.toLowerCase() || '';
      const isEmailNotConfirmed = 
        errorMessageLower.includes('email not confirmed') || 
        errorMessageLower.includes('email_not_confirmed') ||
        errorMessageLower.includes('not confirmed') ||
        errorMessageLower.includes('email needs to be confirmed') ||
        (authError.status === 400 && errorMessageLower.includes('email'));
      
      if (isEmailNotConfirmed) {
        console.log('[signInVendor] Email not confirmed detected, attempting auto-confirmation...');
        
        try {
          // Import API_CONFIG dynamically to avoid circular dependencies
          const { API_CONFIG } = await import('../config/api');
          
          // API_CONFIG.BASE_URL already includes /api, so use /auth/confirm-vendor-email
          const confirmEndpoint = `${API_CONFIG.BASE_URL}/auth/confirm-vendor-email`;
          console.log('[signInVendor] Calling confirmation endpoint:', confirmEndpoint);
          
          // Call backend endpoint to auto-confirm email
          const confirmResponse = await fetch(confirmEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email.trim() }),
          });

          console.log('[signInVendor] Confirmation response status:', confirmResponse.status);

          // Read response body only once
          const responseText = await confirmResponse.text();
          let confirmResult;
          
          try {
            confirmResult = JSON.parse(responseText);
          } catch (e) {
            // If not JSON, create error object
            confirmResult = {
              success: false,
              error: { message: responseText || 'Failed to confirm email' }
            };
          }

          if (!confirmResponse.ok) {
            console.error('[signInVendor] Confirmation endpoint error:', confirmResult);
            // If endpoint doesn't exist (404) or fails, try to confirm email directly using Supabase
            if (confirmResponse.status === 404) {
              console.log('[signInVendor] Confirmation endpoint not found (404) - attempting direct email confirmation...');
              
              // Try to confirm email directly using Supabase Admin (if available)
              // For now, just try signing in - email might already be confirmed
              // Or we can manually confirm in Supabase dashboard
            } else {
              console.log('[signInVendor] Confirmation failed - trying sign-in anyway...');
            }
            
            // Try signing in anyway - email might already be confirmed
            // If still fails, user needs to confirm email manually
            const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
              email: emailToUse,
              password: password,
            });

            if (!retryAuthError && retryAuthData?.user) {
              // Sign-in succeeded - email was already confirmed
              console.log('[signInVendor] ✅ Vendor authenticated (email was already confirmed)');
              authData = retryAuthData;
            } else {
              // Still failed - email is not confirmed
              const retryErrorMsg = retryAuthError?.message?.toLowerCase() || '';
              if (retryErrorMsg.includes('email not confirmed') || retryErrorMsg.includes('not confirmed')) {
                return {
                  success: false,
                  error: 'Your email is not confirmed.\n\nTo fix this:\n1. Go to Supabase Dashboard → Authentication → Users\n2. Find your email and click "Confirm Email"\n\nOR\n\nDisable email confirmation:\n1. Supabase Dashboard → Authentication → Settings → Email Auth\n2. Turn OFF "Enable email confirmations"',
                };
              } else {
                return {
                  success: false,
                  error: retryAuthError?.message || authError.message || 'Sign in failed. Please check your credentials.',
                };
              }
            }
          } else if (confirmResult.success) {
            console.log('[signInVendor] Email confirmed successfully, retrying sign-in...');
            
            // Wait a moment for Supabase to process the confirmation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Retry sign-in after confirmation
            const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
              email: emailToUse,
              password: password,
            });

            if (retryAuthError) {
              console.error('[signInVendor] Retry sign-in error:', retryAuthError);
              return {
                success: false,
                error: retryAuthError.message || 'Sign in failed after email confirmation. Please try again.',
              };
            }

            // Continue with successful authentication
            const userId = retryAuthData.user.id;
            console.log('[signInVendor] Vendor authenticated after email confirmation, userId:', userId);
            
            // Set authData for code below to continue with normal flow
            authData = retryAuthData;
          } else {
            // Confirmation endpoint returned success: false
            console.warn('[signInVendor] Email confirmation returned success: false, trying sign-in anyway...');
            
            // Try signing in anyway - email might already be confirmed
            const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });

            if (!retryAuthError && retryAuthData?.user) {
              // Sign-in succeeded
              authData = retryAuthData;
            } else {
              // Still failed - email is not confirmed
              const retryErrorMsg = retryAuthError?.message?.toLowerCase() || '';
              if (retryErrorMsg.includes('email not confirmed') || retryErrorMsg.includes('not confirmed')) {
                return {
                  success: false,
                  error: 'Your email is not confirmed.\n\nTo fix this:\n1. Go to Supabase Dashboard → Authentication → Users\n2. Find your email and click "Confirm Email"\n\nOR\n\nDisable email confirmation:\n1. Supabase Dashboard → Authentication → Settings → Email Auth\n2. Turn OFF "Enable email confirmations"',
                };
              } else {
                return {
                  success: false,
                  error: retryAuthError?.message || authError.message || 'Sign in failed. Please check your credentials.',
                };
              }
            }
          }
        } catch (confirmError: any) {
          console.error('[signInVendor] Error during auto-confirmation:', confirmError);
          console.error('[signInVendor] Error stack:', confirmError.stack);
          
          // If it's a network error, provide a helpful message
          if (confirmError.message?.includes('fetch') || confirmError.message?.includes('network')) {
            return {
              success: false,
              error: 'Unable to connect to server. Please check your internet connection and try again.',
            };
          }
          
          return {
            success: false,
            error: 'Your email is not confirmed. Please check your inbox for the confirmation email or contact support.',
          };
        }
      }
      
      // Handle other authentication errors with better messages
      let errorMessage = authError.message || 'Invalid email or password';
      
      if (authError.message?.includes('Invalid login credentials') || 
          authError.message?.includes('invalid_credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (authError.message?.includes('User not found')) {
        errorMessage = 'No account found with this email. Please sign up first.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    const userId = authData.user.id;
    console.log('[signInVendor] Vendor authenticated, userId:', userId);

    // Step 2: Fetch shop details from shops table using user_id or email
    // All vendor data is now in shops table (no vendors table)
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .or(`user_id.eq.${userId},email.eq.${emailToUse}`)
      .limit(1)
      .single();

    if (shopError) {
      console.error('[signInVendor] Error fetching shop:', shopError);
      // If shop not found, still allow sign-in but without shop data
      console.warn('[signInVendor] Shop not found for vendor, continuing without shop data');
      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          phone: authData.user.phone,
          name: authData.user.user_metadata?.name || authData.user.email,
        },
        shop: undefined,
      };
    }

    console.log('[signInVendor] Shop found:', {
      shopId: shops.id,
      shopName: shops.name,
      email: shops.email,
    });

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.phone,
        name: shops.owner_name || authData.user.user_metadata?.name || authData.user.email,
      },
      shop: shops as Shop,
    };
  } catch (error: any) {
    console.error('[signInVendor] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in',
    };
  }
};

/**
 * Get shop by vendor email
 */
export const getShopByEmail = async (email: string): Promise<Shop | null> => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('[getShopByEmail] Error:', error);
      return null;
    }

    return data as Shop;
  } catch (error) {
    console.error('[getShopByEmail] Exception:', error);
    return null;
  }
};

/**
 * Get shop by vendor ID
 */
export const getShopByVendorId = async (vendorId: string): Promise<Shop | null> => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();

    if (error) {
      console.error('[getShopByVendorId] Error:', error);
      return null;
    }

    return data as Shop;
  } catch (error) {
    console.error('[getShopByVendorId] Exception:', error);
    return null;
  }
};

/**
 * Complete vendor registration - creates account and saves directly to shops table
 * All vendor registration data is saved directly to shops table (no vendors table)
 */
export const completeVendorRegistration = async (
  registrationData: ShopRegistrationData
): Promise<{ 
  success: boolean; 
  shop?: Shop; 
  userId?: string;
  error?: string 
}> => {
  try {
    console.log('[completeVendorRegistration] Starting registration process...');
    
    // Step 1: Create vendor account in Supabase Auth
    const accountResult = await createVendorAccount(
      registrationData.email,
      registrationData.password,
      registrationData.mobileNumber,
      registrationData.ownerName
    );

    if (!accountResult.success) {
      return {
        success: false,
        error: accountResult.error || 'Failed to create vendor account',
      };
    }

    const userId = accountResult.userId!;
    console.log('[completeVendorRegistration] Vendor account created, userId:', userId);

    // Step 2: Create shop directly in shops table with ALL registration details
    // All vendor registration data is saved to shops table (no vendors table)
    const shopResult = await createShopInSupabase(registrationData, userId);

    if (!shopResult.success) {
      console.error('[completeVendorRegistration] Failed to create shop:', shopResult.error);
      return {
        success: false,
        error: shopResult.error || 'Failed to create shop',
      };
    }

    const shop = shopResult.data!;
    console.log('[completeVendorRegistration] Shop created with all registration data, shopId:', shop.id);
    console.log('[completeVendorRegistration] Shop status: is_verified=', shop.is_verified, ', is_approved=', shop.is_approved);
    console.log('[completeVendorRegistration] Shop is_active:', shop.is_active, '- Will be visible in customer app if approved');

    console.log('[completeVendorRegistration] Registration completed successfully');
    
    return {
      success: true,
      shop,
      userId,
    };
  } catch (error: any) {
    console.error('[completeVendorRegistration] Exception:', error);
    return {
      success: false,
      error: error.message || 'Registration failed',
    };
  }
};

