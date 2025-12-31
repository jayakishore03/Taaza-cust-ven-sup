import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Backend API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// ==================== AUTHENTICATION ====================

export interface SignInData {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignUpData {
  name: string;
  phone: string;
  password: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    label?: string;
  };
  gender?: string;
  profilePicture?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// Get auth token from AsyncStorage
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Store auth token
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

// Remove auth token
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Sign in
export const signIn = async (data: SignInData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = 'Login failed';
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error?.message || errorResult.message || `Server error (${response.status})`;
      } catch {
        errorMessage = `Server error (${response.status})`;
      }
      return {
        success: false,
        error: {
          message: errorMessage,
        },
      };
    }

    const result = await response.json();

    if (result.success && result.data?.token) {
      await setAuthToken(result.data.token);
      return result;
    }

    return result;
  } catch (error: any) {
    // Provide more helpful error messages for network issues
    let errorMessage = 'Network request failed';
    
    if (error.message) {
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check:\n\n1. Backend server is running\n2. Correct IP address in config\n3. Device and computer are on same network';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: {
        message: errorMessage,
      },
    };
  }
};

// Get vendor email by mobile number (for forgot password)
export const getVendorEmailByMobile = async (mobileNumber: string): Promise<{ success: boolean; data?: { email: string; shopName?: string; message: string }; error?: { message: string } }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/get-vendor-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileNumber }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Network request failed',
      },
    };
  }
};

// Send OTP to email
export const sendEmailOTP = async (email: string, purpose: 'verification' | 'password-reset' = 'password-reset'): Promise<{ success: boolean; data?: { message: string; otp?: string }; error?: { message: string } }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, purpose }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Network request failed',
      },
    };
  }
};

// Verify email OTP
export const verifyEmailOTP = async (email: string, otp: string): Promise<{ success: boolean; data?: { message: string; purpose?: string }; error?: { message: string } }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Network request failed',
      },
    };
  }
};

// Reset password via email OTP
export const resetPasswordByEmail = async (email: string, newPassword: string): Promise<{ success: boolean; data?: { message: string }; error?: { message: string } }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password-by-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Network request failed',
      },
    };
  }
};

// Sign up
export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success && result.data?.token) {
      await setAuthToken(result.data.token);
      return result;
    }

    return result;
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Network error. Please check your connection.',
      },
    };
  }
};

// Verify token
export const verifyToken = async (): Promise<{ success: boolean; user?: any }> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false };
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  await removeAuthToken();
};

// ==================== HEALTH CHECK ====================

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_CONFIG.HEALTH_CHECK_URL);
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    return false;
  }
};

// ==================== SERVICES (Products & Rates) ====================

export interface Service {
  name: string;
  description?: string;
  price: number;
  duration_hours?: number;
  is_active?: boolean;
}

