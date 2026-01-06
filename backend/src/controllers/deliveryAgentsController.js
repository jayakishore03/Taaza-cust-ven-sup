import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://fcrhcwvpivkadkkbxcom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

