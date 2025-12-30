/**
 * Users Controller
 */

import { supabase, supabaseAdmin } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

/**
 * Format address for response
 */
function formatAddress(dbAddress) {
  return {
    id: dbAddress.id,
    contactName: dbAddress.contact_name,
    phone: dbAddress.phone,
    street: dbAddress.street,
    city: dbAddress.city,
    state: dbAddress.state,
    postalCode: dbAddress.postal_code,
    landmark: dbAddress.landmark || undefined,
    label: dbAddress.label || 'Home',
    isDefault: dbAddress.is_default || false,
  };
}

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    console.log('📋 Fetching profile for user:', userId);

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching profile:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Profile not found' },
        });
      }
      throw error;
    }

    console.log('✅ Profile found:', profile.name);

    // Get addresses
    console.log('📍 Fetching addresses for user:', userId);
    const { data: addresses, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (addressError) {
      console.error('⚠️  Error fetching addresses:', addressError);
    } else {
      console.log(`✅ Found ${addresses?.length || 0} addresses`);
      if (addresses && addresses.length > 0) {
        console.log('   First address:', JSON.stringify(addresses[0], null, 2));
      }
    }

    const addressList = (addresses || []).map(formatAddress);
    const defaultAddress = addressList.find(addr => addr.isDefault) || addressList[0] || null;

    console.log('📤 Returning profile with address:', defaultAddress ? 'Yes' : 'No');

    res.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone,
        profilePicture: profile.profile_picture || undefined,
        address: defaultAddress,
        addresses: addressList.length > 0 ? addressList : undefined,
      },
    });
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error);
    next(error);
  }
};

/**
 * Update user profile
 * PATCH /api/users/profile
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email, phone, profilePicture } = req.body;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log profile update activity
    await logActivity(req, 'PROFILE_UPDATED', 'User profile updated', 'user', userId, {
      updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at'),
    });

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        profilePicture: data.profile_picture || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user addresses
 * GET /api/users/addresses
 */
export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.userId;

    console.log('📍 Fetching all addresses for user:', userId);

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('❌ Error fetching addresses:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} addresses for user ${userId}`);

    res.json({
      success: true,
      data: (data || []).map(formatAddress),
    });
  } catch (error) {
    console.error('❌ Error in getUserAddresses:', error);
    next(error);
  }
};

/**
 * Add address
 * POST /api/users/addresses
 */
