import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, verifyToken, getAuthToken, AuthResponse } from '../services/api';
import { signInVendor, getShopByVendorId } from '../services/shops';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check Supabase Auth session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth session:', error);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        // User is authenticated, fetch shop details
        const userId = session.user.id;
        const shop = await getShopByVendorId(userId);
        
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email || '',
          phone: session.user.phone || '',
          email: session.user.email || '',
        });

        // Store vendor data
        if (shop) {
          await AsyncStorage.setItem('vendor_data', JSON.stringify({
            user: {
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              name: shop.owner_name || session.user.user_metadata?.name || session.user.email,
            },
            shop: {
              id: shop.id,
              name: shop.name,
              storeName: shop.name,
              owner_name: shop.owner_name,
              email: shop.email,
              mobile_number: shop.mobile_number,
              is_active: shop.is_active,
              ...shop,
            },
          }));
          console.log('[AuthContext] Vendor session restored:', {
            userId: session.user.id,
            shopId: shop.id,
            shopName: shop.name,
          });
        } else {
          // Load from AsyncStorage if shop not found
          try {
            const vendorDataStr = await AsyncStorage.getItem('vendor_data');
            if (vendorDataStr) {
              const vendorData = JSON.parse(vendorDataStr);
              console.log('[AuthContext] Vendor data loaded from storage:', vendorData);
            }
          } catch (error) {
            console.error('Error loading vendor data:', error);
          }
        }
      } else {
        // No session, clear stored data
        await AsyncStorage.removeItem('vendor_data');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (mobileNumberOrEmail: string, password: string) => {
    try {
      setIsLoading(true);

      // Use Supabase Auth for vendor sign-in (vendors are registered in Supabase Auth)
      // The signInVendor function will handle both mobile number and email
      const result = await signInVendor(mobileNumberOrEmail, password);
      
      if (result.success && result.user) {
        // Set user data
        setUser({
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone || '',
          email: result.user.email,
        });

        // Store vendor data (user + shop) in AsyncStorage
        if (result.shop) {
          await AsyncStorage.setItem('vendor_data', JSON.stringify({
            user: result.user,
            shop: {
              id: result.shop.id,
              name: result.shop.name,
              storeName: result.shop.name,
              owner_name: result.shop.owner_name,
              email: result.shop.email,
              mobile_number: result.shop.mobile_number,
              is_active: result.shop.is_active,
              ...result.shop,
            },
          }));
          console.log('[AuthContext] Vendor data stored:', {
            userId: result.user.id,
            shopId: result.shop.id,
            shopName: result.shop.name,
          });
        } else {
          // Store user data even if shop not found
          await AsyncStorage.setItem('vendor_data', JSON.stringify({
            user: result.user,
            shop: null,
          }));
          console.warn('[AuthContext] Shop not found for vendor, user data stored without shop');
        }

        return { success: true };
      }

      // Return error if login failed
      return {
        success: false,
        error: result.error || 'Sign in failed',
      };
    } catch (error: any) {
      // Return network error to be handled by the login screen
      return {
        success: false,
        error: error.message || 'Network request failed. Please check your connection.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: any) => {
    try {
      setIsLoading(true);
      const result = await apiSignUp(data);
      
      if (result.success && result.data) {
        setUser(result.data.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Sign up failed',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your connection.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase Auth
      await supabase.auth.signOut();
      // Also clear backend token if exists
      await apiSignOut();
      setUser(null);
      // Clear vendor data from session storage
      await AsyncStorage.removeItem('vendor_data');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

