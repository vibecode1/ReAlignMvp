import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for database constraints
export const userRoleEnum = pgEnum('user_role', ['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']);
// Updated transaction phases for Tracker MVP
export const transactionPhaseEnum = pgEnum('transaction_phase', [
  'Transaction Initiated',
  'Property Listing',
  'Documentation Collection',
  'Hardship Package Submitted',
  'Offer Received',
  'Offer Submitted to Lender',
  'Initial Lender Review',
  'Property Valuation Ordered',
  'Lender Negotiations',
  'Final Approval Received',
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
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table - updated for Tracker MVP
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  property_address: text('property_address').notNull(),
  current_phase: transactionPhaseEnum('current_phase').notNull().default('Transaction Initiated'),
  negotiator_id: uuid('negotiator_id').notNull().references(() => users.id),
  welcome_email_body: text('welcome_email_body'), // Custom welcome message for email subscriptions
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transaction phase history table - new for Tracker MVP
export const transaction_phase_history = pgTable('transaction_phase_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  phase_key: transactionPhaseEnum('phase_key').notNull(),
  set_by_negotiator_id: uuid('set_by_negotiator_id').notNull().references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Transaction participants table
export const transaction_participants = pgTable('transaction_participants', {
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role_in_transaction: userRoleEnum('role_in_transaction').notNull(),
  status: partyStatusEnum('status').notNull().default('pending'),
  last_action: text('last_action'),
  welcome_email_sent: boolean('welcome_email_sent').notNull().default(false), // Track email sent status
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
  reply_to: uuid('reply_to'),
  is_seed_message: boolean('is_seed_message').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document requests table - updated for Tracker MVP (role-based assignment)
export const document_requests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  document_name: text('document_name').notNull(), // Changed from doc_type to document_name for flexibility
  assigned_party_role: text('assigned_party_role').notNull(), // Role-based assignment (e.g., 'Seller', 'Buyer Agent')
  status: documentStatusEnum('status').notNull().default('pending'),
  requested_at: timestamp('requested_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
  due_date: timestamp('due_date'),
});

// Tracker notes table - new for Tracker MVP
export const tracker_notes = pgTable('tracker_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  note_text: text('note_text').notNull(), // Can store predefined or custom notes
  negotiator_id: uuid('negotiator_id').notNull().references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Email subscriptions table - new for Tracker MVP
export const email_subscriptions = pgTable('email_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  party_email: text('party_email').notNull(),
  party_role: text('party_role').notNull(), // e.g., 'Agent', 'Homeowner'
  is_subscribed: boolean('is_subscribed').notNull().default(true),
  magic_link_token: text('magic_link_token').notNull().unique(), // For view-only access
  token_expires_at: timestamp('token_expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
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
}).omit({ created_at: true, updated_at: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  current_phase: z.enum([
    'Transaction Initiated',
    'Property Listing',
    'Documentation Collection',
    'Hardship Package Submitted',
    'Offer Received',
    'Offer Submitted to Lender',
    'Initial Lender Review',
    'Property Valuation Ordered',
    'Lender Negotiations',
    'Final Approval Received',
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
}).omit({ id: true, requested_at: true });

export const insertTransactionPhaseHistorySchema = createInsertSchema(transaction_phase_history, {
  phase_key: z.enum([
    'Transaction Initiated',
    'Property Listing',
    'Documentation Collection',
    'Hardship Package Submitted',
    'Offer Received',
    'Offer Submitted to Lender',
    'Initial Lender Review',
    'Property Valuation Ordered',
    'Lender Negotiations',
    'Final Approval Received',
    'In Closing',
  ]),
}).omit({ id: true, timestamp: true });

export const insertTrackerNoteSchema = createInsertSchema(tracker_notes, {}).omit({ id: true, created_at: true });

export const insertEmailSubscriptionSchema = createInsertSchema(email_subscriptions, {}).omit({ id: true, created_at: true });

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

// New types for Tracker MVP
export type TransactionPhaseHistory = typeof transaction_phase_history.$inferSelect;
export type InsertTransactionPhaseHistory = z.infer<typeof insertTransactionPhaseHistorySchema>;

export type TrackerNote = typeof tracker_notes.$inferSelect;
export type InsertTrackerNote = z.infer<typeof insertTrackerNoteSchema>;

export type EmailSubscription = typeof email_subscriptions.$inferSelect;
export type InsertEmailSubscription = z.infer<typeof insertEmailSubscriptionSchema>;