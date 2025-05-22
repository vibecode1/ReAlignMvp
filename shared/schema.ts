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

// Transaction participants join table
export const transaction_participants = pgTable('transaction_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id),
  role_in_transaction: userRoleEnum('role_in_transaction').notNull(),
  status: partyStatusEnum('status').default('pending').notNull(),
  last_action: text('last_action'),
  last_updated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure that a user has only one role per transaction
    uniq: uniqueIndex('transaction_participants_uniq_idx').on(table.transaction_id, table.user_id, table.role_in_transaction),
  };
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  text: text('text').notNull(),
  reply_to: uuid('reply_to').references((): any => messages.id),
  is_seed_message: boolean('is_seed_message').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document requests table
export const document_requests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  doc_type: text('doc_type').notNull(),
  assigned_to_user_id: uuid('assigned_to_user_id').notNull().references(() => users.id),
  status: documentStatusEnum('status').default('pending').notNull(),
  due_date: timestamp('due_date'),
  revision_note: text('revision_note'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Uploads table
export const uploads = pgTable('uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  document_request_id: uuid('document_request_id').references(() => document_requests.id),
  uploaded_by: uuid('uploaded_by').notNull().references(() => users.id),
  doc_type: text('doc_type').notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  file_url: text('file_url').notNull(),
  file_name: text('file_name').notNull(),
  content_type: text('content_type').notNull(),
  size_bytes: integer('size_bytes').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// Zod schemas for validation

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['negotiator', 'seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']),
  phone: z.string().optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  title: z.string().min(3),
  property_address: z.string().min(5),
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
  status: z.enum(['pending', 'complete', 'overdue']).optional(),
  last_action: z.string().optional(),
}).omit({ id: true, last_updated: true });

export const insertMessageSchema = createInsertSchema(messages, {
  text: z.string().min(1),
  is_seed_message: z.boolean().optional(),
}).omit({ id: true, created_at: true });

export const insertDocumentRequestSchema = createInsertSchema(document_requests, {
  doc_type: z.string().min(1),
  status: z.enum(['pending', 'complete', 'overdue']).optional(),
  due_date: z.string().optional(),
  revision_note: z.string().optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertUploadSchema = createInsertSchema(uploads, {
  doc_type: z.string().min(1),
  visibility: z.enum(['private', 'shared']),
  file_url: z.string().url(),
  file_name: z.string().min(1),
  content_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
}).omit({ id: true, uploaded_at: true });

// Export types
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
