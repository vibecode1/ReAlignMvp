import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function to get a URL from Supabase Storage
export const getStorageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Handle authentication with magic link
export const handleMagicLinkAuth = async (hash: string) => {
  try {
    const { data, error } = await supabase.auth.getSessionFromUrl({
      staleTime: Infinity,
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Magic link auth error:', error);
    return { success: false, error };
  }
};
