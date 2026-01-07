import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://fcrhcwvpivkadkkbxcom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Complete signup: Create auth user + delivery agent profile
export const signupDeliveryAgent = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone_number,
      alternate_phone,
      vehicle_type,
      vehicle_number,
      vehicle_name,
      driving_license_url,
      aadhar_url,
      pan_url,
      selfie_url,
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      bank_account_holder_name,
      bank_branch_name,
    } = req.body;

    console.log('🚀 Starting delivery agent complete signup...');
    console.log('📧 Email:', email);
    console.log('👤 Full name:', full_name);
    console.log('📱 Phone:', phone_number);

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY not found in environment variables!');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing service role key',
      });
    }

    // Validation
    if (!email || !password || !full_name || !phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, full name, and phone number are required',
      });
    }

    // Step 1: Create auth user with auto-confirmation
    console.log('🔐 Creating auth user with admin API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        phone_number,
        role: 'delivery_agent',
      },
    });

    if (authError || !authData.user) {
      console.error('❌ Failed to create auth user:', {
        error: authError,
        message: authError?.message,
        status: authError?.status,
        code: authError?.code,
      });
      return res.status(500).json({
        success: false,
        error: `Failed to create user account: ${authError?.message || 'Unknown error'}`,
        details: authError,
      });
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // Step 2: Create delivery agent profile
    const { data: agentData, error: agentError } = await supabase
      .from('delivery_agents')
      .insert({
        user_id: userId,
        full_name,
        email,
        phone_number,
        alternate_phone,
        vehicle_type,
        vehicle_number,
        vehicle_name,
        driving_license_url,
        aadhar_url,
        pan_url,
        selfie_url,
        bank_account_number,
        bank_ifsc_code,
        bank_name,
        bank_account_holder_name,
        bank_branch_name,
        verification_status: 'pending',
        is_active: false,
      })
      .select()
      .single();

    if (agentError) {
      console.error('❌ Failed to create delivery agent profile:', agentError);
      // Cleanup: delete the auth user since profile creation failed
      await supabase.auth.admin.deleteUser(userId);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create delivery agent profile',
        details: agentError.message,
      });
    }

    console.log('✅ Delivery agent profile created:', agentData.id);

    res.status(201).json({
      success: true,
      message: 'Delivery agent registered successfully. Account is pending verification.',
      data: {
        user: authData.user,
        agent: agentData,
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
};

// Login delivery agent with phone number
export const loginDeliveryAgent = async (req, res) => {
  try {
    let { phone_number, password } = req.body;

    console.log('📱 Delivery agent phone login attempt:', phone_number);

    if (!phone_number || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required',
      });
    }

    // Normalize phone number - remove spaces, dashes, and ensure consistent format
    let normalizedPhone = phone_number.replace(/[\s\-]/g, '');
    
    // If doesn't start with +, add +91 for Indian numbers
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.length === 10) {
        normalizedPhone = '+91' + normalizedPhone;
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone;
      } else {
        normalizedPhone = '+' + normalizedPhone;
      }
    }

    console.log('📱 Normalized phone:', normalizedPhone);

    // Try multiple phone formats to find the agent
    const phoneVariants = [
      phone_number,                              // Original input (try first)
      normalizedPhone,                           // +916303407434
      normalizedPhone.replace(/^\+91/, '+91-'),  // +91-6303407434 (with dash)
      normalizedPhone.replace('+91', '91'),      // 916303407434
      normalizedPhone.replace('+', ''),          // 916303407434
      normalizedPhone.replace(/^\+91/, ''),      // 6303407434
      `+91-${normalizedPhone.replace(/^\+91/, '')}`, // +91-6303407434 (ensure dash format)
    ];

    console.log('🔍 Trying phone variants:', phoneVariants);

    let agent = null;
    for (const phoneVariant of phoneVariants) {
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('user_id, email, full_name, phone_number')
        .eq('phone_number', phoneVariant)
        .single();

      if (data && !error) {
        agent = data;
        console.log('✅ Found agent with phone variant:', phoneVariant);
        break;
      }
    }

    if (!agent) {
      // Debug: List all delivery agents to see what phone formats exist
      const { data: allAgents } = await supabase
        .from('delivery_agents')
        .select('phone_number, email')
        .limit(10);
      
      console.error('❌ Agent not found with any phone variant');
      console.log('📋 Sample phone numbers in database:', allAgents?.map(a => a.phone_number));
      
      return res.status(404).json({
        success: false,
        error: `No account found with this phone number. Tried: ${phoneVariants.join(', ')}`,
      });
    }

    console.log('✅ Found agent:', agent.email);

    // Sign in using email (since Supabase uses email for auth)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: agent.email,
      password: password,
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    console.log('✅ Login successful');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: authData.user,
        session: authData.session,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
};

// Register new delivery agent
export const registerDeliveryAgent = async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      email,
      phone_number,
      alternate_phone,
      vehicle_type,
      vehicle_number,
      vehicle_name,
      driving_license_url,
      aadhar_url,
      pan_url,
      selfie_url,
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      bank_account_holder_name,
      bank_branch_name,
    } = req.body;

    // Validation
    if (!user_id || !full_name || !email || !phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    
    if (authError || !authUser) {
      console.error('❌ Auth user not found:', authError);
      return res.status(404).json({
        success: false,
        error: 'User not found in authentication system',
        details: authError?.message,
      });
    }

    console.log('✅ Auth user verified:', user_id);

    // Auto-confirm email if not confirmed (for delivery agents)
    if (authUser.user && !authUser.user.email_confirmed_at) {
      console.log('📧 Auto-confirming email for delivery agent...');
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        user_id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.warn('⚠️  Failed to auto-confirm email:', confirmError);
      } else {
        console.log('✅ Email auto-confirmed');
      }
    }

    // Insert delivery agent profile
    const { data, error } = await supabase
      .from('delivery_agents')
      .insert({
        user_id,
        full_name,
        email,
        phone_number,
        alternate_phone,
        vehicle_type,
        vehicle_number,
        vehicle_name,
        driving_license_url,
        aadhar_url,
        pan_url,
        selfie_url,
        bank_account_number,
        bank_ifsc_code,
        bank_name,
        bank_account_holder_name,
        bank_branch_name,
        verification_status: 'pending',
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create delivery agent profile',
        details: error.message,
        code: error.code,
      });
    }

    console.log('✅ Delivery agent created:', data.id);

    res.status(201).json({
      success: true,
      message: 'Delivery agent registered successfully',
      data,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
};

// Get delivery agent profile
export const getDeliveryAgentProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Delivery agent not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching delivery agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Get all delivery agents (admin)
export const getAllDeliveryAgents = async (req, res) => {
  try {
    const { status, active } = req.query;

    let query = supabase
      .from('delivery_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('verification_status', status);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error fetching delivery agents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Verify delivery agent (admin)
export const verifyDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, admin_user_id } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "verified" or "rejected"',
      });
    }

    const { data, error } = await supabase
      .from('delivery_agents')
      .update({
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: status === 'verified' ? admin_user_id : null,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        is_active: status === 'verified',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `Delivery agent ${status}`,
      data,
    });
  } catch (error) {
    console.error('Error verifying delivery agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Update location
export const updateLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude } = req.body;

    const { data, error } = await supabase
      .from('delivery_agents')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Update duty status
export const updateDutyStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_on_duty } = req.body;

    const { data, error } = await supabase
      .from('delivery_agents')
      .update({
        is_on_duty,
        is_available: is_on_duty,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating duty status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

