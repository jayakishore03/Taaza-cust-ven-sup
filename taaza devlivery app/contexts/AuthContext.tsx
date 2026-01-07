import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { deliveryAgentAPI } from '../services/api';

interface AuthContextType {
  session: any | null;
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; user?: any }>;
  signIn: (email: string, password: string, isPhone?: boolean) => Promise<{ error: any; user?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { error: null, user: data.user };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: error, user: undefined };
    }
  };

  const signIn = async (email: string, password: string, isPhone: boolean = false) => {
    try {
      if (isPhone) {
        // Use backend API for phone login
        const result = await deliveryAgentAPI.loginWithPhone(email, password);
        
        // Set the session from backend response
        if (result.data?.session) {
          await supabase.auth.setSession({
            access_token: result.data.session.access_token,
            refresh_token: result.data.session.refresh_token,
          });
        }
        
        return { error: null, user: result.data.user };
      } else {
        // Use Supabase client for email login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        return { error: null, user: data.user };
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error, user: undefined };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
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
