import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

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