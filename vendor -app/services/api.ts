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

    const result = await response.json();

    if (result.success && result.data?.token) {
      await setAuthToken(result.data.token);
      return result;
    }

    return result;
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Network error. Please check your connection.',
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

// ==================== ORDERS ====================

export interface Order {
  id: string;
  user_id: string;
  shop_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
  shop?: Shop;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
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
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();
    return {
      success: result.success || false,
      message: result.message || result.error?.message,
    };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.message || 'Failed to update order status',
    };
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
  monthlyRevenue: number;
  activeCustomers: number;
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
    const monthlyRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    // Get unique customers
    const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;

    return {
      totalOrders,
      monthlyRevenue,
      activeCustomers: uniqueCustomers,
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
