// Backend API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Delivery Agent API
export const deliveryAgentAPI = {
  // Complete signup (creates auth user + profile in one call)
  signup: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
    alternate_phone: string;
    vehicle_type: string;
    vehicle_number: string;
    vehicle_name: string;
    driving_license_url: string | null;
    aadhar_url: string | null;
    pan_url: string | null;
    selfie_url: string | null;
    bank_account_number: string;
    bank_ifsc_code: string;
    bank_name: string;
    bank_account_holder_name: string;
    bank_branch_name: string;
  }) => {
    const response = await fetch(`${API_URL}/delivery-agents/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.details || 'Signup failed');
    }

    return result;
  },

  // Register new delivery agent (legacy - use signup instead)
  register: async (data: {
    user_id: string;
    full_name: string;
    email: string;
    phone_number: string;
    alternate_phone: string;
    vehicle_type: string;
    vehicle_number: string;
    vehicle_name: string;
    driving_license_url: string | null;
    aadhar_url: string | null;
    pan_url: string | null;
    selfie_url: string | null;
    bank_account_number: string;
    bank_ifsc_code: string;
    bank_name: string;
    bank_account_holder_name: string;
    bank_branch_name: string;
  }) => {
    const response = await fetch(`${API_URL}/delivery-agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.details || 'Registration failed');
    }

    return result;
  },

  // Get delivery agent profile
  getProfile: async (userId: string) => {
    const response = await fetch(`${API_URL}/delivery-agents/profile/${userId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result;
  },

  // Update location
  updateLocation: async (userId: string, latitude: number, longitude: number) => {
    const response = await fetch(`${API_URL}/delivery-agents/${userId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update location');
    }

    return result;
  },

  // Update duty status
  updateDutyStatus: async (userId: string, is_on_duty: boolean) => {
    const response = await fetch(`${API_URL}/delivery-agents/${userId}/duty-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_on_duty }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update duty status');
    }

    return result;
  },
};