// Fetch vendor services/rates
export const getServices = async (): Promise<Service[]> => {
  try {
    const token = await getAuthToken();

    // Add a short timeout so UI isn't blocked when offline
    const timeoutMs = 4000;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );

    const response = await Promise.race([
      fetch(`${API_BASE_URL}/services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
      timeout,
    ]);

    // If the race was rejected by timeout, jump to catch
    if (!response || !('ok' in response)) {
      throw new Error('Network unavailable');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    // Quiet fallback to empty list so UI can keep working offline
    return [];
  }
};

// Save vendor services/rates
export const saveServices = async (
  services: Service[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ services }),
    });

    const result = await response.json();

    return {
      success: !!result.success,
      message: result.message || 'Services saved successfully',
    };
  } catch (error: any) {
    console.error('Error saving services:', error);
    return {
      success: false,
      message: error.message || 'Failed to save services',
    };
  }
};

// ==================== ORDERS ====================

export interface Order {
  id: string;
  user_id?: string;
  shop_id?: string;
  status: string;
  total_amount?: number;
  total?: string; // Formatted total from backend (e.g., "₹100.00")
  subtotal?: number;
  deliveryCharge?: number;
  discount?: number;
  orderNumber?: string;
  created_at?: string; // Raw created_at from database
  placedOn?: string; // Formatted date from backend
  paymentMethod?: string;
  items?: OrderItem[];
  address?: {
    id?: string;
    contactName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    landmark?: string;
    label?: string;
    isDefault?: boolean;
  };
  shop?: Shop;
}

export interface OrderItem {
  id?: string;
  product_id?: string;
  addon_id?: string;
  name?: string;
  quantity?: number;
  weight?: string;
  weightInKg?: number;
  price?: string; // Formatted price from backend (e.g., "₹100.00")
  pricePerKg?: string; // Formatted price per kg (e.g., "₹100.00/kg")
  image?: string; // Image URL
  imageUrl?: string; // Alternative image URL field
  product?: Product;
}

export interface Shop {
  id: string;
  name: string;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  image_url?: string;
}

// Get vendor orders (requires authentication)
export const getVendorOrders = async (): Promise<Order[]> => {
  try {
    // Try to get token from backend auth first
    let token = await getAuthToken();
    
    // If no backend token, try to get Supabase session token
    if (!token) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (supabaseError) {
        // Silently fail - no token available
      }
    }

    if (!token) {
      // No token available, return empty array silently
      console.log('[getVendorOrders] No auth token available');
      return [];
    }

    const url = `${API_BASE_URL}/vendor/orders`;
    console.log(`[getVendorOrders] Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[getVendorOrders] Response status: ${response.status}`);

    if (!response.ok) {
      // Try to get error details
      let errorText = '';
      try {
        errorText = await response.text();
        console.warn(`[getVendorOrders] Error response: ${errorText}`);
      } catch (e) {
        // Ignore
      }
      
      // Handle 404 gracefully (endpoint may not be deployed yet)
      if (response.status === 404) {
        console.warn(`[getVendorOrders] Endpoint not found (404) at ${url}`);
        console.warn('[getVendorOrders] Make sure the backend is deployed and the /api/vendor/orders route is available');
        return [];
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        console.warn('[getVendorOrders] Authentication failed (401)');
        return [];
      }
      
      // For other errors, log and return empty array
      console.warn(`[getVendorOrders] Error ${response.status}: ${errorText || 'Unknown error'}`);
      return [];
    }

    const result = await response.json();
    const orders = result.data || [];
    console.log(`[getVendorOrders] Fetched ${orders.length} orders`);
    return orders;
  } catch (error: any) {
    // Log error but return empty array to prevent crashes
    console.error('[getVendorOrders] Error:', error.message || error);
    return [];
  }
};

// Get vendor order by ID with full details
export const getVendorOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    let token = await getAuthToken();
    
    if (!token) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (supabaseError) {
        // Silently fail
      }
    }

    if (!token) {
      console.log('[getVendorOrderById] No auth token available');
      return null;
    }

    const url = `${API_BASE_URL}/vendor/orders/${orderId}`;
    console.log(`[getVendorOrderById] Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[getVendorOrderById] Response status: ${response.status}`);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.warn(`[getVendorOrderById] Error response: ${errorText}`);
      } catch (e) {
        // Ignore
      }
      
      if (response.status === 404) {
        console.warn(`[getVendorOrderById] Order not found (404)`);
        return null;
      }
      
      if (response.status === 401) {
        console.warn('[getVendorOrderById] Authentication failed (401)');
        return null;
      }
      
      console.warn(`[getVendorOrderById] Error ${response.status}: ${errorText || 'Unknown error'}`);
      return null;
    }

    const result = await response.json();
    const order = result.data || null;
    console.log(`[getVendorOrderById] Fetched order:`, order?.orderNumber || order?.id);
    return order;
  } catch (error: any) {
    console.error('[getVendorOrderById] Error:', error.message || error);
    return null;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  try {
    let token = await getAuthToken();
    
    if (!token) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (supabaseError) {
        // Silently fail
      }
    }

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/vendor/orders/${orderId}/status`;
    console.log(`[updateOrderStatus] Updating order ${orderId} to status: ${status}`);
    console.log(`[updateOrderStatus] URL: ${url}`);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    console.log(`[updateOrderStatus] Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Failed to update order status';
      let errorDetails = '';
      
      try {
        const errorText = await response.text();
        console.warn(`[updateOrderStatus] Error response: ${errorText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          errorDetails = errorJson.error?.details || '';
        } catch (e) {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        // If we can't read the response, use status code
        errorMessage = `Failed to update order status (${response.status})`;
      }
      
      console.error(`[updateOrderStatus] Error: ${errorMessage}`, errorDetails ? `Details: ${errorDetails}` : '');
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[updateOrderStatus] Success response:`, result);
    
    // If the response includes the updated order, return it
    // Otherwise, fetch the order again to get full details
    if (result.data) {
      console.log(`[updateOrderStatus] ✅ Order updated successfully`);
      return result.data;
    } else {
      console.log(`[updateOrderStatus] Response doesn't include order data, fetching...`);
      // Fetch updated order details
      const updatedOrder = await getVendorOrderById(orderId);
      if (updatedOrder) {
        console.log(`[updateOrderStatus] ✅ Fetched updated order`);
        return updatedOrder;
      }
      throw new Error('Failed to get updated order');
    }
  } catch (error: any) {
    console.error('[updateOrderStatus] Exception:', error);
    throw error;
  }
};

// ==================== SHOPS ====================

// Get shop by ID
export const getShopById = async (shopId: string): Promise<Shop | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shop: ${response.status}`);
    }

    const result = await response.json();
    return result.data || null;
  } catch (error: any) {
    console.error('Error fetching shop:', error);
    return null;
  }
};

// ==================== DASHBOARD STATS ====================

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
}

// Get dashboard statistics (requires authentication)
export const getDashboardStats = async (): Promise<DashboardStats | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }

    // For now, we'll calculate from orders
    // In the future, you can create a dedicated endpoint
    const orders = await getVendorOrders();
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => 
      ['pending', 'confirmed', 'preparing'].includes(o.status?.toLowerCase())
    ).length;
    
    return {
      totalOrders,
      pendingOrders,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

// ==================== REGISTRATION (Vendor Registration) ====================

export interface RegistrationData {
  // Step 1
  ownerName: string;
  storeName: string;
  address?: string;
  shopPlot?: string;
  floor?: string;
  building?: string;
  pincode: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  area?: string;
  city?: string;
  storePhotos?: string[];
  shopType?: string;
  
  // Step 2
  email: string;
  mobileNumber: string;
  whatsappNumber?: string;
  isWhatsAppSame: boolean;
  otpVerified: boolean;
  
  // Step 3
  workingDays: string[];
  sameTime: boolean;
  commonOpenTime?: string;
  commonCloseTime?: string;
  dayTimes?: Record<string, { open: string; close: string }>;
  
  // Step 4
  documents?: {
    pan?: string;
    gst?: string;
    fssai?: string;
    shopLicense?: string;
    aadhaar?: string;
  };
  
  // Step 5
  bankDetails?: {
    ifsc?: string;
    accountNumber?: string;
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountType?: string;
  };
  
  // Step 6
  contractAccepted: boolean;
  profitShare?: number;
  signature?: string;
}

// Submit vendor registration
export const submitVendorRegistration = async (
  data: RegistrationData,
  password: string
): Promise<{ success: boolean; message: string; data?: { user: User; shop: any; token: string } }> => {
  try {
    // Prepare registration data
    const registrationPayload = {
      // Step 1: Basic Details
      ownerName: data.ownerName,
      storeName: data.storeName,
      address: data.address,
      shopPlot: data.shopPlot,
      floor: data.floor,
      building: data.building,
      pincode: data.pincode,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      area: data.area,
      city: data.city,
      storePhotos: data.storePhotos?.map((p: any) => typeof p === 'string' ? p : (p.uri || p)) || [],
      
      // Step 2: Contact Details
      email: data.email,
      mobileNumber: data.mobileNumber,
      whatsappNumber: data.whatsappNumber || data.mobileNumber,
      isWhatsAppSame: data.isWhatsAppSame ?? true,
      
      // Step 3: Working Days
      workingDays: data.workingDays || [],
      sameTime: data.sameTime ?? true,
      commonOpenTime: data.commonOpenTime,
      commonCloseTime: data.commonCloseTime,
      dayTimes: data.dayTimes ? Object.keys(data.dayTimes).reduce((acc, day) => {
        const times = data.dayTimes![day] as any;
        const openTime = typeof times.open === 'string' ? times.open : (times.open instanceof Date ? times.open.toTimeString().slice(0, 5) : String(times.open || '09:00'));
        const closeTime = typeof times.close === 'string' ? times.close : (times.close instanceof Date ? times.close.toTimeString().slice(0, 5) : String(times.close || '21:00'));
        acc[day] = {
          open_time: openTime,
          close_time: closeTime,
        };
        return acc;
      }, {} as any) : undefined,
      
      // Step 4: Documents (URLs)
      panDocument: data.documents?.pan ? (typeof data.documents.pan === 'string' ? data.documents.pan : (data.documents.pan as any).uri) : undefined,
      gstDocument: data.documents?.gst ? (typeof data.documents.gst === 'string' ? data.documents.gst : (data.documents.gst as any).uri) : undefined,
      fssaiDocument: data.documents?.fssai ? (typeof data.documents.fssai === 'string' ? data.documents.fssai : (data.documents.fssai as any).uri) : undefined,
      shopLicenseDocument: data.documents?.shopLicense ? (typeof data.documents.shopLicense === 'string' ? data.documents.shopLicense : (data.documents.shopLicense as any).uri) : undefined,
      aadhaarDocument: data.documents?.aadhaar ? (typeof data.documents.aadhaar === 'string' ? data.documents.aadhaar : (data.documents.aadhaar as any).uri) : undefined,
      
      // Step 5: Banking
      ifscCode: data.bankDetails?.ifsc,
      accountNumber: data.bankDetails?.accountNumber,
      accountHolderName: data.bankDetails?.accountHolderName,
      bankName: data.bankDetails?.bankName,
      bankBranch: data.bankDetails?.bankBranch,
      accountType: (data.bankDetails as any)?.accountType || 'Savings',
      
      // Step 6: Contract
      termsAccepted: data.contractAccepted ?? false,
      signature: (data as any).signature,
      profitShare: data.profitShare,
      
      // Password
      password: password,
    };

    const response = await fetch(`${API_BASE_URL}/vendor/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationPayload),
    });

    const result = await response.json();

    if (result.success && result.data?.token) {
      // Store token
      await setAuthToken(result.data.token);
      
      // Store vendor data in session storage
      await AsyncStorage.setItem('vendor_data', JSON.stringify({
        user: result.data.user,
        shop: result.data.shop,
      }));

      return {
        success: true,
        message: result.message || 'Vendor registration successful!',
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.error?.message || result.message || 'Registration failed',
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
    };
  }
};

