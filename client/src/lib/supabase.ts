import { createClient } from '@supabase/supabase-js';

// Import config
import config from '@/config';

// Create Supabase client
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Utility function to get a URL from Supabase Storage
export const getStorageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Handle authentication with magic link
export const handleMagicLinkAuth = async (hash: string) => {
  try {
    // Using the updated method in Supabase client v2
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Magic link auth error:', error);
    return { success: false, error };
  }
};
