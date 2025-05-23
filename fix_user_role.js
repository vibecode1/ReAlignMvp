// Quick fix for user role issue
import { supabaseAdmin } from './server/lib/supabase.js';

async function fixUserRole() {
  try {
    console.log('Fixing app_metadata for user rkilburn@gmail.com...');
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      'ab9ea53b-c16d-4eb6-bdeb-76d95632f645',
      { 
        app_metadata: { 
          role: 'negotiator', 
          name: 'Ross Kilburn'
        } 
      }
    );
    
    if (error) {
      console.error('Error updating user:', error);
    } else {
      console.log('Successfully updated user app_metadata:', data);
    }
  } catch (err) {
    console.error('Failed to update user:', err);
  }
}

fixUserRole();