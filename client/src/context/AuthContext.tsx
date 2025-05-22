import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient'; // Ensure this correctly uses stored token
import { supabase } from '@/lib/supabase';

// Types
type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
  signIn: (email: string, password: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>; // Added for explicit re-check if needed
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

  const clearRegistrationFlags = useCallback(() => {
    if (sessionStorage.getItem('realign_registration_success')) {
      console.log('AuthContext: Clearing registration sessionStorage flags.');
      sessionStorage.removeItem('realign_registration_success');
      sessionStorage.removeItem('realign_new_user_email');
    }
  }, []);

  const performFullSignOut = useCallback(async (logMessage: string) => {
    console.log(`AuthContext: ${logMessage}. Performing full sign out.`);
    
    try {
      // Only try to sign out if we're not already at the login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register-negotiator') {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error during Supabase sign out:', error);
    }
    
    // Clear all stored tokens and state
    localStorage.removeItem('realign_token');
    localStorage.removeItem('realign_refresh_token');
    localStorage.removeItem('realign_user');
    
    // Reset React state
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear(); // Clear react-query cache
    
    clearRegistrationFlags();
    
    // Special handling for registration flow - if we're in the middle of registering
    // or just completed registration, don't navigate away
    if (window.location.pathname !== '/register-negotiator' && 
        !sessionStorage.getItem('realign_registration_success')) {
      console.log('Sign out complete, redirecting to login page');
    }
  }, [queryClient, clearRegistrationFlags]);


  const checkAuthStatus = useCallback(async () => {
    const registrationFlowDetected = !!sessionStorage.getItem('realign_registration_success');
    console.log('AuthContext: checkAuthStatus called. Registration flow initially detected:', registrationFlowDetected);
    setIsLoading(true);

    try {
      const postAuthRedirect = localStorage.getItem('realign_post_auth_redirect');
      if (postAuthRedirect) {
        console.log('AuthContext: Found post-auth redirect flag:', postAuthRedirect);
        localStorage.removeItem('realign_post_auth_redirect');
      }

      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('AuthContext: Initial Supabase session check:', session ? `Session for ${session.user.email}` : 'No session', 'Error:', sessionError);

      if (sessionError) {
        console.error('AuthContext: Supabase getSession error:', sessionError);
        // Don't throw, attempt recovery with stored token if possible
      }

      const storedToken = localStorage.getItem('realign_token');
      console.log('AuthContext: Stored token in localStorage:', storedToken ? `Token exists (len: ${storedToken.length})` : 'No token');

      if (!session && storedToken) {
        console.log('AuthContext: No Supabase session, but found token. Attempting to set session.');
        const { data: newSessionData, error: setError } = await supabase.auth.setSession({
          access_token: storedToken,
          refresh_token: localStorage.getItem('realign_refresh_token') || '', // Store and use refresh token if available
        });

        if (setError) {
          console.error('AuthContext: Error setting session from stored token:', setError);
          await performFullSignOut('Error setting session from token');
          setIsLoading(false);
          return;
        }
        if (newSessionData.session) {
          console.log('AuthContext: Successfully set Supabase session from localStorage token.');
          session = newSessionData.session;
        } else {
          console.log('AuthContext: supabase.auth.setSession did not return a session. Token might be invalid.');
          await performFullSignOut('setSession with stored token failed');
          setIsLoading(false);
          return;
        }
      }

      if (session) {
        console.log(`AuthContext: Session active for ${session.user.email}. Fetching user info from /api/v1/auth/me.`);
        // Ensure the token in localStorage matches the session token, or update it.
        // This is important if onAuthStateChange refreshed the token.
        if (localStorage.getItem('realign_token') !== session.access_token) {
            console.log('AuthContext: Updating localStorage token to match current session token.');
            localStorage.setItem('realign_token', session.access_token);
            if (session.refresh_token) {
                localStorage.setItem('realign_refresh_token', session.refresh_token);
            }
        }

        try {
          // apiRequest should automatically use the token from localStorage or an auth header
          const userResponse = await apiRequest('GET', '/api/v1/auth/me');
          const userInfo: UserInfo = await userResponse.json(); // Assuming apiRequest returns a Response object

          if (!userResponse.ok) {
            console.error('AuthContext: /api/v1/auth/me call failed:', userResponse.status, userInfo);
            throw new Error((userInfo as any).message || `Failed to fetch user details: ${userResponse.status}`);
          }

          console.log('AuthContext: User info fetched successfully from /me:', userInfo.email);
          setUser(userInfo);
          setIsAuthenticated(true);
          clearRegistrationFlags(); // Clear flags on successful authentication
        } catch (apiError) {
          console.error('AuthContext: Failed to get user info from /me:', apiError);
          await performFullSignOut(`API /me call failed: ${apiError}`);
        }
      } else {
        console.log('AuthContext: No active session after all checks.');
        await performFullSignOut('No active session found');
      }
    } catch (error) {
      console.error('AuthContext: Major error in checkAuthStatus:', error);
      await performFullSignOut(`Critical error in checkAuthStatus: ${error}`);
    } finally {
      console.log('AuthContext: checkAuthStatus finished. Current isAuthenticated state:', isAuthenticated); // Log current state, not the one being set
      setIsLoading(false);
      console.log('AuthContext: setIsLoading(false) executed.');
    }
  }, [performFullSignOut, clearRegistrationFlags, isAuthenticated]); // Added isAuthenticated to log its value in finally

  useEffect(() => {
    checkAuthStatus(); // Initial check

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthContext: onAuthStateChange event: ${event}`, session ? `Session for ${session.user.email}` : 'No session');
      setIsLoading(true); // Always set loading true at the start of handling an event

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED': // Treat token refresh like a sign-in for re-verification
        case 'USER_UPDATED': // User metadata might have changed, re-verify
          if (session) {
            console.log(`AuthContext: Event ${event}. Session present. Verifying with /api/v1/auth/me.`);
            localStorage.setItem('realign_token', session.access_token);
            if (session.refresh_token) {
              localStorage.setItem('realign_refresh_token', session.refresh_token);
            }
            try {
              const userResponse = await apiRequest('GET', '/api/v1/auth/me');
              const userInfo: UserInfo = await userResponse.json();

              if (!userResponse.ok) {
                 console.error(`AuthContext: /api/v1/auth/me call failed after ${event}:`, userResponse.status, userInfo);
                throw new Error((userInfo as any).message || `Failed to fetch user details after ${event}: ${userResponse.status}`);
              }
              
              console.log(`AuthContext: User info fetched successfully after ${event}:`, userInfo.email);
              setUser(userInfo);
              setIsAuthenticated(true);
              clearRegistrationFlags(); // Clear flags on any successful auth event
            } catch (error) {
              console.error(`AuthContext: Error processing ${event} event:`, error);
              await performFullSignOut(`Error during ${event}: ${error}`);
            }
          } else {
             console.warn(`AuthContext: ${event} event received but no session object. Signing out.`);
             await performFullSignOut(`${event} with no session`);
          }
          break;
        case 'SIGNED_OUT':
          console.log('AuthContext: SIGNED_OUT event.');
          await performFullSignOut('SIGNED_OUT event received');
          break;
        case 'PASSWORD_RECOVERY':
          console.log('AuthContext: PASSWORD_RECOVERY event. User may need to sign in again after reset.');
          // No state change here, user needs to complete recovery and sign in.
          break;
        case 'USER_DELETED':
            console.log('AuthContext: USER_DELETED event.');
            await performFullSignOut('USER_DELETED event received');
            break;
        default:
          console.log('AuthContext: Unhandled auth event:', event);
      }
      setIsLoading(false);
      console.log(`AuthContext: onAuthStateChange event ${event} processed. setIsLoading(false) executed.`);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [checkAuthStatus, performFullSignOut, clearRegistrationFlags]);


  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Attempting sign in via /api/v1/auth/login');
      const response = await apiRequest('POST', '/api/v1/auth/login', { email, password });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login API call failed');
      }
      
      console.log('AuthContext: Login API success. Setting Supabase session.');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.refresh_token || '', // Ensure your API returns refresh_token if used
      });

      if (sessionError) {
        console.error('AuthContext: Error setting Supabase session after login:', sessionError);
        throw sessionError; // Or handle more gracefully
      }
      
      // The onAuthStateChange listener should pick up 'SIGNED_IN'
      // but we can optimistically update state here or rely on checkAuthStatus/onAuthStateChange
      // For now, let onAuthStateChange handle the final state update after /me call.
      // However, it's good to store token immediately.
      localStorage.setItem('realign_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('realign_refresh_token', data.refresh_token);
      }
      // Manually trigger a re-check to ensure state is updated based on new session
      await checkAuthStatus(); 

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      await performFullSignOut(`Login failed: ${error.message}`);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestMagicLink = async (email: string) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/v1/auth/magic-link', { email });
      toast({
        title: "Magic Link Sent",
        description: "Please check your email for the login link.",
      });
    } catch (error: any) {
      console.error('AuthContext: Magic link request error:', error);
      toast({
        title: "Magic Link Failed",
        description: error.message || "Unable to send magic link. Please verify your email or try again later.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await performFullSignOut('User initiated sign out');
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('AuthContext: Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "There was an issue signing you out. Please try again.",
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
        checkAuthStatus,
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
