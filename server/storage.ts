import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, isNull, ilike, or } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;
import config from './config';
import * as schema from '@shared/schema';
import { supabaseAdmin } from './lib/supabase';
import crypto from 'crypto';
import { NotificationService } from './services/notificationService';



// Initialize PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// Initialize Drizzle ORM
const db = drizzle(pool, { schema });

// Supabase admin client is imported from lib/supabase.ts

// Initialize notification service
const notificationService = new NotificationService();

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;

  // Transaction methods - updated for Tracker MVP
  createTransaction(transaction: schema.InsertTransaction, negotiatorId: string, parties?: { email: string, role: string }[], welcomeEmailBody?: string): Promise<schema.Transaction>;
  getTransactionById(id: string): Promise<schema.Transaction | undefined>;
  getTransactionsByNegotiatorId(negotiatorId: string, page: number, limit: number): Promise<{ data: schema.Transaction[], total: number }>;
  updateTransaction(id: string, data: Partial<schema.InsertTransaction>): Promise<schema.Transaction>;
  updateTransactionPhase(transactionId: string, newPhase: string, negotiatorId: string): Promise<schema.Transaction>;

  // Transaction participant methods
  addParticipant(participant: schema.InsertTransactionParticipant): Promise<schema.TransactionParticipant>;
  getParticipantsByTransactionId(transactionId: string): Promise<schema.TransactionParticipant[]>;
  updateParticipantStatus(transactionId: string, userId: string, status: string, lastAction?: string): Promise<schema.TransactionParticipant>;
  updateParticipantEmailSent(transactionId: string, userId: string, emailSent: boolean): Promise<schema.TransactionParticipant>;

  // Message methods
  createMessage(message: schema.InsertMessage, transactionId: string, senderId: string): Promise<schema.Message>;
  getMessageById(id: string): Promise<schema.Message | undefined>;
  getMessagesByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.Message[], total: number }>;

  // Document request methods - updated for Tracker MVP
  createDocumentRequest(request: schema.InsertDocumentRequest): Promise<schema.DocumentRequest>;
  getDocumentRequestsByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.DocumentRequest[], total: number }>;
  updateDocumentRequestStatus(requestId: string, status: string): Promise<schema.DocumentRequest>;
  deleteDocumentRequest(requestId: string): Promise<void>;

  // Tracker notes methods - new for Tracker MVP  
  createTrackerNote(note: schema.InsertTrackerNote): Promise<schema.TrackerNote>;
  getTrackerNotesByTransactionId(transactionId: string): Promise<schema.TrackerNote[]>;

  // Email subscription methods - new for Tracker MVP
  createEmailSubscription(subscription: schema.InsertEmailSubscription): Promise<schema.EmailSubscription>;
  getEmailSubscriptionsByTransactionId(transactionId: string): Promise<schema.EmailSubscription[]>;
  validateMagicLinkToken(token: string): Promise<{ subscription: schema.EmailSubscription; transaction: schema.Transaction } | null>;
  updateSubscriptionStatus(subscriptionId: string, isSubscribed: boolean): Promise<schema.EmailSubscription>;

  // Transaction phase history methods - new for Tracker MVP
  createPhaseHistoryEntry(entry: schema.InsertTransactionPhaseHistory): Promise<schema.TransactionPhaseHistory>;
  getPhaseHistoryByTransactionId(transactionId: string): Promise<schema.TransactionPhaseHistory[]>;

  // Upload methods
  createUpload(upload: schema.InsertUpload, transactionId: string, userId: string, documentRequestId?: string): Promise<schema.Upload>;
  getUploadsByTransactionId(transactionId: string, userId: string, userRole: string, page: number, limit: number): Promise<{ data: schema.Upload[], total: number }>;
  getUploadById(id: string): Promise<schema.Upload | undefined>;

  // Storage methods
  generateUploadSignedUrl(path: string, contentType: string): Promise<string>;
  updateUploadVisibility(uploadId: string, visibility: string): Promise<schema.Upload>;
  
  // Push notification device token methods
  saveUserDeviceToken(userId: string, token: string, tokenType: string): Promise<schema.UserDeviceToken>;
  getUserDeviceTokens(userId: string): Promise<schema.UserDeviceToken[]>;
  deleteUserDeviceToken(token: string): Promise<void>;
}

