import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly with environment variables
// This avoids issues where config values might not be properly loaded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add console logs to verify VITE_ variables are correctly loaded in the browser
console.log('Frontend Supabase configuration:');
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING!');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'MISSING!');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', { 
    url: supabaseUrl ? 'Set' : 'Missing', 
    key: supabaseAnonKey ? 'Set' : 'Missing' 
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
