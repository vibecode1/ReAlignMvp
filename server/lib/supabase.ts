import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Validate that service role key exists
if (!config.supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for backend operations');
}

// Admin client for token validation and admin operations
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth client for user-facing operations (signup, login)
export const supabaseAuthClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

console.log('Supabase clients initialized:');
console.log('  Admin client URL:', config.supabaseUrl);
console.log('  Auth client URL:', config.supabaseUrl);