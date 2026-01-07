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

    // Extract just the 10-digit phone number (remove country code, spaces, dashes, etc.)
    let digitsOnly = phone_number.replace(/\D/g, ''); // Remove all non-digits
    
    // If it starts with 91 (country code), remove it
    if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
      digitsOnly = digitsOnly.substring(2);
    }
    
    // Should now have 10 digits
    if (digitsOnly.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Please enter a 10-digit Indian mobile number.',
      });
    }

    console.log('📱 Searching for phone with last 10 digits:', digitsOnly);
    console.log('🔍 SQL pattern:', `%${digitsOnly}`);

    // Use SQL LIKE to find phone number ending with these 10 digits
    // This will match any format: +916303407434, +91-6303407434, 916303407434, 6303407434, etc.
    const { data: agents, error: searchError } = await supabase
      .from('delivery_agents')
      .select('user_id, email, full_name, phone_number')
      .like('phone_number', `%${digitsOnly}`);

    console.log('🔍 Search result:', { found: agents?.length || 0, error: searchError });

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      throw searchError;
    }

    // Debug: ALWAYS list all delivery agents to see what's in the database
    const { data: allAgents, error: allAgentsError } = await supabase
      .from('delivery_agents')
      .select('phone_number, email, full_name, user_id')
      .limit(10);
    
    console.log('📊 Database status:');
    console.log(`   Total agents found: ${allAgents?.length || 0}`);
    if (allAgentsError) {
      console.error('   Error fetching all agents:', allAgentsError);
    }
    
    if (allAgents && allAgents.length > 0) {
      console.log('📋 All agents in database:');
      allAgents.forEach((a, index) => {
        console.log(`   ${index + 1}. Phone: ${a.phone_number}, Email: ${a.email}, Name: ${a.full_name}`);
      });
    } else {
      console.log('   ⚠️  No delivery agents found in database!');
    }

    if (!agents || agents.length === 0) {
      console.error(`❌ Agent not found with phone ending: ${digitsOnly}`);
      
      return res.status(404).json({
        success: false,
        error: `No account found with phone number ending in ${digitsOnly}`,
        debug: {
          searchPattern: `%${digitsOnly}`,
          totalAgentsInDB: allAgents?.length || 0,
          samplePhones: allAgents?.map(a => a.phone_number) || [],
        },
      });
    }

    const agent = agents[0]; // Take first match
    console.log('✅ Found agent:', agent.email, 'with phone:', agent.phone_number);

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

// Find nearby delivery agents for an order
export const findNearbyAgents = async (req, res) => {
  try {
    const { shop_latitude, shop_longitude, radius_km = 5 } = req.body;

    if (!shop_latitude || !shop_longitude) {
      return res.status(400).json({
        success: false,
        error: 'Shop location required',
      });
    }

    // Get all active delivery agents who are on duty
    const { data: agents, error } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('is_on_duty', true)
      .eq('is_available', true)
      .eq('verification_status', 'verified');

    if (error) {
      throw error;
    }

    // Calculate distance and filter nearby agents
    const nearbyAgents = agents
      .filter(agent => agent.current_latitude && agent.current_longitude)
      .map(agent => {
        const distance = calculateDistance(
          shop_latitude,
          shop_longitude,
          agent.current_latitude,
          agent.current_longitude
        );
        return { ...agent, distance };
      })
      .filter(agent => agent.distance <= radius_km)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: nearbyAgents.length,
      data: nearbyAgents,
    });
  } catch (error) {
    console.error('Error finding nearby agents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Send order notification to delivery agent
export const sendOrderNotification = async (req, res) => {
  try {
    const { order_id, agent_user_id, shop_name, shop_address, customer_address, shop_latitude, shop_longitude, customer_latitude, customer_longitude } = req.body;

    if (!order_id || !agent_user_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and agent user ID required',
      });
    }

    // Calculate distance between shop and customer
    const distance = calculateDistance(
      shop_latitude,
      shop_longitude,
      customer_latitude,
      customer_longitude
    );

    // Create order notification in database
    const { data, error } = await supabase
      .from('delivery_notifications')
      .insert({
        order_id,
        agent_user_id,
        shop_name,
        shop_address,
        customer_address,
        shop_latitude,
        shop_longitude,
        customer_latitude,
        customer_longitude,
        distance_km: distance,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Notification sent to delivery agent',
      data,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Get pending notifications for delivery agent
export const getPendingNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('delivery_notifications')
      .select('*')
      .eq('agent_user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Accept order by delivery agent
export const acceptOrder = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { agent_user_id } = req.body;

    // Update notification status to accepted
    const { data: notification, error: notifError } = await supabase
      .from('delivery_notifications')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('agent_user_id', agent_user_id)
      .eq('status', 'pending')
      .select()
      .single();

    if (notifError || !notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or already processed',
      });
    }

    // Update order with delivery agent
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        delivery_agent_id: agent_user_id,
        status: 'assigned_to_delivery',
        updated_at: new Date().toISOString(),
      })
      .eq('id', notification.order_id);

    if (orderError) {
      throw orderError;
    }

    // Mark agent as unavailable
    await supabase
      .from('delivery_agents')
      .update({ is_available: false })
      .eq('user_id', agent_user_id);

    // Reject other pending notifications for this order
    await supabase
      .from('delivery_notifications')
      .update({ status: 'expired' })
      .eq('order_id', notification.order_id)
      .neq('id', notificationId);

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Reject order by delivery agent
export const rejectOrder = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { agent_user_id } = req.body;

    const { data, error } = await supabase
      .from('delivery_notifications')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('agent_user_id', agent_user_id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or already processed',
      });
    }

    res.json({
      success: true,
      message: 'Order rejected',
      data,
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