// Get vendor profile
export const getVendorProfile = async (): Promise<{ success: boolean; data?: { user: User; shop: any } }> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false };
    }

    const response = await fetch(`${API_BASE_URL}/vendor/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success && result.data) {
      // Update session storage
      await AsyncStorage.setItem('vendor_data', JSON.stringify(result.data));
      return result;
    }

    return { success: false };
  } catch (error) {
    console.error('Get vendor profile error:', error);
    return { success: false };
  }
};

// Update shop open/close status
export const updateShopStatus = async (isOpen: boolean): Promise<{ success: boolean; data?: { shop: any; message: string }; error?: { message: string } }> => {
  try {
    // Try to get token from backend auth first
    let token = await getAuthToken();
    
    // If no backend token, try to get Supabase session token
    if (!token) {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (supabaseError) {
        // Silently fail - no token available
      }
    }

    if (!token) {
      return {
        success: false,
        error: { message: 'Not authenticated' },
      };
    }

    const url = `${API_BASE_URL}/vendor/shop/status`;
    console.log(`[updateShopStatus] Updating shop status to: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`[updateShopStatus] URL: ${url}`);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_open: isOpen }),
    });

    console.log(`[updateShopStatus] Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Failed to update shop status';
      let errorDetails = '';
      
      try {
        const errorText = await response.text();
        console.warn(`[updateShopStatus] Error response: ${errorText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          errorDetails = errorJson.error?.details || '';
        } catch (e) {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        // If we can't read the response, use status code
        errorMessage = `Failed to update shop status (${response.status})`;
      }
      
      console.error(`[updateShopStatus] Error: ${errorMessage}`, errorDetails ? `Details: ${errorDetails}` : '');
      return {
        success: false,
        error: { message: errorMessage },
      };
    }

    const result = await response.json();
    console.log(`[updateShopStatus] Success response:`, result);

    if (result.success && result.data) {
      // Update cached vendor data with new shop status
      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (vendorDataStr) {
          const vendorData = JSON.parse(vendorDataStr);
          vendorData.shop = { ...vendorData.shop, ...result.data.shop };
          await AsyncStorage.setItem('vendor_data', JSON.stringify(vendorData));
        }
      } catch (error) {
        // Non-blocking: ignore storage errors
      }
    }

    return result;
  } catch (error: any) {
    console.error('[updateShopStatus] Exception:', error);
    return {
      success: false,
      error: { message: error.message || 'Failed to update shop status' },
    };
  }
};
