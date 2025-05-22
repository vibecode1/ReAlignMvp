import { createClient } from '@supabase/supabase-js';

// Helper function to clear all authentication data
export const useClearAuth = () => {
  const clearAllAuthData = async () => {
    console.log('Clearing all authentication data...');
    
    try {
      // 1. Clear localStorage
      localStorage.removeItem('realign_token');
      localStorage.removeItem('realign_refresh_token');
      localStorage.removeItem('realign_user');
      localStorage.removeItem('realign_post_auth_redirect');
      
      // 2. Clear sessionStorage
      sessionStorage.removeItem('realign_registration_success');
      sessionStorage.removeItem('realign_new_user_email');
      sessionStorage.removeItem('realign_just_registered');
      
      // 3. Try to sign out of Supabase if loaded
      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || '',
          import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        );
        
        await supabase.auth.signOut();
        console.log('Successfully signed out of Supabase');
      } catch (error) {
        console.error('Error signing out of Supabase:', error);
      }
      
      // 4. Clear location hash (if any)
      if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
      }
      
      console.log('Authentication data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing authentication data:', error);
      return false;
    }
  };

  return { clearAllAuthData };
};