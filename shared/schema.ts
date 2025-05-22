import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for database constraints
export const userRoleEnum = pgEnum('user_role', ['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']);
export const transactionPhaseEnum = pgEnum('transaction_phase', [
  'Transaction Initiated',
  'Property Listed',
  'Initial Document Collection',
  'Offer Received',
  'Offer Submitted',
  'Lender Review',
  'BPO Ordered',
  'Approval Received',
  'In Closing',
]);
export const partyStatusEnum = pgEnum('party_status', ['pending', 'complete', 'overdue']);
export const documentStatusEnum = pgEnum('document_status', ['pending', 'complete', 'overdue']);
export const visibilityEnum = pgEnum('visibility', ['private', 'shared']);
export const deviceTokenTypeEnum = pgEnum('device_token_type', ['fcm', 'apn', 'web']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  trial_ends_at: timestamp('trial_ends_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  property_address: text('property_address').notNull(),
  current_phase: transactionPhaseEnum('current_phase').notNull(),
  created_by: uuid('created_by').notNull().references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transaction participants table
export const transaction_participants = pgTable('transaction_participants', {
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role_in_transaction: userRoleEnum('role_in_transaction').notNull(),
  status: partyStatusEnum('status').notNull().default('pending'),
  last_action: text('last_action'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: uniqueIndex('transaction_participants_pk').on(table.transaction_id, table.user_id, table.role_in_transaction),
  };
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  text: text('text').notNull(),
  reply_to: uuid('reply_to').references(() => messages.id),
  is_seed_message: boolean('is_seed_message').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document requests table
export const document_requests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  doc_type: text('doc_type').notNull(),
  assigned_to_user_id: uuid('assigned_to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requested_by_user_id: uuid('requested_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: documentStatusEnum('status').notNull().default('pending'),
  due_date: timestamp('due_date'),
  revision_note: text('revision_note'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Uploads table
export const uploads = pgTable('uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  uploaded_by_user_id: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  document_request_id: uuid('document_request_id').references(() => document_requests.id, { onDelete: 'set null' }),
  doc_type: text('doc_type').notNull(),
  file_name: text('file_name').notNull(),
  file_url: text('file_url').notNull(),
  content_type: text('content_type').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// User device tokens table for push notifications
export const user_device_tokens = pgTable('user_device_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_token: text('device_token').notNull().unique(),
  token_type: deviceTokenTypeEnum('token_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  current_phase: z.enum([
    'Transaction Initiated',
    'Property Listed',
    'Initial Document Collection',
    'Offer Received',
    'Offer Submitted',
    'Lender Review',
    'BPO Ordered',
    'Approval Received',
    'In Closing',
  ]),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertTransactionParticipantSchema = createInsertSchema(transaction_participants, {
  role_in_transaction: z.enum(['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']),
  status: z.enum(['pending', 'complete', 'overdue']),
}).omit({ created_at: true, updated_at: true });

export const insertMessageSchema = createInsertSchema(messages, {}).omit({ id: true, created_at: true });

export const insertDocumentRequestSchema = createInsertSchema(document_requests, {
  status: z.enum(['pending', 'complete', 'overdue']),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertUploadSchema = createInsertSchema(uploads, {
  visibility: z.enum(['private', 'shared']),
}).omit({ id: true, uploaded_at: true });

export const insertUserDeviceTokenSchema = createInsertSchema(user_device_tokens, {
  token_type: z.enum(['fcm', 'apn', 'web']),
}).omit({ id: true, created_at: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionParticipant = typeof transaction_participants.$inferSelect;
export type InsertTransactionParticipant = z.infer<typeof insertTransactionParticipantSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type DocumentRequest = typeof document_requests.$inferSelect;
export type InsertDocumentRequest = z.infer<typeof insertDocumentRequestSchema>;

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;

export type UserDeviceToken = typeof user_device_tokens.$inferSelect;
export type InsertUserDeviceToken = z.infer<typeof insertUserDeviceTokenSchema>;