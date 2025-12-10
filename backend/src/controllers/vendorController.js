/**
 * Vendor Registration Controller
 * Handles vendor/shop registration
 */

import { supabase, supabaseAdmin } from '../config/database.js';
import crypto from 'crypto';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Hash password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a simple token (for development)
 */
function generateToken(userId) {
  const payload = {
    userId,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Generate unique shop ID
 */
function generateShopId() {
  return `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Vendor Registration
 * POST /api/vendor/register
 */
export const registerVendor = async (req, res, next) => {
  try {
    const {
      // Step 1: Basic Details
      ownerName,
      storeName,
      address,
      shopPlot,
      floor,
      building,
      pincode,
      latitude,
      longitude,
      area,
      city,
      storePhotos,
      
      // Step 2: Contact Details
      email,
      mobileNumber,
      whatsappNumber,
      isWhatsAppSame,
      
      // Step 3: Working Days
      workingDays,
      sameTime,
      commonOpenTime,
      commonCloseTime,
      dayTimes,
      
      // Step 4: Documents (URLs or file paths)
      panDocument,
      gstDocument,
      fssaiDocument,
      shopLicenseDocument,
      aadhaarDocument,
      
      // Step 5: Banking
      ifscCode,
      accountNumber,
      accountHolderName,
      bankName,
      bankBranch,
      accountType,
      
      // Step 6: Contract
      termsAccepted,
      signature,
      profitShare,
      
      // Password for account creation
      password,
    } = req.body;

    console.log('========================================');
    console.log('🏪 VENDOR REGISTRATION REQUEST');
    console.log('========================================');
    console.log('Owner Name:', ownerName);
    console.log('Store Name:', storeName);
    console.log('Email:', email);
    console.log('Mobile:', mobileNumber);
    console.log('========================================');

    // Validate required fields
    if (!ownerName || !storeName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Owner name, store name, email, mobile number, and password are required' },
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        error: { message: 'You must accept the terms and conditions' },
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${mobileNumber},email.eq.${email}`)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email or phone number already exists. Please sign in instead.' },
      });
    }

    // Generate user ID and shop ID
    const userId = crypto.randomUUID();
    const shopId = generateShopId();

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user account
    const userData = {
      id: userId,
      name: ownerName,
      email: email,
      phone: mobileNumber,
      password: hashedPassword,
      is_active: true,
      is_verified: false, // Will be verified after admin approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.error('❌ ERROR CREATING USER:', userError);
      if (userError.code === '23505') {
        return res.status(409).json({
          success: false,
          error: { message: 'An account with this email or phone number already exists.' },
        });
      }
      throw userError;
    }

    console.log('✅ User created:', userId);

    // Create user profile
    const profileData = {
      id: userId,
      name: ownerName,
      email: email,
      phone: mobileNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData);

    if (profileError) {
      console.error('⚠️  Error creating profile:', profileError);
      // Don't fail registration if profile creation fails
    }

    // Build shop address
    const shopAddressParts = [];
    if (shopPlot) shopAddressParts.push(`Shop/Plot: ${shopPlot}`);
    if (floor) shopAddressParts.push(`Floor: ${floor}`);
    if (building) shopAddressParts.push(building);
    if (address) shopAddressParts.push(address);
    if (area) shopAddressParts.push(area);
    if (city) shopAddressParts.push(city);
    if (pincode) shopAddressParts.push(`Pincode: ${pincode}`);
    const fullAddress = shopAddressParts.join(', ');

    // Determine opening/closing times
    let openingTime = '09:00:00';
    let closingTime = '21:00:00';
    
    if (sameTime && commonOpenTime && commonCloseTime) {
      openingTime = commonOpenTime;
      closingTime = commonCloseTime;
    } else if (dayTimes && Object.keys(dayTimes).length > 0) {
      // Use first day's time as default
      const firstDay = Object.keys(dayTimes)[0];
      openingTime = dayTimes[firstDay].open_time || '09:00:00';
      closingTime = dayTimes[firstDay].close_time || '21:00:00';
    }

    // Create shop
    const shopData = {
      id: shopId,
      name: storeName,
      address: fullAddress || address || 'Address not provided',
      contact_phone: mobileNumber,
      contact_email: email,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      image_url: storePhotos && storePhotos.length > 0 ? storePhotos[0] : null,
      is_active: false, // Inactive until admin approval
      opening_time: openingTime,
      closing_time: closingTime,
      owner_name: ownerName,
      owner_phone: mobileNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .insert(shopData)
      .select()
      .single();

    if (shopError) {
      console.error('❌ ERROR CREATING SHOP:', shopError);
      // Rollback: delete user if shop creation fails
      await supabaseAdmin.from('users').delete().eq('id', userId);
      throw shopError;
    }

    console.log('✅ Shop created:', shopId);

    // Store vendor-specific data in a JSONB column or separate table
    // For now, we'll store additional info in a vendor_details table if it exists
    // Or we can extend the shops table with additional columns

    // Generate token
    const token = generateToken(userId);

    // Create login session
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from('login_sessions').insert({
      id: sessionId,
      user_id: userId,
      token,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      login_at: now,
      last_activity_at: now,
      expires_at: expiresAt,
      is_active: 1,
    });

    // Log activity
    await logActivity({
      userId,
      activityType: 'vendor_registration',
      description: `Vendor registered: ${storeName}`,
      metadata: {
        shopId,
        storeName,
        email,
      },
    });

    console.log('========================================');
    console.log('✅ VENDOR REGISTRATION COMPLETE');
    console.log('========================================');
    console.log(`User ID: ${userId}`);
    console.log(`Shop ID: ${shopId}`);
    console.log(`Store Name: ${storeName}`);
    console.log('========================================');

    res.json({
      success: true,
      message: 'Vendor registration successful! Your account is pending admin approval.',
      data: {
        user: {
          id: userId,
          name: ownerName,
          email: email,
          phone: mobileNumber,
        },
        shop: {
          id: shopId,
          name: storeName,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    next(error);
  }
};

/**
 * Get vendor profile (shop + user info)
 * GET /api/vendor/profile
 */
export const getVendorProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Get shop info (find shop by owner phone or email)
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .or(`owner_phone.eq.${user.phone},contact_email.eq.${user.email}`)
      .limit(1);

    const shop = shops && shops.length > 0 ? shops[0] : null;

    res.json({
      success: true,
      data: {
        user,
        shop,
      },
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    next(error);
  }
};

