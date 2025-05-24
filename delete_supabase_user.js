// Script to delete user from Supabase Auth
import { createClient } from '@supabase/supabase-js';

async function deleteSupabaseUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get user by email first
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === 'rkilburn@gmail.com');
    
    if (user) {
      console.log('Found user:', user.id);
      
      // Delete the user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
      } else {
        console.log('Successfully deleted user from Supabase Auth');
      }
    } else {
      console.log('User not found in Supabase Auth');
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

deleteSupabaseUser();