export const addAddress = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { contactName, phone, street, city, state, postalCode, landmark, label, isDefault } = req.body;

    console.log('========================================');
    console.log('📍 ADD ADDRESS REQUEST');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    if (!contactName || !phone || !street || !city || !state || !postalCode) {
      console.log('❌ Missing required fields');
      console.log('   contactName:', contactName ? 'Yes' : 'MISSING');
      console.log('   phone:', phone ? 'Yes' : 'MISSING');
      console.log('   street:', street ? 'Yes' : 'MISSING');
      console.log('   city:', city ? 'Yes' : 'MISSING');
      console.log('   state:', state ? 'Yes' : 'MISSING');
      console.log('   postalCode:', postalCode ? 'Yes' : 'MISSING');
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    console.log('✅ All required fields present');

    // Check if customers table exists (new consolidated structure)
    // Wrap in try-catch to handle Supabase configuration errors gracefully
    let customersTable = null;
    let tableCheckError = null;
    let useCustomersTable = false;

    try {
      const result = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('auth_user_id', userId)
        .limit(1)
        .single();

      customersTable = result.data;
      tableCheckError = result.error;

      // Check if it's a configuration error
      if (tableCheckError && (
        tableCheckError.message?.includes('Invalid API key') ||
        tableCheckError.message?.includes('JWT') ||
        tableCheckError.code === 'PGRST301' ||
        tableCheckError.message?.includes('Supabase not configured')
      )) {
        console.log('⚠️  Supabase configuration error detected - falling back to addresses table');
        console.log('   Error:', tableCheckError.message);
        // Don't use customers table, fall through to addresses table
        useCustomersTable = false;
      } else if (customersTable && !tableCheckError) {
        useCustomersTable = true;
      }
    } catch (error) {
      console.log('⚠️  Error checking customers table - falling back to addresses table');
      console.log('   Error:', error.message);
      // Fall through to addresses table
      useCustomersTable = false;
    }

    if (useCustomersTable && customersTable) {
      // Use customers table with helper function
      console.log('📝 Using customers table (consolidated structure)');
      
      const { data: functionResult, error: functionError } = await supabaseAdmin.rpc(
        'add_customer_address',
        {
          customer_uuid: customersTable.id,
          contact_name_val: contactName,
          phone_val: phone,
          street_val: street,
          city_val: city,
          state_val: state,
          postal_code_val: postalCode,
          landmark_val: landmark || '',
          label_val: label || 'Home',
          is_default_val: isDefault || false,
        }
      );

      if (functionError) {
        console.error('❌ ERROR calling add_customer_address function:', functionError);
        throw functionError;
      }

      // Fetch the updated customer to get the address
      const { data: customer, error: fetchError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', customersTable.id)
        .single();

      if (fetchError) {
        console.error('❌ ERROR fetching customer:', fetchError);
        throw fetchError;
      }

      // Format the address response
      const addressResponse = {
        id: functionResult || customer.id,
        contactName: customer.contact_name || contactName,
        phone: customer.phone || phone,
        street: customer.street || street,
        city: customer.city || city,
        state: customer.state || state,
        postalCode: customer.postal_code || postalCode,
        landmark: customer.landmark || landmark || undefined,
        label: customer.address_label || label || 'Home',
        isDefault: customer.is_default_address || isDefault || false,
      };

      console.log('✅ Address added to customers table successfully!');
      console.log('   Address:', `${addressResponse.street}, ${addressResponse.city}, ${addressResponse.state}`);

      res.status(201).json({
        success: true,
        data: addressResponse,
      });
      return;
    }

    // Fallback to old addresses table structure
    console.log('📝 Using addresses table (legacy structure)');

    const addressData = {
      user_id: userId,
      contact_name: contactName,
      phone,
      street,
      city,
      state,
      postal_code: postalCode,
      landmark: landmark || null,
      label: label || 'Home',
      is_default: isDefault || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 Inserting address:', JSON.stringify(addressData, null, 2));

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) {
      console.error('❌ ERROR INSERTING ADDRESS:', error);
      console.error('   Error Code:', error.code);
      console.error('   Error Message:', error.message);
      console.error('   Error Details:', JSON.stringify(error, null, 2));
      
      // Check if it's a Supabase configuration error
      if (error.message?.includes('Invalid API key') || 
          error.message?.includes('Supabase not configured') ||
          error.message?.includes('JWT') ||
          error.code === 'PGRST301') {
        const configError = new Error('Server configuration error. Supabase credentials are invalid or missing.');
        configError.statusCode = 500;
        throw configError;
      }
      
      // Check if it's a database constraint error
      if (error.code === '23505') { // Unique violation
        const constraintError = new Error('This address already exists.');
        constraintError.statusCode = 400;
        throw constraintError;
      }
      
      // Check if it's a foreign key error
      if (error.code === '23503') {
        // Try to fix by ensuring user exists in users table
        console.log('⚠️  Foreign key error - checking if user exists...');
        const { data: userCheck } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (!userCheck) {
          const fkError = new Error('User not found. Please sign in again.');
          fkError.statusCode = 400;
          throw fkError;
        }
        
        // User exists, might be a constraint issue - try without foreign key
        console.log('⚠️  User exists but FK constraint failed. Attempting insert without FK...');
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('addresses')
          .insert({
            ...addressData,
            user_id: userId, // Keep user_id but ignore FK constraint
          })
          .select()
          .single();
        
        if (retryError) {
          const dbError = new Error(retryError.message || 'Failed to save address to database.');
          dbError.statusCode = 500;
          throw dbError;
        }
        
        // Success on retry
        console.log('✅ Address created successfully (retry)!');
        console.log('   Address ID:', retryData.id);
        console.log('   Address:', `${retryData.street}, ${retryData.city}, ${retryData.state}`);
        
        await logActivity(req, 'ADDRESS_CREATED', 'New address added', 'address', retryData.id, {
          label: label || 'Home',
          city,
          state,
          isDefault: isDefault || false,
        });

        return res.status(201).json({
          success: true,
          data: formatAddress(retryData),
        });
      }
      
      // For other errors, include the actual error message
      const dbError = new Error(error.message || 'Failed to save address to database.');
      dbError.statusCode = 500;
      throw dbError;
    }

    console.log('✅ Address created successfully!');
    console.log('   Address ID:', data.id);
    console.log('   Address:', `${data.street}, ${data.city}, ${data.state}`);
    console.log('========================================');

    // Log address creation activity
    await logActivity(req, 'ADDRESS_CREATED', 'New address added', 'address', data.id, {
      label: label || 'Home',
      city,
      state,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    console.error('❌ ERROR in addAddress:', error);
    next(error);
  }
};

/**
 * Update address
 * PATCH /api/users/addresses/:id
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { contactName, phone, street, city, state, postalCode, landmark, label, isDefault } = req.body;

    console.log('========================================');
    console.log('✏️  UPDATE ADDRESS REQUEST');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Address ID:', id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (contactName !== undefined) updateData.contact_name = contactName;
    if (phone !== undefined) updateData.phone = phone;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postal_code = postalCode;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (label !== undefined) updateData.label = label;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    console.log('📝 Update Data:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ ERROR UPDATING ADDRESS:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Address not found' },
        });
      }
      throw error;
    }

    console.log('✅ Address updated successfully!');
    console.log('   Address ID:', data.id);
    console.log('========================================');

    res.json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    console.error('❌ ERROR in updateAddress:', error);
    next(error);
  }
};

/**
 * Delete address
 * DELETE /api/users/addresses/:id
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Log address deletion activity
    await logActivity(req, 'ADDRESS_DELETED', 'Address deleted', 'address', id);

    res.json({
      success: true,
      data: { message: 'Address deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set default address
 * PATCH /api/users/addresses/:id/default
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Unset all defaults
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Address not found' },
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: formatAddress(data),
    });
  } catch (error) {
    next(error);
  }
};

