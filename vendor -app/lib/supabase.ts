import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fcrhcwvpivkadkkbxcom.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg';

// Initialize Supabase client
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn(
    '⚠️ Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create a safe proxy that handles missing Supabase gracefully
const createSafeSupabaseProxy = (): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get(target, prop) {
      if (!supabaseClient) {
        // Return a mock object that won't crash the app
        if (prop === 'from') {
          return () => ({
            select: () => ({ eq: () => ({ data: [], error: null }) }),
            insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            update: () => ({ eq: () => ({ data: null, error: { message: 'Supabase not configured' } }) }),
          });
        }
        return () => {};
      }
      return (supabaseClient as any)[prop];
    },
  });
};

export const supabase = createSafeSupabaseProxy();

