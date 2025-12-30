import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  type UserProfile,
  type Address,
} from '../data/dummyData';
import { usersApi } from '../lib/api/users';
import { 
  getAuthToken, 
  signInWithPassword, 
  signUpWithPassword, 
  signOut,
  onAuthStateChange 
} from '../lib/auth/helper';

type SignUpPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender?: 'male' | 'female';
  profilePicture?: string;
  address: Address;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (profile?: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  updateProfile: (updates: { name?: string; profilePicture?: string | number }) => Promise<void>;
  addAddress: (address: Address) => Promise<Address>;
  updateUserAddress: (addressId: string, address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          try {
            // Fetch user profile from backend API
            const profile = await usersApi.getProfile();
            setUser(profile);
          } catch (profileError: any) {
            // If profile fetch fails (invalid token, network error, etc.), clear token
            // Only log unexpected errors (not authentication failures or backend config errors)
            const errorMsg = profileError?.message || '';
            const isExpectedError = 
              errorMsg.includes('Session expired') || 
              errorMsg.includes('No token') || 
              errorMsg.includes('Invalid API key') ||
              errorMsg.includes('Backend configuration error') ||
              errorMsg.includes('missing Supabase') ||
              errorMsg.includes('Server configuration error') ||
              errorMsg.includes('401') ||
              errorMsg.includes('500');
            
            if (!isExpectedError && __DEV__) {
              // Only log unexpected errors in development
              console.error('Error fetching profile:', profileError);
            }
            // Clear invalid token
            await signOut();
            setUser(null);
          }
        } else {
          // No token, user is not authenticated
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const authSubscription = onAuthStateChange(async (session) => {
      if (session?.user) {
        // onAuthStateChange already verified the user via getCurrentUser()
        // We can use the user data directly or fetch fresh profile
        try {
          // Fetch fresh profile from backend API
          const profile = await usersApi.getProfile();
          setUser(profile);
        } catch (error: any) {
          // Suppress expected authentication errors and backend config errors
          const errorMsg = error?.message || '';
          const isExpectedError = 
            errorMsg.includes('Session expired') || 
            errorMsg.includes('No token') || 
            errorMsg.includes('Invalid API key') ||
            errorMsg.includes('Backend configuration error') ||
            errorMsg.includes('missing Supabase') ||
            errorMsg.includes('Server configuration error') ||
            errorMsg.includes('401');
          
          if (!isExpectedError && __DEV__) {
            // Only log unexpected errors in development
            console.error('Error fetching profile:', error);
          }
          // If profile fetch fails, clear session
          if (error?.message?.includes('Invalid') || 
              error?.message?.includes('token') || 
              error?.message?.includes('401') ||
              error?.message?.includes('Session expired') ||
              error?.message?.includes('No token')) {
            await signOut();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (profile?: UserProfile) => {
    if (profile) {
      setUser(profile);
    } else {
      // Fetch current user profile from backend API
      try {
        await getAuthToken();
        const userProfile = await usersApi.getProfile();
        setUser(userProfile);
        } catch (error: any) {
          // Suppress expected errors (backend config, auth errors)
          const errorMsg = error?.message || '';
          const isExpectedError = 
            errorMsg.includes('Session expired') || 
            errorMsg.includes('No token') || 
            errorMsg.includes('Invalid API key') ||
            errorMsg.includes('Backend configuration error') ||
            errorMsg.includes('missing Supabase') ||
            errorMsg.includes('Server configuration error');
          
          if (!isExpectedError && __DEV__) {
            // Only log unexpected errors in development
            console.error('Error fetching profile:', error);
          }
        }
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const signIn = async (phone: string, password: string) => {
    try {
      // Sign in using backend API
      const data = await signInWithPassword(phone, password);

      if (data.session && data.user) {
        // Sign-in was successful! Now try to fetch full profile
        // If profile fetch fails, we'll use the basic user data from sign-in response
        try {
          const profile = await usersApi.getProfile();
          setUser(profile);
        } catch (profileError: any) {
          // Profile fetch failed, but sign-in was successful
          // Use the user data from sign-in response to allow user to proceed
          // This prevents sign-in from appearing to fail when it actually succeeded
          const errorMsg = profileError?.message || '';
          
          // Only log if it's not an expected auth error (which we suppress)
          if (!errorMsg.includes('Session expired') && 
              !errorMsg.includes('Invalid API key') &&
              !errorMsg.includes('No token')) {
            console.warn('Profile fetch failed after sign-in, using sign-in data:', errorMsg);
          }
          
          // Create basic profile from sign-in response
          setUser({
            id: data.user.id,
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || phone,
            profilePicture: undefined,
            address: undefined,
          });
        }
      } else {
        throw new Error('Sign in failed. Please try again.');
      }
    } catch (error: any) {
      // Only throw errors that are actual sign-in failures (wrong credentials, network errors, etc.)
      const errorMessage = error?.message || error?.response?.data?.error?.message || 'Invalid phone number or password. Please check your credentials and try again.';
      
      // Don't throw if it's a profile fetch error - sign-in already succeeded
      if (errorMessage.includes('Session expired') || errorMessage.includes('Invalid API key')) {
        // This shouldn't happen here, but if it does, it means sign-in succeeded
        // but something else failed - don't show error to user
        return;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signUp = async (payload: SignUpPayload) => {
    const { name, email, phone, password, address, gender, profilePicture } = payload;

    try {
      // Sign up using backend API (includes profile and address creation)
      const authData = await signUpWithPassword(
        name,
        phone,
        password,
        email,
        address,
        gender,
        profilePicture
      );

      if (authData.user) {
        // Fetch complete profile from backend API
        const completeProfile = await usersApi.getProfile();
        setUser(completeProfile);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const updateAddress = async (updatedAddress: Address) => {
    if (!user) return;

    try {
      // Check if address has a valid UUID (not dummy like 'addr-1')
      const addressId = updatedAddress.id;
      const hasValidId = addressId && 
        typeof addressId === 'string' &&
        addressId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (hasValidId) {
        // Update existing address
        await usersApi.updateAddress(addressId, updatedAddress);
      } else {
        // Create new address (dummy ID or no ID) - remove id field
        const { id, ...addressWithoutId } = updatedAddress;
        await usersApi.addAddress(addressWithoutId);
      }
      
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: { name?: string; profilePicture?: string | number }) => {
    if (!user) return;

    try {
      await usersApi.updateProfile({
        name: updates.name,
        profilePicture: typeof updates.profilePicture === 'string' ? updates.profilePicture : undefined,
      });
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const addAddress = async (newAddress: Address): Promise<Address> => {
    if (!user) {
      const error = new Error('User not authenticated. Please sign in to save addresses.');
      console.error('Error adding address:', error);
      throw error;
    }

    try {
      // Ensure token is loaded before making API call
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      // Remove id field before adding (database will generate proper UUID)
      const { id, ...addressWithoutId } = newAddress;
      console.log('📝 Adding address to Supabase:', { ...addressWithoutId, user_id: user.id });
      
      const createdAddress = await usersApi.addAddress(addressWithoutId);
      console.log('✅ Address created in Supabase:', createdAddress.id);
      console.log('✅ Full address response:', JSON.stringify(createdAddress, null, 2));
      
      // Refresh profile to get updated addresses
      const profile = await usersApi.getProfile();
      setUser(profile);
      console.log('✅ Profile refreshed with new address');
      
      return createdAddress;
    } catch (error: any) {
      // Extract error message and type
      const errorMsg = error?.message || '';
      const errorName = error?.name || '';
      
      // Handle network errors
      if (errorName === 'NetworkError' || errorMsg.includes('Cannot connect to backend') || 
          errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      // Handle timeout errors
      if (errorName === 'ConnectionTimeout' || errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      // Handle session expired errors
      if (errorMsg.includes('Session expired') || errorMsg.includes('Invalid or expired token') || 
          errorMsg.includes('session has expired') || errorMsg.includes('No token')) {
        // Clear token and user on session expiry
        await signOut();
        setUser(null);
        throw new Error('Your session has expired. Please sign in again to save addresses.');
      }
      
      // Handle API key errors (backend configuration issue)
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('Backend configuration error') ||
          errorMsg.includes('Server configuration error') || errorMsg.includes('missing Supabase')) {
        throw new Error('Server configuration error. The backend server is not properly configured. Please contact support.');
      }
      
      // Handle invalid response errors
      if (errorName === 'InvalidResponse' || errorMsg.includes('invalid response') || errorMsg.includes('JSON')) {
        throw new Error('Server returned an invalid response. Please try again later.');
      }
      
      // Handle missing required fields
      if (errorMsg.includes('Missing required fields') || errorMsg.includes('required')) {
        throw new Error('Please fill in all required address fields.');
      }
      
      // Only log unexpected errors in development
      const isExpectedError = 
        errorMsg.includes('Session expired') || 
        errorMsg.includes('session has expired') ||
        errorMsg.includes('Invalid API key') ||
        errorMsg.includes('Backend configuration error') ||
        errorMsg.includes('Server configuration error') ||
        errorMsg.includes('User not authenticated') ||
        errorMsg.includes('Cannot connect') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('Missing required fields');
      
      if (!isExpectedError && __DEV__) {
        console.error('❌ Unexpected error adding address:', error);
        console.error('   Error name:', errorName);
        console.error('   Error message:', errorMsg);
        console.error('   Full error:', error);
      }
      
      // Re-throw with original message if it's a meaningful error
      if (error?.message && !errorMsg.includes('API request failed')) {
        throw error;
      }
      
      // Generic fallback error
      throw new Error('Failed to save address. Please check your connection and try again.');
    }
  };

  const updateUserAddress = async (addressId: string, updatedAddress: Address) => {
    if (!user) {
      const error = new Error('User not authenticated. Please sign in to update addresses.');
      console.error('Error updating address:', error);
      throw error;
    }

    try {
      // Ensure token is loaded before making API call
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      // Check if address has a valid UUID
      const hasValidId = addressId && 
        addressId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (hasValidId) {
        // Update existing address in Supabase
        console.log('📝 Updating address in Supabase:', { addressId, user_id: user.id });
        await usersApi.updateAddress(addressId, updatedAddress);
        console.log('✅ Address updated in Supabase');
      } else {
        // Dummy ID: create new address instead
        console.log('📝 Creating new address (invalid ID provided):', { user_id: user.id });
        const { id, ...addressWithoutId } = updatedAddress;
        await usersApi.addAddress(addressWithoutId);
        console.log('✅ New address created in Supabase');
      }
      
      // Refresh profile to get updated addresses
      const profile = await usersApi.getProfile();
      setUser(profile);
      console.log('✅ Profile refreshed with updated address');
    } catch (error: any) {
      // Only log unexpected errors (not session/auth errors that are handled)
      const errorMsg = error?.message || '';
      const isExpectedError = 
        errorMsg.includes('Session expired') || 
        errorMsg.includes('session has expired') ||
        errorMsg.includes('Invalid API key') ||
        errorMsg.includes('Backend configuration error') ||
        errorMsg.includes('User not authenticated');
      
      if (!isExpectedError && __DEV__) {
        console.error('❌ Error updating address in Supabase:', error);
      }
      
      // Handle session expired errors
      if (errorMsg.includes('Session expired') || errorMsg.includes('Invalid or expired token') || errorMsg.includes('session has expired')) {
        // Clear token and user on session expiry
        await signOut();
        setUser(null);
        throw new Error('Your session has expired. Please sign in again to update addresses.');
      }
      
      // Handle API key errors (backend configuration issue)
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('Backend configuration error')) {
        throw new Error('Server configuration error. Please contact support or try again later.');
      }
      
      // Re-throw with a more user-friendly message if it's an API error
      if (error?.message) {
        throw error;
      }
      throw new Error('Failed to update address. Please check your connection and try again.');
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) {
      const error = new Error('User not authenticated. Please sign in to delete addresses.');
      console.error('Error deleting address:', error);
      throw error;
    }

    try {
      // Ensure token is loaded before making API call
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      console.log('🗑️ Deleting address from Supabase:', { addressId, user_id: user.id });
      await usersApi.deleteAddress(addressId);
      console.log('✅ Address deleted from Supabase');
      
      // Refresh profile to get updated addresses
      const profile = await usersApi.getProfile();
      setUser(profile);
      console.log('✅ Profile refreshed after address deletion');
    } catch (error: any) {
      // Only log unexpected errors (not session/auth errors that are handled)
      const errorMsg = error?.message || '';
      const isExpectedError = 
        errorMsg.includes('Session expired') || 
        errorMsg.includes('session has expired') ||
        errorMsg.includes('Invalid API key') ||
        errorMsg.includes('Backend configuration error') ||
        errorMsg.includes('User not authenticated');
      
      if (!isExpectedError && __DEV__) {
        console.error('❌ Error deleting address from Supabase:', error);
      }
      
      // Handle session expired errors
      if (errorMsg.includes('Session expired') || errorMsg.includes('Invalid or expired token') || errorMsg.includes('session has expired')) {
        // Clear token and user on session expiry
        await signOut();
        setUser(null);
        throw new Error('Your session has expired. Please sign in again to delete addresses.');
      }
      
      // Handle API key errors (backend configuration issue)
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('Backend configuration error')) {
        throw new Error('Server configuration error. Please contact support or try again later.');
      }
      
      // Re-throw with a more user-friendly message if it's an API error
      if (error?.message) {
        throw error;
      }
      throw new Error('Failed to delete address. Please check your connection and try again.');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!user) {
      const error = new Error('User not authenticated. Please sign in to set default address.');
      console.error('Error setting default address:', error);
      throw error;
    }

    try {
      // Ensure token is loaded before making API call
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      console.log('⭐ Setting default address in Supabase:', { addressId, user_id: user.id });
      await usersApi.setDefaultAddress(addressId);
      console.log('✅ Default address set in Supabase');
      
      // Refresh profile to get updated addresses
      const profile = await usersApi.getProfile();
      setUser(profile);
      console.log('✅ Profile refreshed with new default address');
    } catch (error: any) {
      // Only log unexpected errors (not session/auth errors that are handled)
      const errorMsg = error?.message || '';
      const isExpectedError = 
        errorMsg.includes('Session expired') || 
        errorMsg.includes('session has expired') ||
        errorMsg.includes('Invalid API key') ||
        errorMsg.includes('Backend configuration error') ||
        errorMsg.includes('User not authenticated');
      
      if (!isExpectedError && __DEV__) {
        console.error('❌ Error setting default address in Supabase:', error);
      }
      
      // Handle session expired errors
      if (errorMsg.includes('Session expired') || errorMsg.includes('Invalid or expired token') || errorMsg.includes('session has expired')) {
        // Clear token and user on session expiry
        await signOut();
        setUser(null);
        throw new Error('Your session has expired. Please sign in again to set default address.');
      }
      
      // Handle API key errors (backend configuration issue)
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('Backend configuration error')) {
        throw new Error('Server configuration error. Please contact support or try again later.');
      }
      
      // Re-throw with a more user-friendly message if it's an API error
      if (error?.message) {
        throw error;
      }
      throw new Error('Failed to set default address. Please check your connection and try again.');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      signIn,
      signUp,
      updateAddress,
      updateProfile,
      addAddress,
      updateUserAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

