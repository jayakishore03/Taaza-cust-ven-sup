import { useEffect } from 'react';
import { Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Suppress keep-awake errors (non-critical, expo-video tries to use it but it's optional)
    if (Platform.OS !== 'web') {
      LogBox.ignoreLogs([
        'Unable to activate keep awake',
        'keep awake',
        'expo-keep-awake',
        'Error: Unable to activate keep awake',
        '[Error: Uncaught (in promise, id: 0) Error: Unable to activate keep awake]',
      ]);
      
      // Also suppress via ErrorUtils for React Native
      if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler) {
        const originalErrorHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          const errorMessage = error?.message || error?.toString() || '';
          if (
            errorMessage.includes('keep awake') || 
            errorMessage.includes('Unable to activate keep awake') ||
            errorMessage.includes('expo-keep-awake')
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

    // Global error handler for unhandled promise rejections (all platforms)
    const handleUnhandledRejection = (event: PromiseRejectionEvent | ErrorEvent) => {
      const errorMessage = 
        (event as PromiseRejectionEvent).reason?.message || 
        (event as PromiseRejectionEvent).reason?.toString() || 
        (event as ErrorEvent).message || 
        '';
      
      if (
        errorMessage.includes('keep awake') || 
        errorMessage.includes('Unable to activate keep awake') ||
        errorMessage.includes('expo-keep-awake')
      ) {
        // Prevent the error from being logged - it's non-critical
        if ((event as PromiseRejectionEvent).preventDefault) {
          (event as PromiseRejectionEvent).preventDefault();
        }
        // Silently ignore - expo-video tries to use keep-awake but it's optional
        return;
      }
    };

    // For web - handle unhandled promise rejections
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection as EventListener);
      };
    }
  }, []);

  return (
    <AuthProvider>
      <RegistrationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="intro" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="partner-registration" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
      </RegistrationProvider>
    </AuthProvider>
  );
}