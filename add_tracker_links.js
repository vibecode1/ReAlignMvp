import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';

// Read environment variables from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTrackerLinksToExistingTransactions() {
  try {
    console.log('🔍 Finding transactions without tracker links...');
    
    // Get all transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, title, property_address, negotiator_id');
    
    if (transactionsError) {
      throw transactionsError;
    }
    
    console.log(`📋 Found ${transactions.length} total transactions`);
    
    // Check which transactions already have email subscriptions
    const { data: existingSubscriptions, error: subscriptionsError } = await supabase
      .from('email_subscriptions')
      .select('transaction_id');
    
    if (subscriptionsError) {
      throw subscriptionsError;
    }
    
    const transactionsWithLinks = new Set(existingSubscriptions.map(sub => sub.transaction_id));
    const transactionsNeedingLinks = transactions.filter(t => !transactionsWithLinks.has(t.id));
    
    console.log(`✅ ${transactionsWithLinks.size} transactions already have tracker links`);
    console.log(`🔧 ${transactionsNeedingLinks.length} transactions need tracker links`);
    
    if (transactionsNeedingLinks.length === 0) {
      console.log('🎉 All transactions already have tracker links!');
      return;
    }
    
    // Create email subscriptions for transactions that need them
    for (const transaction of transactionsNeedingLinks) {
      console.log(`🔗 Adding tracker link for transaction: ${transaction.title}`);
      
      // Generate a permanent magic link token
      const magicLinkToken = crypto.randomUUID();
      const tokenExpiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
      
      // Create a generic email subscription for the transaction
      // This will serve as the permanent tracker link
      const { error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({
          transaction_id: transaction.id,
          party_email: 'system@realignapp.com', // System email for permanent link
          party_role: 'system',
          magic_link_token: magicLinkToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          is_subscribed: true
        });
      
      if (insertError) {
        console.error(`❌ Error adding tracker link for transaction ${transaction.id}:`, insertError);
      } else {
        console.log(`✅ Added tracker link for: ${transaction.title}`);
        console.log(`   Token: ${magicLinkToken}`);
        console.log(`   URL: ${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/tracker/${transaction.id}?token=${magicLinkToken}`);
      }
    }
    
    console.log('🎉 Finished adding tracker links to existing transactions!');
    
  } catch (error) {
    console.error('❌ Error adding tracker links:', error);
    process.exit(1);
  }
}

// Run the script
addTrackerLinksToExistingTransactions();