import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

// Types
type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
  signIn: (email: string, password: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type UserInfo = {
  id: string;
  email: string;
  name: string;
  role: string;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('AuthContext: Starting session check');
        setIsLoading(true);
        
        // Check for post-auth redirect flag in localStorage
        const postAuthRedirect = localStorage.getItem('realign_post_auth_redirect');
        const registrationSuccess = sessionStorage.getItem('realign_registration_success');
        
        if (postAuthRedirect) {
          console.log('AuthContext: Found post-auth redirect flag:', postAuthRedirect);
          localStorage.removeItem('realign_post_auth_redirect');
        }
        
        if (registrationSuccess) {
          console.log('AuthContext: Found registration success flag in sessionStorage');
          sessionStorage.removeItem('realign_registration_success');
        }
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Session check result:', session ? 'Session exists' : 'No session found');
        
        if (error) {
          console.error('AuthContext: Session check error:', error);
          throw error;
        }
        
        // Check for auth token in localStorage as fallback
        const storedToken = localStorage.getItem('realign_token');
        let sessionExists = !!session;
        
        if (!sessionExists && storedToken) {
          console.log('AuthContext: No Supabase session but found token in localStorage, length:', storedToken.length);
          try {
            // Try to set the session with the stored token
            const sessionResult = await supabase.auth.setSession({
              access_token: storedToken,
              refresh_token: '',
            });
            
            if (sessionResult.data.session) {
              console.log('AuthContext: Successfully set Supabase session from localStorage token');
              sessionExists = true;
            } else {
              console.log('AuthContext: Failed to set session from token, no error but no session returned');
            }
          } catch (tokenError) {
            console.error('AuthContext: Failed to set session from localStorage token:', tokenError);
          }
        }
        
        // This is critical - we need to determine authentication status before turning off isLoading
        let authStatus = false;
        
        if (sessionExists || storedToken) {
          console.log('AuthContext: Valid session or token found, fetching user info');
          // Session exists, fetch user info from our API
          try {
            console.log('AuthContext: Calling /api/v1/auth/me endpoint with token available:', !!storedToken);
            const userData = await apiRequest('GET', '/api/v1/auth/me');
            const userInfo = await userData.json();
            console.log('AuthContext: User info fetched successfully:', userInfo.email);
            
            setUser(userInfo);
            setIsAuthenticated(true);
            authStatus = true;
          } catch (apiError) {
            console.error('AuthContext: Failed to get user info:', apiError);
            // Clear auth state on failure
            localStorage.removeItem('realign_token');
            localStorage.removeItem('realign_user');
            await supabase.auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
            authStatus = false;
          }
        } else {
          console.log('AuthContext: No valid session or token found');
          setUser(null);
          setIsAuthenticated(false);
          authStatus = false;
        }
        
        console.log('AuthContext: Final authentication status determination:', authStatus);
      } catch (error) {
        console.error('AuthContext: Session check error:', error);
        toast({
          title: "Authentication Error",
          description: "There was a problem with your authentication. Please try again.",
          variant: "destructive",
        });
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('AuthContext: Session check completed, isAuthenticated =', isAuthenticated);
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change event:', event, 'Session:', session ? 'exists' : 'null');
      
      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('AuthContext: Processing SIGNED_IN event');
          const userData = await apiRequest('GET', '/api/v1/auth/me');
          const userInfo = await userData.json();
          console.log('AuthContext: User info fetched after sign in:', userInfo.email);
          
          setUser(userInfo);
          setIsAuthenticated(true);
          console.log('AuthContext: Authentication state updated to authenticated');
        } catch (error) {
          console.error('AuthContext: Failed to get user info after sign in:', error);
          await supabase.auth.signOut();
          toast({
            title: "Authentication Error",
            description: "There was a problem with your account. Please try again.",
            variant: "destructive",
          });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthContext: Processing SIGNED_OUT event');
        setUser(null);
        setIsAuthenticated(false);
        // Clear query cache on logout
        queryClient.clear();
        console.log('AuthContext: User signed out, authentication state cleared');
      } else {
        console.log('AuthContext: Unhandled auth event:', event);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast, queryClient]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Use our API for login
      const response = await apiRequest('POST', '/api/v1/auth/login', { email, password });
      const data = await response.json();
      
      // Set session with Supabase
      await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: '',
      });
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Request magic link
  const requestMagicLink = async (email: string) => {
    try {
      setIsLoading(true);
      
      // Use our API for magic link
      await apiRequest('POST', '/api/v1/auth/magic-link', { email });
      
      toast({
        title: "Magic Link Sent",
        description: "Please check your email for the login link.",
      });
    } catch (error) {
      console.error('Magic link request error:', error);
      toast({
        title: "Magic Link Failed",
        description: "Unable to send magic link. Please verify your email or try again later.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      // Clear query cache on logout
      queryClient.clear();
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        signIn,
        requestMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