class DrizzleStorage implements IStorage {
  // User methods
  async getUserById(id: string): Promise<schema.User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return users[0];
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  // Transaction methods
  async createTransaction(transaction: schema.InsertTransaction, negotiatorId: string, parties?: { email: string, role: string }[], welcomeEmailBody?: string): Promise<schema.Transaction> {
    const result = await db.insert(schema.transactions).values({
      ...transaction,
      negotiator_id: negotiatorId,
      welcome_email_body: welcomeEmailBody,
    }).returning();
    
    // Create email subscriptions for parties if provided
    if (parties && parties.length > 0) {
      // Get negotiator details for email
      const negotiator = await this.getUserById(negotiatorId);
      const negotiatorName = negotiator?.name || 'Your negotiator';
      
      const subscriptions = parties.map(party => ({
        transaction_id: result[0].id,
        party_email: party.email,
        party_role: party.role,
        magic_link_token: crypto.randomUUID(),
        token_expires_at: null, // Permanent links - no expiration
      }));
      
      await db.insert(schema.email_subscriptions).values(subscriptions);
      
      // Send tracker magic link emails to all parties
      for (let i = 0; i < parties.length; i++) {
        const party = parties[i];
        const subscription = subscriptions[i];
        
        // Send tracker magic link email
        await notificationService.sendTrackerMagicLink(
          party.email,
          party.email.split('@')[0], // Use email prefix as name fallback
          party.role,
          transaction.title,
          transaction.property_address,
          negotiatorName,
          subscription.magic_link_token,
          result[0].id
        );
      }
    }
    
    return result[0];
  }

  async getTransactionById(id: string): Promise<any> {
    console.log('=== STORAGE: TRANSACTION FETCH DEBUG ===');
    console.log('Transaction ID Arg:', id);

    // Get the transaction with all related data
    const transaction = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);

    console.log('Raw transaction from DB:', JSON.stringify(transaction, null, 2));

    if (!transaction[0]) {
      console.log('No transaction found with ID:', id);
      return undefined;
    }

    // Get participants with user details
    const participants = await db
      .select({
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.transaction_participants.role_in_transaction,
        status: schema.transaction_participants.status,
        lastAction: schema.transaction_participants.last_action,
        welcome_email_sent: schema.transaction_participants.welcome_email_sent,
      })
      .from(schema.transaction_participants)
      .leftJoin(schema.users, eq(schema.transaction_participants.user_id, schema.users.id))
      .where(eq(schema.transaction_participants.transaction_id, id));

    console.log('Raw participants data from DB/join:', JSON.stringify(participants, null, 2));

    // Return transaction with parties array
    const finalResult = {
      ...transaction[0],
      parties: participants,
    };

    console.log('Final assembled object from storage:', JSON.stringify(finalResult, null, 2));
    console.log('=== END STORAGE DEBUG ===');

