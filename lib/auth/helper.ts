/**
 * Auth Helper
 * Centralized authentication functions using Backend API
 * All authentication now goes through the backend API
 */

import { apiClient } from '../api/client';
import { authApi } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@taza_auth_token';

// Store token in memory and AsyncStorage
let currentToken: string | null = null;

// Load token from storage on init
AsyncStorage.getItem(TOKEN_KEY).then(token => {
  if (token) {
    currentToken = token;
    apiClient.setToken(token);
  }
}).catch(() => {
  // Ignore errors
});

/**
 * Get current session and set API token
 */
export async function getAuthToken(): Promise<string | null> {
  if (!currentToken) {
    // Try to load from storage
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        currentToken = storedToken;
        apiClient.setToken(storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error('Error loading token from storage:', error);
    }
  }
  
  if (currentToken) {
    apiClient.setToken(currentToken);
    return currentToken;
  }
  return null;
}

/**
 * Sign in with phone/email and password
 */
export async function signInWithPassword(phoneOrEmail: string, password: string) {
  try {
    const response = await authApi.signIn(phoneOrEmail, password);
    
    if (response.token) {
      currentToken = response.token;
      apiClient.setToken(response.token);
      // Save to storage
      try {
        await AsyncStorage.setItem(TOKEN_KEY, response.token);
      } catch (error) {
        console.error('Error saving token to storage:', error);
      }
    }

    return {
      user: response.user,
      session: {
        access_token: response.token,
        user: response.user,
      },
    };
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.message?.includes('Network request failed') || error.message?.includes('Cannot connect')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://192.168.0.5:3000');
    }
    if (error.message?.includes('Invalid credentials') || error.message?.includes('401')) {
      throw new Error('Invalid phone number or password. Please check your credentials and try again.');
    }
    throw new Error(error.message || 'Sign in failed. Please try again.');
  }
}

/**
 * Sign up with user details
 */
export async function signUpWithPassword(
  name: string,
  phone: string,
  password: string,
  email?: string,
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    label?: string;
  },
  gender?: 'male' | 'female',
  profilePicture?: string
) {
  try {
    const response = await authApi.signUp({
      name,
      phone,
      email,
      password,
      address,
      gender,
      profilePicture,
    });
    
    if (response.token) {
      currentToken = response.token;
      apiClient.setToken(response.token);
      // Save to storage
      try {
        await AsyncStorage.setItem(TOKEN_KEY, response.token);
      } catch (error) {
        console.error('Error saving token to storage:', error);
      }
    }

    return {
      user: response.user,
      session: {
        access_token: response.token,
        user: response.user,
      },
    };
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed');
  }
}

/**
 * Sign out
 */
export async function signOut() {
  currentToken = null;
  apiClient.setToken(null);
  // Remove from storage
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from storage:', error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  // Try to load token if not in memory
  if (!currentToken) {
    await getAuthToken();
  }
  
  if (!currentToken) {
    return null;
  }
  
  try {
    // Add timeout wrapper for token verification
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000); // 5 second timeout
    });
    
    const response = await Promise.race([
      authApi.verifyToken(),
      timeoutPromise
    ]) as { user: { id: string; name: string; email: string | null; phone: string } };
    
    return response.user;
  } catch (error: any) {
    // Suppress expected authentication errors and connection timeouts
    const errorMsg = error?.message || '';
    const isConnectionError = errorMsg.includes('Connection timeout') || 
                              errorMsg.includes('ConnectionTimeout') ||
                              errorMsg.includes('Cannot connect') ||
                              errorMsg.includes('Network request failed') ||
                              errorMsg.includes('Failed to fetch');
    
    // Only log unexpected errors (not connection/timeout errors)
    if (!errorMsg.includes('Session expired') && 
        !errorMsg.includes('No token') && 
        !errorMsg.includes('Invalid API key') &&
        !errorMsg.includes('401') &&
        !isConnectionError) {
      console.error('Error verifying token:', error);
    }
    
    // Don't clear token on connection errors - might be temporary network issue
    // Only clear token on actual auth errors
    if (!isConnectionError) {
      currentToken = null;
      apiClient.setToken(null);
      // Remove from storage on auth error
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch {
        // Ignore
      }
    }
    
    return null;
  }
}

/**
 * Listen to auth state changes
 * Note: For backend auth, we use a simple polling mechanism
 * In production, you might want to implement WebSocket or push notifications
 */
export function onAuthStateChange(callback: (session: any) => void) {
  // Simple implementation - check token validity periodically
  const checkAuth = async () => {
    if (currentToken) {
      try {
        const user = await getCurrentUser();
        if (user) {
          callback({
            user,
            access_token: currentToken,
          });
        } else {
          // Only clear token if it's an auth error (not connection timeout)
          // Connection timeouts are temporary and shouldn't clear the session
          const hasToken = await getAuthToken();
          if (!hasToken) {
            currentToken = null;
            apiClient.setToken(null);
            callback(null);
          } else {
            // Token exists but verification failed - might be network issue
            // Keep the session but don't call callback with user
            // This prevents clearing session on temporary network issues
          }
        }
      } catch (error: any) {
        // Only clear token on actual auth errors, not connection timeouts
        const errorMsg = error?.message || '';
        const isConnectionError = errorMsg.includes('Connection timeout') || 
                                  errorMsg.includes('ConnectionTimeout') ||
                                  errorMsg.includes('Cannot connect');
        
        if (!isConnectionError) {
          currentToken = null;
          apiClient.setToken(null);
          callback(null);
        }
        // If it's a connection error, don't clear the session
      }
    } else {
      callback(null);
    }
  };

  // Check immediately (but don't block if it fails)
  checkAuth().catch(() => {
    // Ignore initial check errors - might be network issue
  });

  // Check every 5 minutes
  const interval = setInterval(() => {
    checkAuth().catch(() => {
      // Ignore periodic check errors
    });
  }, 5 * 60 * 1000);

  return {
    data: { subscription: { id: 'backend-auth' } },
    unsubscribe: () => {
      clearInterval(interval);
    },
  };
}

