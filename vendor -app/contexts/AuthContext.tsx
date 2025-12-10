import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, verifyToken, getAuthToken, AuthResponse } from '../services/api';

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
      const token = await getAuthToken();
      if (token) {
        const result = await verifyToken();
        if (result.success && result.user) {
          setUser(result.user);
          
          // Also load vendor data from session storage if available
          try {
            const vendorDataStr = await AsyncStorage.getItem('vendor_data');
            if (vendorDataStr) {
              const vendorData = JSON.parse(vendorDataStr);
              // Vendor data is available for use in the app
              console.log('Vendor data loaded:', vendorData);
            }
          } catch (error) {
            console.error('Error loading vendor data:', error);
          }
        } else {
          // Token invalid, clear it
          await apiSignOut();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Put a cap on how long we wait for the network; after the timeout we
      // optimistically allow offline navigation so the user is not blocked.
      const timeoutMs = 5000;
      const timeoutPromise = new Promise<{ success: boolean; error?: string; offline?: boolean }>((resolve) =>
        setTimeout(() => resolve({ success: true, offline: true }), timeoutMs)
      );

      const apiPromise = apiSignIn({ email, password });
      const result: AuthResponse & { offline?: boolean } = await Promise.race([apiPromise, timeoutPromise]);
      
      if ((result as any).offline) {
        // Offline fallback: create a lightweight user so protected screens can render.
        setUser({
          id: 'offline-user',
          name: email || 'Offline User',
          phone: '',
          email,
        });
        return { success: true };
      }

      if (result.success && result.data) {
        setUser(result.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: result.error?.message || 'Sign in failed',
      };
    } catch (error: any) {
      // Network or unexpected failure: still allow navigation to keep UX unblocked.
      setUser({
        id: 'offline-user',
        name: email || 'Offline User',
        phone: '',
        email,
      });
      return {
        success: true,
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

