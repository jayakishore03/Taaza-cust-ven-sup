import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';

// Suppress the "Unable to activate keep awake" error/warning
// This is a harmless error from expo-router/expo-keep-awake
LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'Error: Unable to activate keep awake',
]);

// Also handle unhandled promise rejections for this specific error
if (typeof global !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Unable to activate keep awake')) {
      // Silently ignore this harmless error
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen 
          name="(tabs)" 
          options={{
            gestureEnabled: false, // Prevent swipe back gesture
            headerBackVisible: false, // Hide back button
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
