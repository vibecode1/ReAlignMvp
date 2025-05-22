const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Get the Supabase URL and key from the environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Please make sure you have SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) defined in your .env file.');
  process.exit(1);
}

// Create a Supabase client with admin permissions
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllUsers() {
  try {
    console.log('Fetching all users from Supabase Auth...');
    
    // Get list of all users - the service key has admin permissions to do this
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }
    
    if (!users || !users.users || users.users.length === 0) {
      console.log('No users found in Supabase Auth.');
      return;
    }
    
    console.log(`Found ${users.users.length} users in Supabase Auth.`);
    
    // Delete each user
    for (const user of users.users) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Error deleting user ${user.email}:`, deleteError);
      } else {
        console.log(`Successfully deleted user: ${user.email}`);
      }
    }
    
    console.log('User deletion complete.');
    
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

// Run the delete function
deleteAllUsers();