    return finalResult;
  }

  async getTransactionsByNegotiatorId(negotiatorId: string, page: number, limit: number): Promise<{ data: schema.Transaction[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Get transactions created by this negotiator
    const data = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.negotiator_id, negotiatorId))
      .orderBy(desc(schema.transactions.created_at))
      .limit(limit)
      .offset(offset);
    
    // Count total transactions for this negotiator
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.transactions)
      .where(eq(schema.transactions.negotiator_id, negotiatorId));
    
    return {
      data,
      total: countResult[0].count,
    };
  }

  async updateTransaction(id: string, data: Partial<schema.InsertTransaction>): Promise<schema.Transaction> {
    const result = await db
      .update(schema.transactions)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(schema.transactions.id, id))
      .returning();
    return result[0];
  }

  async updateTransactionPhase(transactionId: string, newPhase: string, negotiatorId: string): Promise<schema.Transaction> {
    // Update the transaction phase
    const [transaction] = await db
      .update(schema.transactions)
      .set({
        current_phase: newPhase as any,
        updated_at: new Date(),
      })
      .where(eq(schema.transactions.id, transactionId))
      .returning();

    // Record phase change in history
    await db.insert(schema.transaction_phase_history).values({
      transaction_id: transactionId,
      phase_key: newPhase as any,
      set_by_negotiator_id: negotiatorId,
    });

    return transaction;
  }

  // Transaction participant methods
  async addParticipant(participant: schema.InsertTransactionParticipant): Promise<schema.TransactionParticipant> {
    const result = await db
      .insert(schema.transaction_participants)
      .values(participant)
      .returning();
    
    // Update the transaction's updated_at timestamp to invalidate cache
    await db
      .update(schema.transactions)
      .set({ updated_at: new Date() })
      .where(eq(schema.transactions.id, participant.transaction_id));
    
    return result[0];
  }

  async getParticipantsByTransactionId(transactionId: string): Promise<schema.TransactionParticipant[]> {
    return db
      .select()
      .from(schema.transaction_participants)
      .where(eq(schema.transaction_participants.transaction_id, transactionId));
  }

  async updateParticipantStatus(transactionId: string, userId: string, status: string, lastAction?: string): Promise<schema.TransactionParticipant> {
    const result = await db
      .update(schema.transaction_participants)
      .set({
        status: status as any,
        last_action: lastAction,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(schema.transaction_participants.transaction_id, transactionId),
          eq(schema.transaction_participants.user_id, userId)
        )
      )
      .returning();
    
    // Update the transaction's updated_at timestamp to invalidate cache
    await db
      .update(schema.transactions)
      .set({ updated_at: new Date() })
      .where(eq(schema.transactions.id, transactionId));
    
    return result[0];
  }

  async updateParticipantEmailSent(transactionId: string, userId: string, emailSent: boolean): Promise<schema.TransactionParticipant> {
    const result = await db
      .update(schema.transaction_participants)
      .set({
        welcome_email_sent: emailSent,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(schema.transaction_participants.transaction_id, transactionId),
          eq(schema.transaction_participants.user_id, userId)
        )
      )
      .returning();
    
    // Update the transaction's updated_at timestamp to invalidate cache
    await db
      .update(schema.transactions)
      .set({ updated_at: new Date() })
      .where(eq(schema.transactions.id, transactionId));
    
    return result[0];
  }

  // Message methods
  async createMessage(message: schema.InsertMessage, transactionId: string, senderId: string): Promise<schema.Message> {
    const result = await db
      .insert(schema.messages)
      .values({
        ...message,
        transaction_id: transactionId,
        sender_id: senderId,
      })
      .returning();
    return result[0];
  }
  
  async getMessageById(id: string): Promise<schema.Message | undefined> {
    const messages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, id));
    return messages[0];
  }

  async getMessagesByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.Message[], total: number }> {
    const offset = (page - 1) * limit;
    
    const data = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.transaction_id, transactionId))
      .orderBy(desc(schema.messages.created_at))
      .limit(limit)
      .offset(offset);
    
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.messages)
      .where(eq(schema.messages.transaction_id, transactionId));
    
    const total = countResult[0]?.count || 0;
    
    return { data, total };
  }

  // Document request methods - updated for Tracker MVP
  async createDocumentRequest(request: schema.InsertDocumentRequest): Promise<schema.DocumentRequest> {
    const result = await db.insert(schema.document_requests).values(request).returning();
    return result[0];
  }

  async getDocumentRequestsByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.DocumentRequest[], total: number }> {
    const offset = (page - 1) * limit;
    
    const data = await db
      .select()
      .from(schema.document_requests)
      .where(eq(schema.document_requests.transaction_id, transactionId))
      .orderBy(desc(schema.document_requests.requested_at))
      .limit(limit)
      .offset(offset);
    
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.document_requests)
      .where(eq(schema.document_requests.transaction_id, transactionId));
    
    const total = countResult[0]?.count || 0;
    
    return { data, total };
  }

  async updateDocumentRequestStatus(requestId: string, status: string): Promise<schema.DocumentRequest> {
    const updateData: any = {
      status: status as any,
    };
    
    // Set completed_at timestamp if status is complete
    if (status === 'complete') {
      updateData.completed_at = new Date();
    }
    
    const result = await db
      .update(schema.document_requests)
      .set(updateData)
      .where(eq(schema.document_requests.id, requestId))
      .returning();
    return result[0];
  }

  async deleteDocumentRequest(requestId: string): Promise<void> {
    await db.delete(schema.document_requests).where(eq(schema.document_requests.id, requestId));
  }

  // Upload methods
  async createUpload(upload: schema.InsertUpload, transactionId: string, userId: string, documentRequestId?: string): Promise<schema.Upload> {
    const result = await db
      .insert(schema.uploads)
      .values({
        ...upload,
        uploaded_by_user_id: userId,
        document_request_id: documentRequestId,
      })
      .returning();
    return result[0];
  }

  async getUploadsByTransactionId(transactionId: string, userId: string, userRole: string, page: number, limit: number): Promise<{ data: schema.Upload[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Build where conditions based on user role
    let whereConditions;
    if (userRole === 'negotiator') {
      // Negotiators can see all uploads for the transaction
      whereConditions = eq(schema.uploads.transaction_id, transactionId);
    } else {
      // Other roles can see their own private uploads and all shared uploads
      whereConditions = and(
        eq(schema.uploads.transaction_id, transactionId),
        or(
          eq(schema.uploads.uploaded_by_user_id, userId),
          eq(schema.uploads.visibility, 'shared')
        )
      );
    }
    
    const data = await db
      .select()
      .from(schema.uploads)
      .where(whereConditions)
      .orderBy(desc(schema.uploads.uploaded_at))
      .limit(limit)
      .offset(offset);
    
    // Count total uploads with same filters
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.uploads)
      .where(whereConditions);
    const total = countResult[0]?.count || 0;
    
    return { data, total };
  }

  async getUploadById(id: string): Promise<schema.Upload | undefined> {
    const uploads = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.id, id));
    return uploads[0];
  }

  // Storage methods
  async generateUploadSignedUrl(path: string, contentType: string): Promise<string> {
    // Generate a signed URL for uploading a file to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .createSignedUploadUrl(path);
    
    if (error) {
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }

  async updateUploadVisibility(uploadId: string, visibility: string): Promise<schema.Upload> {
    const result = await db
      .update(schema.uploads)
      .set({ visibility: visibility as any })
      .where(eq(schema.uploads.id, uploadId))
      .returning();
    return result[0];
  }

  // Push notification device token methods
  async saveUserDeviceToken(userId: string, token: string, tokenType: string): Promise<schema.UserDeviceToken> {
    try {
      // First check if token already exists
      const existingTokens = await db
        .select()
        .from(schema.user_device_tokens)
        .where(eq(schema.user_device_tokens.device_token, token));

      // If token exists, return it
      if (existingTokens.length > 0) {
        return existingTokens[0];
      }

      // Otherwise insert new token
      const result = await db
        .insert(schema.user_device_tokens)
        .values({
          user_id: userId,
          device_token: token,
          token_type: tokenType as any // Type assertion to handle enum
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error saving device token:', error);
      throw error;
    }
  }

  async getUserDeviceTokens(userId: string): Promise<schema.UserDeviceToken[]> {
    try {
      const tokens = await db
        .select()
        .from(schema.user_device_tokens)
        .where(eq(schema.user_device_tokens.user_id, userId));

      return tokens;
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      throw error;
    }
  }

  async deleteUserDeviceToken(token: string): Promise<void> {
    try {
      await db
        .delete(schema.user_device_tokens)
        .where(eq(schema.user_device_tokens.device_token, token));
    } catch (error) {
      console.error('Error deleting device token:', error);
      throw error;
    }
  }

  // Tracker notes methods - new for Tracker MVP
  async createTrackerNote(note: schema.InsertTrackerNote): Promise<schema.TrackerNote> {
    const result = await db.insert(schema.tracker_notes).values(note).returning();
    return result[0];
  }

  async getTrackerNotesByTransactionId(transactionId: string): Promise<schema.TrackerNote[]> {
    return await db
      .select()
      .from(schema.tracker_notes)
      .where(eq(schema.tracker_notes.transaction_id, transactionId))
      .orderBy(desc(schema.tracker_notes.created_at));
  }

  // Email subscription methods - new for Tracker MVP
  async createEmailSubscription(subscription: schema.InsertEmailSubscription): Promise<schema.EmailSubscription> {
    const result = await db.insert(schema.email_subscriptions).values(subscription).returning();
    return result[0];
  }

  async getEmailSubscriptionsByTransactionId(transactionId: string): Promise<schema.EmailSubscription[]> {
    // If empty string is passed, return all active subscriptions for weekly digest
    if (transactionId === '') {
      return await db
        .select()
        .from(schema.email_subscriptions)
        .where(eq(schema.email_subscriptions.is_subscribed, true));
    }
    
    return await db
      .select()
      .from(schema.email_subscriptions)
      .where(eq(schema.email_subscriptions.transaction_id, transactionId));
  }

  async validateMagicLinkToken(token: string): Promise<{ subscription: schema.EmailSubscription; transaction: schema.Transaction } | null> {
    const result = await db
      .select({
        subscription: schema.email_subscriptions,
        transaction: schema.transactions,
      })
      .from(schema.email_subscriptions)
      .innerJoin(schema.transactions, eq(schema.email_subscriptions.transaction_id, schema.transactions.id))
      .where(
        and(
          eq(schema.email_subscriptions.magic_link_token, token),
          // Check if token is permanent (no expiration) or still valid
          or(
            isNull(schema.email_subscriptions.token_expires_at),
            sql`${schema.email_subscriptions.token_expires_at} > NOW()`
          )
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async updateSubscriptionStatus(subscriptionId: string, isSubscribed: boolean): Promise<schema.EmailSubscription> {
    const result = await db
      .update(schema.email_subscriptions)
      .set({ is_subscribed: isSubscribed })
      .where(eq(schema.email_subscriptions.id, subscriptionId))
      .returning();
    return result[0];
  }

  // Transaction phase history methods - new for Tracker MVP
  async createPhaseHistoryEntry(entry: schema.InsertTransactionPhaseHistory): Promise<schema.TransactionPhaseHistory> {
    const result = await db.insert(schema.transaction_phase_history).values(entry).returning();
    return result[0];
  }

  async getPhaseHistoryByTransactionId(transactionId: string): Promise<schema.TransactionPhaseHistory[]> {
    return await db
      .select()
      .from(schema.transaction_phase_history)
      .where(eq(schema.transaction_phase_history.transaction_id, transactionId))
      .orderBy(desc(schema.transaction_phase_history.timestamp));
  }
}

export const storage = new DrizzleStorage();
