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
  
  // Step 4: Documents
  documents?: {
    pan?: string;
    gst?: string;
    fssai?: string;
    shopLicense?: string;
    aadhaar?: string;
  };
  
  // Step 5: Bank Details
  bankDetails?: {
    ifsc?: string;
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  
  // Step 6: Contract
  contractAccepted?: boolean;
  profitShare?: number;
  signature?: string;
  
  // User account
  password: string;
}

export interface Shop {
  id: string;
  owner_name: string;
  name: string;
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
  contract_accepted?: boolean;
  profit_share?: number;
  signature?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create shop in Supabase with all registration details
 */
export const createShopInSupabase = async (
  registrationData: ShopRegistrationData
): Promise<{ success: boolean; data?: Shop; error?: string }> => {
  try {
    console.log('[createShopInSupabase] Creating shop with registration data...');
    
    // Prepare shop data for Supabase
    const shopData: any = {
      // Basic Details
      owner_name: registrationData.ownerName,
      name: registrationData.storeName,
      shop_plot: registrationData.shopPlot || null,
      floor: registrationData.floor || null,
      building: registrationData.building || null,
      pincode: registrationData.pincode || null,
      latitude: registrationData.latitude || null,
      longitude: registrationData.longitude || null,
      area: registrationData.area || null,
      city: registrationData.city || null,
      store_photos: registrationData.storePhotos || [],
      shop_type: registrationData.shopType || null,
      
      // Contact Details
      email: registrationData.email,
      mobile_number: registrationData.mobileNumber,
      whatsapp_number: registrationData.whatsappNumber || registrationData.mobileNumber,
      
      // Working Days
      working_days: registrationData.workingDays || [],
      same_time: registrationData.sameTime ?? true,
      common_open_time: registrationData.commonOpenTime || null,
      common_close_time: registrationData.commonCloseTime || null,
      day_times: registrationData.dayTimes ? Object.keys(registrationData.dayTimes).reduce((acc, day) => {
        const times = registrationData.dayTimes![day];
        acc[day] = {
          open_time: times.open || '09:00',
          close_time: times.close || '18:00',
        };
        return acc;
      }, {} as Record<string, { open_time: string; close_time: string }>) : null,
      
      // Documents
      pan_document: registrationData.documents?.pan || null,
      gst_document: registrationData.documents?.gst || null,
      fssai_document: registrationData.documents?.fssai || null,
      shop_license_document: registrationData.documents?.shopLicense || null,
      // Note: aadhaar_document column doesn't exist in the shops table, so it's excluded
      
      // Bank Details - Note: Bank-related columns (ifsc_code, account_number, bank_name) don't exist in the shops table
      // These fields are collected but not stored in the shops table
      
      // Contract
      contract_accepted: registrationData.contractAccepted || false,
      profit_share: registrationData.profitShare || 20,
      signature: registrationData.signature || null,
      
      // Status
      is_active: false, // New shops are inactive until approved
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[createShopInSupabase] Shop data prepared:', {
      owner_name: shopData.owner_name,
      name: shopData.name,
      email: shopData.email,
      mobile_number: shopData.mobile_number,
    });

    // Insert shop into Supabase
    const { data, error } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single();

    if (error) {
      console.error('[createShopInSupabase] Error creating shop:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shop in Supabase',
      };
    }

    console.log('[createShopInSupabase] Shop created successfully:', {
      id: data.id,
      name: data.name,
      email: data.email,
    });

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
    
    // Validate phone number (remove any non-digit characters except +)
    const sanitizedPhone = phone.replace(/[^\d+]/g, '');
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      return {
        success: false,
        error: 'Please enter a valid phone number',
      };
    }
    
    console.log('[createVendorAccount] Sanitized data:', {
      email: sanitizedEmail,
      phone: sanitizedPhone,
      ownerName: ownerName.trim(),
    });
    
    // Create user in Supabase Auth
    // Try with email first, if that fails due to email issues, we can try phone-only
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      phone: sanitizedPhone,
      options: {
        data: {
          name: ownerName.trim(),
          role: 'vendor',
        },
        // Disable email confirmation requirement for vendors
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      console.error('[createVendorAccount] Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        email: sanitizedEmail,
      });
      
      // Provide user-friendly error messages
      let errorMessage = authError.message || 'Failed to create vendor account';
      
      // Handle specific Supabase Auth errors
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already exists') ||
          authError.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
      } else if (authError.message?.includes('invalid') && authError.message?.includes('email')) {
        // Check if email format is actually valid
        if (emailRegex.test(sanitizedEmail)) {
          // Email format is valid, so it's likely already registered
          errorMessage = 'This email address is already registered. Please sign in instead or use a different email.';
        } else {
          errorMessage = 'Please enter a valid email address (e.g., name@example.com).';
        }
      } else if (authError.message?.includes('Password')) {
        errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
      } else if (authError.status === 400) {
        errorMessage = 'Invalid registration data. Please check your email and phone number format.';
      } else if (authError.status === 422) {
        errorMessage = 'Email address format is invalid. Please enter a valid email (e.g., name@example.com).';
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
    console.log('[signInVendor] Signing in vendor with email:', email);
    
    // Step 1: Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('[signInVendor] Auth error:', authError);
      return {
        success: false,
        error: authError.message || 'Invalid email or password',
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

    // Step 2: Fetch shop details from shops table using vendor_id or email
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .or(`vendor_id.eq.${userId},email.eq.${email}`)
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
 * Complete vendor registration - creates account and shop
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

    // Step 2: Create shop in Supabase
    const shopResult = await createShopInSupabase(registrationData);

    if (!shopResult.success) {
      // If shop creation fails, we should ideally rollback the user account
      // For now, we'll just return the error
      return {
        success: false,
        error: shopResult.error || 'Failed to create shop',
      };
    }

    const shop = shopResult.data!;
    console.log('[completeVendorRegistration] Shop created, shopId:', shop.id);

    // Step 3: Link shop to vendor
    const linkResult = await linkShopToVendor(shop.id, userId);

    if (!linkResult.success) {
      console.warn('[completeVendorRegistration] Failed to link shop to vendor, but shop was created');
      // Shop is created but not linked - this can be fixed later
    }

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

