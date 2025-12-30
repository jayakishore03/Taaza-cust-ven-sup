import '@/lib/errorHandler'; // Initialize error handlers early
import { useState, useCallback, useEffect } from 'react';
import { Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { SplashVideo } from '@/components/SplashVideo';

export default function RootLayout() {
  useFrameworkReady();
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const handleSplashFinish = useCallback(() => {
    setIsSplashFinished(true);
  }, []);

  // Suppress keep-awake errors (non-critical, expo-video tries to use it but it's optional)
  useEffect(() => {
    // Set up error suppression immediately before any other code runs
    
    // For React Native - use LogBox to ignore these errors
    if (Platform.OS !== 'web') {
      // Suppress console errors
      LogBox.ignoreLogs([
        'Unable to activate keep awake',
        'keep awake',
        'expo-keep-awake',
        'Error: Unable to activate keep awake',
        '[Error: Uncaught (in promise, id: 0) Error: Unable to activate keep awake]',
        'Uncaught (in promise) Error: Unable to activate keep awake',
        'CodedError: Unable to activate keep awake',
      ]);
      
      // Suppress via ErrorUtils for React Native - this handles sync errors
      if (typeof (global as any).ErrorUtils !== 'undefined') {
        const ErrorUtils = (global as any).ErrorUtils;
        if (ErrorUtils.getGlobalHandler) {
          const originalErrorHandler = ErrorUtils.getGlobalHandler();
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
      }
    }

    // Global error handler for unhandled promise rejections (all platforms)
    const handleUnhandledRejection = (event: any) => {
      const errorMessage = 
        event?.reason?.message || 
        event?.reason?.toString() || 
        event?.message || 
        event?.toString() ||
        '';
      
      // Check in multiple places
      const errorString = JSON.stringify(event?.reason || event || '');
      
      if (
        errorMessage.includes('keep awake') || 
        errorMessage.includes('Unable to activate keep awake') ||
        errorMessage.includes('expo-keep-awake') ||
        errorString.includes('keep awake')
      ) {
        // Prevent the error from being logged - it's non-critical
        if (event?.preventDefault) {
          event.preventDefault();
        }
        // Stop propagation
        if (event?.stopPropagation) {
          event.stopPropagation();
        }
        // Silently ignore - expo-video tries to use keep-awake but it's optional
        return true;
      }
      return false;
    };

    // For web - handle unhandled promise rejections
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
    }
    
    // For React Native - handle promise rejections via global handler
    // React Native doesn't have window.addEventListener for unhandledrejection,
    // but we can use ErrorUtils or a global promise rejection handler
    if (Platform.OS !== 'web') {
      // Override console.error temporarily to filter keep-awake errors
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        const errorString = args.map(arg => 
          typeof arg === 'string' ? arg : JSON.stringify(arg)
        ).join(' ');
        
        if (
          errorString.includes('keep awake') || 
          errorString.includes('Unable to activate keep awake') ||
          errorString.includes('expo-keep-awake')
        ) {
          // Silently ignore keep-awake errors in console
          return;
        }
        // Call original console.error for other errors
        originalConsoleError.apply(console, args);
      };
    }

    return () => {
      // Cleanup
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
      }
    };

    // Note: Keep-awake errors are non-critical and can be safely ignored
    // They occur because expo-video tries to use keep-awake functionality
    // but it's optional and doesn't affect video playback
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            {isSplashFinished ? (
              <>
                <Stack screenOptions={{ headerShown: false }} />
                <StatusBar style="auto" />
              </>
            ) : (
              <SplashVideo onFinish={handleSplashFinish} />
            )}
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
