import { Router, Request, Response } from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { email_subscriptions, transactions, transaction_phase_history } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../shared/schema';

// Initialize database connection (same as storage.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

const db = drizzle(pool, { schema });

const router = Router();

/**
 * Public transaction access via magic link
 * GET /api/public/transaction/:transactionId?token=xyz
 */
router.get('/transaction/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { token } = req.query;

    // Validate required parameters
    if (!token) {
      return res.status(400).json({ 
        error: 'Missing token parameter' 
      });
    }

    if (!transactionId) {
      return res.status(400).json({ 
        error: 'Missing transaction ID' 
      });
    }

    // Validate magic token exists for this transaction
    const subscription = await db
      .select()
      .from(email_subscriptions)
      .where(
        and(
          eq(email_subscriptions.transaction_id, transactionId),
          eq(email_subscriptions.magic_link_token, token as string)
        )
      )
      .limit(1);

    if (subscription.length === 0) {
      return res.status(403).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if token has expired (if expiration is set)
    const sub = subscription[0];
    if (sub.token_expires_at && new Date() > sub.token_expires_at) {
      return res.status(403).json({ 
        error: 'Token has expired' 
      });
    }

    // Check if subscription is still active
    if (!sub.is_subscribed) {
      return res.status(403).json({ 
        error: 'Subscription is no longer active' 
      });
    }

    // Fetch transaction details
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (transaction.length === 0) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    // Fetch transaction phase history
    const phaseHistory = await db
      .select()
      .from(transaction_phase_history)
      .where(eq(transaction_phase_history.transaction_id, transactionId))
      .orderBy(transaction_phase_history.timestamp);

    // Return transaction data with phase history
    return res.json({
      transaction: transaction[0],
      phase_history: phaseHistory,
      access_info: {
        party_email: sub.party_email,
        party_role: sub.party_role,
        access_granted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in public transaction route:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;