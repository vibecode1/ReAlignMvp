import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, isNull, ilike, or } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;
import config from './config';
import * as schema from '@shared/schema';
import { createClient } from '@supabase/supabase-js';



// Initialize PostgreSQL client pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// Initialize Drizzle ORM
const db = drizzle(pool, { schema });

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;

  // Transaction methods
  createTransaction(transaction: schema.InsertTransaction, userId: string): Promise<schema.Transaction>;
  getTransactionById(id: string): Promise<schema.Transaction | undefined>;
  getTransactionsByUserId(userId: string, page: number, limit: number): Promise<{ data: schema.Transaction[], total: number }>;
  updateTransaction(id: string, data: Partial<schema.InsertTransaction>): Promise<schema.Transaction>;

  // Transaction participant methods
  addParticipant(participant: schema.InsertTransactionParticipant): Promise<schema.TransactionParticipant>;
  getParticipantsByTransactionId(transactionId: string): Promise<schema.TransactionParticipant[]>;
  updateParticipantStatus(transactionId: string, userId: string, status: string, lastAction?: string): Promise<schema.TransactionParticipant>;

  // Message methods
  createMessage(message: schema.InsertMessage, transactionId: string, senderId: string): Promise<schema.Message>;
  getMessageById(id: string): Promise<schema.Message | undefined>;
  getMessagesByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.Message[], total: number }>;

  // Document request methods
  createDocumentRequest(request: schema.InsertDocumentRequest, transactionId: string): Promise<schema.DocumentRequest>;
  getDocumentRequestsByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.DocumentRequest[], total: number }>;
  updateDocumentRequestStatus(requestId: string, status: string, revisionNote?: string): Promise<schema.DocumentRequest>;

  // Upload methods
  createUpload(upload: schema.InsertUpload, transactionId: string, userId: string, documentRequestId?: string): Promise<schema.Upload>;
  getUploadsByTransactionId(transactionId: string, userId: string, userRole: string, page: number, limit: number): Promise<{ data: schema.Upload[], total: number }>;
  getUploadById(id: string): Promise<schema.Upload | undefined>;

  // Storage methods
  generateUploadSignedUrl(path: string, contentType: string): Promise<string>;
  
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
  async createTransaction(transaction: schema.InsertTransaction, userId: string): Promise<schema.Transaction> {
    const result = await db.insert(schema.transactions).values({
      ...transaction,
      created_by: userId,
    }).returning();
    return result[0];
  }

  async getTransactionById(id: string): Promise<schema.Transaction | undefined> {
    const transactions = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id));
    return transactions[0];
  }

  async getTransactionsByUserId(userId: string, page: number, limit: number): Promise<{ data: schema.Transaction[], total: number }> {
    const offset = (page - 1) * limit;
    
    // Get transactions created by this user (if negotiator) or where user is a participant
    const query = db
      .selectDistinct()
      .from(schema.transactions)
      .leftJoin(
        schema.transaction_participants,
        eq(schema.transactions.id, schema.transaction_participants.transaction_id)
      )
      .where(
        or(
          eq(schema.transactions.created_by, userId),
          eq(schema.transaction_participants.user_id, userId)
        )
      )
      .orderBy(desc(schema.transactions.created_at))
      .limit(limit)
      .offset(offset);
    
    const data = await query;
    
    // Count total transactions
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${schema.transactions.id})` })
      .from(schema.transactions)
      .leftJoin(
        schema.transaction_participants,
        eq(schema.transactions.id, schema.transaction_participants.transaction_id)
      )
      .where(
        or(
          eq(schema.transactions.created_by, userId),
          eq(schema.transaction_participants.user_id, userId)
        )
      );
    
    const total = countResult[0]?.count || 0;
    
    // Format the result to only include transaction data
    const transactions = data.map(row => row.transactions);
    
    return { data: transactions, total };
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

  // Transaction participant methods
  async addParticipant(participant: schema.InsertTransactionParticipant): Promise<schema.TransactionParticipant> {
    const result = await db
      .insert(schema.transaction_participants)
      .values(participant)
      .returning();
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
        last_updated: new Date(),
      })
      .where(
        and(
          eq(schema.transaction_participants.transaction_id, transactionId),
          eq(schema.transaction_participants.user_id, userId)
        )
      )
      .returning();
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

  // Document request methods
  async createDocumentRequest(request: schema.InsertDocumentRequest, transactionId: string): Promise<schema.DocumentRequest> {
    const result = await db
      .insert(schema.document_requests)
      .values({
        ...request,
        transaction_id: transactionId,
      })
      .returning();
    return result[0];
  }

  async getDocumentRequestsByTransactionId(transactionId: string, page: number, limit: number): Promise<{ data: schema.DocumentRequest[], total: number }> {
    const offset = (page - 1) * limit;
    
    const data = await db
      .select()
      .from(schema.document_requests)
      .where(eq(schema.document_requests.transaction_id, transactionId))
      .orderBy(desc(schema.document_requests.created_at))
      .limit(limit)
      .offset(offset);
    
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.document_requests)
      .where(eq(schema.document_requests.transaction_id, transactionId));
    
    const total = countResult[0]?.count || 0;
    
    return { data, total };
  }

  async updateDocumentRequestStatus(requestId: string, status: string, revisionNote?: string): Promise<schema.DocumentRequest> {
    const updateData: any = {
      status: status as any,
      updated_at: new Date(),
    };
    
    if (revisionNote !== undefined) {
      updateData.revision_note = revisionNote;
    }
    
    const result = await db
      .update(schema.document_requests)
      .set(updateData)
      .where(eq(schema.document_requests.id, requestId))
      .returning();
    return result[0];
  }

  // Upload methods
  async createUpload(upload: schema.InsertUpload, transactionId: string, userId: string, documentRequestId?: string): Promise<schema.Upload> {
    const result = await db
      .insert(schema.uploads)
      .values({
        ...upload,
        transaction_id: transactionId,
        uploaded_by: userId,
        document_request_id: documentRequestId,
      })
      .returning();
    return result[0];
  }

  async getUploadsByTransactionId(transactionId: string, userId: string, userRole: string, page: number, limit: number): Promise<{ data: schema.Upload[], total: number }> {
    const offset = (page - 1) * limit;
    
    let query = db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.transaction_id, transactionId));
    
    // Filter by visibility permissions
    // Negotiators can see all uploads
    // Other roles can see their own private uploads and all shared uploads
    if (userRole !== 'negotiator') {
      query = query.where(
        or(
          eq(schema.uploads.uploaded_by, userId),
          eq(schema.uploads.visibility, 'shared')
        )
      );
    }
    
    const data = await query
      .orderBy(desc(schema.uploads.uploaded_at))
      .limit(limit)
      .offset(offset);
    
    // Count total uploads with same filters
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.uploads)
      .where(eq(schema.uploads.transaction_id, transactionId));
    
    if (userRole !== 'negotiator') {
      countQuery = countQuery.where(
        or(
          eq(schema.uploads.uploaded_by, userId),
          eq(schema.uploads.visibility, 'shared')
        )
      );
    }
    
    const countResult = await countQuery;
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
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUploadUrl(path, {
        contentType,
        expiresIn: 300, // 5 minutes
      });
    
    if (error) {
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
    
    return data.signedUrl;
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
}

export const storage = new DrizzleStorage();
