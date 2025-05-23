// Custom types for frontend and backend
import { z } from "zod";

// Auth related
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const MagicLinkRequestSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
});

// Transaction related
export const CreateTransactionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  property_address: z.string().min(5, "Property address is required"),
  parties: z.array(z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    role: z.enum(['seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow'], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
  })).min(1, "At least one party is required"),
  initialPhase: z.enum([
    'Transaction Initiated',
    'Property Listed',
    'Initial Document Collection',
    'Offer Received',
    'Offer Submitted',
    'Lender Review',
    'BPO Ordered',
    'Approval Received',
    'In Closing',
  ], {
    errorMap: () => ({ message: "Invalid transaction phase" }),
  }),
  initialMessage: z.string().optional(),
});

export const UpdateTransactionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  property_address: z.string().min(5, "Property address is required").optional(),
  currentPhase: z.enum([
    'Transaction Initiated',
    'Property Listed',
    'Initial Document Collection',
    'Offer Received',
    'Offer Submitted',
    'Lender Review',
    'BPO Ordered',
    'Approval Received',
    'In Closing',
  ], {
    errorMap: () => ({ message: "Invalid transaction phase" }),
  }).optional(),
});

export const UpdatePartyStatusSchema = z.object({
  status: z.enum(['pending', 'complete', 'overdue'], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
  lastAction: z.string().optional(),
});

export const NewMessageSchema = z.object({
  text: z.string().min(1, "Message text is required"),
  replyTo: z.string().uuid("Invalid message ID").optional().nullable(),
  isSeedMessage: z.boolean().optional(),
});

export const DocumentRequestSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  assignedToUserId: z.string().min(1, "Assigned party role is required"), // Now a role string, not user ID
  dueDate: z.string().optional(),
});

export const UpdateDocumentRequestSchema = z.object({
  status: z.enum(['pending', 'complete', 'overdue'], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
  revisionNote: z.string().optional(),
});

export const UploadFileSchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  visibility: z.enum(['private', 'shared'], {
    errorMap: () => ({ message: "Visibility must be 'private' or 'shared'" }),
  }),
  documentRequestId: z.string().uuid("Invalid document request ID").optional(),
});

export const NegotiatorRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Frontend types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
};

export type StandardError = {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string; }[];
  };
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  token: string;
};

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type PartyInfo = {
  userId: string;
  name: string;
  role: string;
  status: 'pending' | 'complete' | 'overdue';
  lastAction?: string;
};

export type MessageInfo = {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  text: string;
  replyTo: string | null;
  isSeedMessage: boolean;
  created_at: string;
};

export type DocumentRequestInfo = {
  id: string;
  docType: string;
  assignedTo: string;
  status: 'pending' | 'complete' | 'overdue';
  dueDate?: string;
  revisionNote?: string;
};

export type UploadInfo = {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  visibility: 'private' | 'shared';
  uploadedAt: string;
};

export type TransactionSummary = {
  id: string;
  title: string;
  property_address: string;
  currentPhase: string;
  created_by: string;
  created_at: string;
  lastActivityAt: string;
};

export type TransactionDetail = {
  id: string;
  title: string;
  property_address: string;
  currentPhase: string;
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  parties: PartyInfo[];
  messages: MessageInfo[];
  documentRequests: DocumentRequestInfo[];
  uploads: UploadInfo[];
};
