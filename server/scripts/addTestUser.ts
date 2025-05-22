
import { createClient } from '@supabase/supabase-js';
import config from '../config';
import { storage } from '../storage';
import { addDays } from 'date-fns';

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

async function createTestUser() {
  try {
    const email = 'test@1234.com';
    const password = 'test1234';
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'negotiator',
        }
      }
    });

    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError);
      return;
    }

    console.log('User created in Supabase Auth:', authData.user?.id);

    // Calculate trial end date (30 days from now)
    const trialEndsAt = addDays(new Date(), 30);

    // Create user in our database
    const userId = authData.user?.id;
    if (!userId) {
      console.error('No user ID returned from Supabase');
      return;
    }

    // Insert the user into our database
    await storage.createUser({
      id: userId,
      name: 'Test User',
      email,
      role: 'negotiator',
      trial_ends_at: trialEndsAt,
    });

    console.log('Test user created successfully!');
    console.log({
      email: 'test@1234.com',
      password: 'test1234'
    });

  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
