/**
 * Global Error Handler
 * Catches keep-awake errors and other non-critical errors
 * This runs before React loads to catch early errors
 */

import { Platform, LogBox } from 'react-native';

// Set up error suppression immediately when this module loads
if (Platform.OS !== 'web') {
  // Suppress LogBox warnings/errors for keep-awake and backend config errors
  LogBox.ignoreLogs([
    'Unable to activate keep awake',
    'keep awake',
    'expo-keep-awake',
    'Error: Unable to activate keep awake',
    '[Error: Uncaught (in promise, id: 0) Error: Unable to activate keep awake]',
    'Uncaught (in promise) Error: Unable to activate keep awake',
    'CodedError: Unable to activate keep awake',
    // Suppress backend configuration errors
    'Backend configuration error',
    'Server configuration error',
    'The server is not properly configured',
    'server is not properly configured',
    'not properly configured',
    'missing Supabase',
    'missing Supabase environment variables',
    'missing Supabase credentials',
    'The backend server is missing Supabase',
    'Please check Vercel environment variables',
    'VERCEL_ENV_SETUP_GUIDE',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'Backend Supabase configuration missing',
  ]);

  // Set up ErrorUtils handler for React Native
  if (typeof (global as any).ErrorUtils !== 'undefined') {
    const ErrorUtils = (global as any).ErrorUtils;
    const originalErrorHandler = ErrorUtils.getGlobalHandler?.();
    
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      const errorMessage = error?.message || error?.toString() || error?.stack || '';
      const errorString = JSON.stringify(error || '');
      
      if (
        errorMessage.includes('keep awake') || 
        errorMessage.includes('Unable to activate keep awake') ||
        errorMessage.includes('expo-keep-awake') ||
        errorString.includes('keep awake')
      ) {
        // Silently ignore keep-awake errors
        return;
      }
      
      // Call original handler for other errors
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  // Override console.error to filter keep-awake errors and expected auth errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    
    // Suppress keep-awake errors
    if (
      errorString.includes('keep awake') || 
      errorString.includes('Unable to activate keep awake') ||
      errorString.includes('expo-keep-awake')
    ) {
      // Silently ignore keep-awake errors
      return;
    }
    
    // Suppress backend configuration errors (shown to user via Alert, not console)
    if (
      errorString.includes('Backend configuration error') ||
      errorString.includes('Backend Supabase configuration missing') ||
      errorString.includes('missing Supabase') ||
      errorString.includes('missing Supabase environment variables') ||
      errorString.includes('missing Supabase credentials') ||
      errorString.includes('The backend server is missing Supabase') ||
      errorString.includes('Please check Vercel environment variables') ||
      errorString.includes('VERCEL_ENV_SETUP_GUIDE') ||
      (errorString.includes('SUPABASE_URL') && (errorString.includes('MISSING') || errorString.includes('missing'))) ||
      (errorString.includes('SUPABASE_ANON_KEY') && (errorString.includes('MISSING') || errorString.includes('missing'))) ||
      (errorString.includes('SUPABASE_SERVICE_ROLE_KEY') && (errorString.includes('MISSING') || errorString.includes('missing'))) ||
      errorString.includes('Server configuration error') ||
      errorString.includes('The server is not properly configured') ||
      errorString.includes('server is not properly configured') ||
      errorString.includes('not properly configured')
    ) {
      // Silently ignore backend configuration errors (user can't fix these from app)
      return;
    }
    
    // Suppress expected authentication errors (when user is not logged in)
    // Check for various patterns of auth errors
    const hasAuthErrorPattern = 
      errorString.includes('Session expired') ||
      errorString.includes('No token provided') ||
      errorString.includes('No token') ||
      errorString.includes('Invalid or expired token') ||
      (errorString.includes('Invalid API key') && (errorString.includes('users/profile') || errorString.includes('/api/users/profile') || errorString.includes('users/profile') || errorString.includes('users/addresses') || errorString.includes('/api/users/addresses'))) ||
      (errorString.includes('Error fetching profile') && (errorString.includes('Session expired') || errorString.includes('No token') || errorString.includes('Invalid API key') || errorString.includes('Backend configuration error') || errorString.includes('missing Supabase') || errorString.includes('Server configuration error') || errorString.includes('401') || errorString.includes('500'))) ||
      (errorString.includes('Status: 500') && errorString.includes('Invalid API key')) ||
      (errorString.includes('Status: 401') && (errorString.includes('Invalid API key') || errorString.includes('No token') || errorString.includes('Session expired'))) ||
      (errorString.includes('❌ API Error Details') && errorString.includes('Invalid API key') && (errorString.includes('users/profile') || errorString.includes('users/addresses'))) ||
      // Suppress sign-in errors (shown in UI, not console)
      (errorString.includes('/auth/signin') && (errorString.includes('No account found') || errorString.includes('Invalid phone number') || errorString.includes('Status: 401'))) ||
      (errorString.includes('❌ API Error Details') && errorString.includes('/auth/signin') && errorString.includes('Status: 401')) ||
      // Suppress address-related errors that are already shown to user via Alert
      (errorString.includes('Error saving address') && (errorString.includes('Session expired') || errorString.includes('session has expired'))) ||
      (errorString.includes('Error adding address') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('Error updating address') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('Error deleting address') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('Error setting default address') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('❌ Error adding address to Supabase') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('❌ Error updating address in Supabase') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('❌ Error deleting address from Supabase') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      (errorString.includes('❌ Error setting default address in Supabase') && (errorString.includes('Session expired') || errorString.includes('session has expired') || errorString.includes('Invalid API key'))) ||
      // Suppress backend configuration errors (user can't fix these, shown in Alert)
      (errorString.includes('Backend configuration error') || 
      errorString.includes('Server configuration error') ||
      errorString.includes('Supabase credentials are invalid or missing') ||
      errorString.includes('Supabase credentials are invalid') ||
      errorString.includes('The server is not properly configured') ||
      errorString.includes('server is not properly configured') ||
      errorString.includes('not properly configured') ||
       errorString.includes('missing Supabase') ||
       errorString.includes('missing Supabase environment variables') ||
       errorString.includes('missing Supabase credentials') ||
       errorString.includes('The backend server is missing Supabase') ||
       errorString.includes('Please check Vercel environment variables') ||
       errorString.includes('VERCEL_ENV_SETUP_GUIDE') ||
       errorString.includes('SUPABASE_URL') ||
       errorString.includes('SUPABASE_ANON_KEY') ||
       errorString.includes('SUPABASE_SERVICE_ROLE_KEY') ||
       (errorString.includes('Error fetching profile') && (errorString.includes('Backend configuration error') || errorString.includes('missing Supabase') || errorString.includes('Server configuration error') || errorString.includes('not properly configured'))) ||
       (errorString.includes('Error saving address') && errorString.includes('not properly configured')) ||
       (errorString.includes('Error adding address') && errorString.includes('not properly configured')) ||
       (errorString.includes('❌ API Error Details') && errorString.includes('not properly configured')));
    
    if (hasAuthErrorPattern) {
      // Silently ignore expected auth errors and address errors that are shown to user
      return;
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };
}

// Handle unhandled promise rejections for web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const handleUnhandledRejection = (event: any) => {
    const errorMessage = 
      event?.reason?.message || 
      event?.reason?.toString() || 
      event?.message || 
      event?.toString() ||
      '';
    
    const errorString = JSON.stringify(event?.reason || event || '');
    
    if (
      errorMessage.includes('keep awake') || 
      errorMessage.includes('Unable to activate keep awake') ||
      errorMessage.includes('expo-keep-awake') ||
      errorString.includes('keep awake')
    ) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

