import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, isNull, ilike, or, count } from 'drizzle-orm';
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

  // Phase 0 - User Context Profile Methods
  createUserContextProfile(data: any): Promise<any>;
  getUserContextProfile(userId: string, transactionId?: string): Promise<any | undefined>;
  getUserContextProfiles(userId: string): Promise<any[]>;
  updateUserContextProfile(profileId: string, userId: string, data: any): Promise<any>;

  // Phase 0 - Workflow Logging Methods
  logWorkflowEvent(data: any): Promise<any>;
  getWorkflowEvents(filters: any): Promise<any[]>;
  getWorkflowEventsSummary(filters: any): Promise<any>;

  // Phase 0 - UBA Form Data Methods
  createUbaFormData(data: any): Promise<any>;
  getUbaFormData(transactionId: string, userId: string): Promise<any | undefined>;
  updateUbaFormData(formId: string, userId: string, data: any): Promise<any>;
  createUbaDocumentAttachment(data: any): Promise<any>;
  getUbaFormValidationStatus(formId: string, userId: string): Promise<any | undefined>;

  // Add parties to a transaction
  addPartiesToTransaction(transactionId: string, parties: Array<{email: string, name: string, role: string}>): Promise<any>;

  // Get parties for a transaction
  getParties(transactionId: string): Promise<any>;

    // UBA Form Methods
  createUBAForm(data: {
    user_id: string;
    form_data: string;
    completion_percentage: number;
    status: string;
  }): Promise<any>;
  getUBAFormById(id: string): Promise<any | null>;
  getUBAFormsByUserId(userId: string): Promise<any[]>;
  updateUBAForm(id: string, data: {
    form_data?: string;
    completion_percentage?: number;
    status?: string;
  }): Promise<any | null>;

  // TODO: Add other storage methods as needed
  healthCheck(): Promise<{ status: string; timestamp: string }>;
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

  // Phase 0 - User Context Profile Methods
  async createUserContextProfile(data: any) {
    const [profile] = await db
      .insert(schema.user_context_profiles)
      .values(data)
      .returning();
    return profile;
  }

  async getUserContextProfile(userId: string, transactionId?: string) {
    let query = db
      .select()
      .from(schema.user_context_profiles)
      .where(eq(schema.user_context_profiles.user_id, userId));

    if (transactionId) {
      query = query.where(eq(schema.user_context_profiles.transaction_id, transactionId));
    }

    const [profile] = await query;
    return profile;
  }

  async getUserContextProfiles(userId: string) {
    return await db
      .select()
      .from(schema.user_context_profiles)
      .where(eq(schema.user_context_profiles.user_id, userId));
  }

  async updateUserContextProfile(profileId: string, userId: string, data: any) {
    const [profile] = await db
      .update(schema.user_context_profiles)
      .set({ ...data, updated_at: new Date() })
      .where(and(
        eq(schema.user_context_profiles.id, profileId),
        eq(schema.user_context_profiles.user_id, userId)
      ))
      .returning();
    return profile;
  }

  // Phase 0 - Workflow Logging Methods
  async logWorkflowEvent(data: any) {
    try {
      const [event] = await db
        .insert(schema.workflow_events)
        .values(data)
        .returning();
      return event;
    } catch (error) {
      console.error('Workflow logging failed (table may not exist):', error.message);
      return null;
    }
  }

  async getWorkflowEvents(filters: any) {
    let query = db.select().from(schema.workflow_events);

    if (filters.user_id) {
      query = query.where(eq(schema.workflow_events.user_id, filters.user_id));
    }
    if (filters.transaction_id) {
      query = query.where(eq(schema.workflow_events.transaction_id, filters.transaction_id));
    }
    if (filters.event_type) {
      query = query.where(eq(schema.workflow_events.event_type, filters.event_type));
    }
    if (filters.event_category) {
      query = query.where(eq(schema.workflow_events.event_category, filters.event_category));
    }
    if (filters.session_id) {
      query = query.where(eq(schema.workflow_events.session_id, filters.session_id));
    }

    return await query
      .orderBy(desc(schema.workflow_events.timestamp))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
  }

  async getWorkflowEventsSummary(filters: any) {
    const summary = await db
      .select({
        total_events: count(),
        event_types: sql`array_agg(DISTINCT ${schema.workflow_events.event_type})`,
        success_rate: sql`round((sum(case when ${schema.workflow_events.success_indicator} then 1 else 0 end)::decimal / count(*)) * 100, 2)`,
        avg_execution_time: sql`round(avg(${schema.workflow_events.execution_time_ms}), 2)`,
      })
      .from(schema.workflow_events)
      .where(eq(schema.workflow_events.user_id, filters.user_id));

    return summary[0];
  }

  // Phase 0 - UBA Form Data Methods
  async createUbaFormData(data: any) {
    const [form] = await db
      .insert(schema.uba_form_data)
      .values(data)
      .returning();
    return form;
  }

  async getUbaFormData(transactionId: string, userId: string) {
    const [form] = await db
      .select()
      .from(schema.uba_form_data)
      .where(and(
        eq(schema.uba_form_data.transaction_id, transactionId),
        eq(schema.uba_form_data.user_id, userId)
      ));
    return form;
  }

  async updateUbaFormData(formId: string, userId: string, data: any) {
    const [form] = await db
      .update(schema.uba_form_data)
      .set({ ...data, updated_at: new Date() })
      .where(and(
        eq(schema.uba_form_data.id, formId),
        eq(schema.uba_form_data.user_id, userId)
      ))
      .returning();
    return form;
  }

  async createUbaDocumentAttachment(data: any) {
    const [attachment] = await db
      .insert(schema.uba_document_attachments)
      .values(data)
      .returning();
    return attachment;
  }

  async getUbaFormValidationStatus(formId: string, userId: string) {
    const [form] = await db
      .select({
        id: schema.uba_form_data.id,
        form_completion_percentage: schema.uba_form_data.form_completion_percentage,
        last_section_completed: schema.uba_form_data.last_section_completed,
        validation_errors: schema.uba_form_data.validation_errors,
        ai_confidence_scores: schema.uba_form_data.ai_confidence_scores,
      })
      .from(schema.uba_form_data)
      .where(and(
        eq(schema.uba_form_data.id, formId),
        eq(schema.uba_form_data.user_id, userId)
      ));
    return form;
  }

  // Add parties to a transaction
  async addPartiesToTransaction(transactionId: string, parties: Array<{email: string, name: string, role: string}>) {
    try {
      const addedParties = [];

      for (const party of parties) {
        // Check if user exists by email
        let existingUser = await this.getUserByEmail(party.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create new user with party role
          const newUser = await this.createUser({
            id: crypto.randomUUID(),
            email: party.email,
            name: party.name,
            role: party.role as 'buyer' | 'seller' | 'agent' | 'negotiator',
          });

          userId = newUser.id;
          existingUser = newUser;
        }

        // Add party to transaction
        const transactionParty = await this.addParticipant({
          transaction_id: transactionId,
          user_id: userId,
          role_in_transaction: party.role,
          status: 'invited',
        });

        addedParties.push({
          ...transactionParty,
          user: existingUser
        });
      }

      return addedParties;
    } catch (error) {
      console.error('Error adding parties to transaction:', error);
      throw error;
    }
  }

  // Get parties for a transaction
  async getParties(transactionId: string) {
    // Implementation for getParties method
    return null;
  }

    // UBA Form Methods
    async createUBAForm(data: {
        user_id: string;
        form_data: string;
        completion_percentage: number;
        status: string;
    }) {
        try {
            const [result] = await db
                .insert(schema.uba_forms)
                .values({
                    user_id: data.user_id,
                    form_data: data.form_data,
                    completion_percentage: data.completion_percentage,
                    status: data.status,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning({ id: schema.uba_forms.id });

            return result.id;
        } catch (error) {
            console.error('Create UBA form error:', error);
            throw new Error('Failed to create UBA form');
        }
    }

    async getUBAFormById(id: string) {
        try {
            const [form] = await db
                .select()
                .from(schema.uba_forms)
                .where(eq(schema.uba_forms.id, id));

            return form || null;
        } catch (error) {
            console.error('Get UBA form by ID error:', error);
            throw new Error('Failed to get UBA form');
        }
    }

    async getUBAFormsByUserId(userId: string) {
        try {
            const forms = await db
                .select()
                .from(schema.uba_forms)
                .where(eq(schema.uba_forms.user_id, userId))
                .orderBy(desc(schema.uba_forms.updated_at));

            return forms;
        } catch (error) {
            console.error('Get UBA forms by user ID error:', error);
            throw new Error('Failed to get UBA forms');
        }
    }

    async updateUBAForm(id: string, data: {
        form_data?: string;
        completion_percentage?: number;
        status?: string;
    }) {
        try {
            const [result] = await db
                .update(schema.uba_forms)
                .set({
                    ...data,
                    updated_at: new Date()
                })
                .where(eq(schema.uba_forms.id, id))
                .returning({ id: schema.uba_forms.id });

            return result?.id || null;
        } catch (error) {
            console.error('Update UBA form error:', error);
            throw new Error('Failed to update UBA form');
        }
    }

    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        try {
            await db.execute(sql`SELECT 1`);
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Health check failed:', error);
            throw new Error('Database health check failed');
        }
    }
}

export const storage = new DrizzleStorage();