import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateTransactionSchema, UpdateTransactionSchema, UpdatePartyStatusSchema } from '@shared/types';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Import Supabase admin client for database operations
import { supabaseAdmin } from '../lib/supabase';

/**
 * Controller for transaction routes
 */
export const transactionController = {
  /**
   * Create a new transaction
   */
  async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      // Validate request body
      const validation = CreateTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transaction data',
            details: validation.error.errors,
          }
        });
      }

      const { title, property_address, parties, initialMessage } = validation.data;

      // Create the transaction with email subscriptions for Tracker MVP
      const transaction = await storage.createTransaction(
        {
          title,
          property_address,
          current_phase: 'Transaction Initiated', // Always start with first phase
          negotiator_id: req.user.id,
        },
        req.user.id,
        parties.map(p => ({ email: p.email, role: p.role })),
        initialMessage
      );

      // Create negotiator as a participant
      const negotiator = await storage.getUserById(req.user.id);
      if (negotiator) {
        await storage.addParticipant({
          transaction_id: transaction.id,
          user_id: req.user.id,
          role_in_transaction: 'negotiator',
          status: 'complete',
          last_action: 'Created transaction',
        });
      }

      // Process each party
      for (const party of parties) {
        // Check if user already exists
        let user = await storage.getUserByEmail(party.email);

        // Create user if it doesn't exist
        if (!user) {
          user = await storage.createUser({
            email: party.email,
            name: party.name,
            role: party.role,
            phone: party.phone,
          });
        }

        // Add as participant
        await storage.addParticipant({
          transaction_id: transaction.id,
          user_id: user.id,
          role_in_transaction: party.role,
          status: 'pending',
        });

        // Send invitation (notificationService call updated for Tracker MVP)
        // await notificationService.sendTransactionInvitation(
        //   user.email,
        //   user.name,
        //   party.role,
        //   transaction.title,
        //   transaction.property_address,
        //   negotiator?.name || 'Your negotiator'
        // );
      }

      // Add initial welcome message if provided
      if (initialMessage) {
        await storage.createMessage(
          {
            transaction_id: transaction.id,
            text: initialMessage,
            sender_id: req.user.id,
            is_seed_message: true,
          },
          transaction.id,
          req.user.id
        );
      }

      // Return the new transaction along with its participants
      const participants = await storage.getParticipantsByTransactionId(transaction.id);
      
      // Format the response to match GET /transactions/:id
      const response = {
        id: transaction.id,
        title: transaction.title,
        property_address: transaction.property_address,
        currentPhase: transaction.current_phase,
        created_by: {
          id: req.user.id,
          name: negotiator?.name || 'Negotiator',
        },
        created_at: transaction.created_at,
        parties: await Promise.all(participants.map(async (participant) => {
          const user = await storage.getUserById(participant.user_id);
          return {
            userId: participant.user_id,
            name: user?.name || 'Unknown',
            role: participant.role_in_transaction,
            status: participant.status,
            lastAction: participant.last_action,
          };
        })),
        messages: initialMessage ? [{
          id: 'seed', // Replace with actual ID once available
          text: initialMessage,
          sender: {
            id: req.user.id,
            name: negotiator?.name || 'Negotiator',
            role: 'negotiator',
          },
          isSeedMessage: true,
          replyTo: null,
          created_at: new Date().toISOString(),
        }] : [],
        documentRequests: [],
        uploads: [],
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Create transaction error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create transaction',
        }
      });
    }
  },

  /**
   * Get all transactions for the authenticated user
   */
  async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      // Get transactions with pagination - fixed method name for Tracker MVP
      const { data: transactions, total } = await storage.getTransactionsByNegotiatorId(req.user.id, page, limit);

      // Calculate last activity timestamp (this would be more complex in a real implementation)
      const result = await Promise.all(transactions.map(async (transaction: any) => {
        // Get negotiator name
        const negotiator = await storage.getUserById(transaction.negotiator_id);
        
        // Get last message timestamp as a simple way to determine last activity
        const { data: messages } = await storage.getMessagesByTransactionId(transaction.id, 1, 1);
        const lastActivityAt = messages.length > 0 
          ? messages[0].created_at 
          : transaction.created_at;
        
        return {
          id: transaction.id,
          title: transaction.title,
          property_address: transaction.property_address,
          currentPhase: transaction.current_phase,
          created_by: negotiator?.id || transaction.negotiator_id,
          created_at: transaction.created_at.toISOString(),
          lastActivityAt: lastActivityAt.toISOString(),
        };
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: result,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          perPage: limit,
        },
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve transactions',
        }
      });
    }
  },

  /**
   * Get a single transaction by ID
   */
  async getTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const transactionId = req.params.id;

      // Get transaction details
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      // Get negotiator details - fixed for Tracker MVP schema
      const negotiator = await storage.getUserById(transaction.negotiator_id);

      // Get participants
      const participants = await storage.getParticipantsByTransactionId(transactionId);
      
      // Format participants with user details
      const parties = await Promise.all(participants.map(async (participant) => {
        const user = await storage.getUserById(participant.user_id);
        return {
          userId: participant.user_id,
          name: user?.name || 'Unknown',
          role: participant.role_in_transaction,
          status: participant.status,
          lastAction: participant.last_action,
        };
      }));

      // Get latest messages (limit for preview)
      const { data: messages } = await storage.getMessagesByTransactionId(transactionId, 1, 5);
      
      // Format messages with sender details
      const formattedMessages = await Promise.all(messages.map(async (message) => {
        const sender = message.sender_id ? await storage.getUserById(message.sender_id) : null;
        return {
          id: message.id,
          text: message.text,
          sender: sender ? {
            id: sender.id,
            name: sender.name,
            role: sender.role,
          } : {
            id: 'system',
            name: 'System',
            role: 'system',
          },
          replyTo: message.reply_to,
          isSeedMessage: message.is_seed_message,
          created_at: message.created_at.toISOString(),
        };
      }));

      // Get document requests
      const { data: docRequests } = await storage.getDocumentRequestsByTransactionId(transactionId, 1, 10);
      
      // Format document requests - fixed for Tracker MVP schema
      const documentRequests = docRequests.map((request) => {
        return {
          id: request.id,
          docType: request.document_name,
          assignedTo: request.assigned_party_role,
          status: request.status,
          dueDate: request.due_date?.toISOString(),
          requestedAt: request.requested_at.toISOString(),
        };
      });

      // Get uploads filtered by user role and visibility
      const { data: uploadData } = await storage.getUploadsByTransactionId(
        transactionId,
        req.user.id,
        req.user.role,
        1,
        10
      );
      
      // Format uploads - fixed for Tracker MVP schema
      const uploads = uploadData.map(upload => ({
        id: upload.id,
        docType: upload.doc_type,
        fileName: upload.file_name,
        fileUrl: upload.file_url,
        contentType: upload.content_type,
        sizeBytes: upload.size_bytes,
        uploadedBy: upload.uploaded_by_user_id,
        visibility: upload.visibility,
        uploadedAt: upload.uploaded_at.toISOString(),
      }));

      // Combine all data
      const response = {
        id: transaction.id,
        title: transaction.title,
        property_address: transaction.property_address,
        currentPhase: transaction.current_phase,
        created_by: {
          id: negotiator?.id || transaction.negotiator_id,
          name: negotiator?.name || 'Unknown',
        },
        created_at: transaction.created_at.toISOString(),
        parties,
        messages: formattedMessages,
        documentRequests,
        uploads,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Get transaction error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve transaction details',
        }
      });
    }
  },

  /**
   * Update a transaction
   */
  async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const transactionId = req.params.id;

      // Validate request body
      const validation = UpdateTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transaction data',
            details: validation.error.errors,
          }
        });
      }

      const { title, property_address, currentPhase } = validation.data;

      // Check if transaction exists and user is allowed to update it
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      // Update the transaction
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (property_address !== undefined) updateData.property_address = property_address;
      if (currentPhase !== undefined) {
        updateData.current_phase = currentPhase;
        
        // Send phase update notification
        await notificationService.sendPhaseUpdateNotification(
          transactionId,
          currentPhase,
          req.user.id
        );
      }

      const updatedTransaction = await storage.updateTransaction(transactionId, updateData);

      // Return updated transaction details
      return res.status(200).json({
        id: updatedTransaction.id,
        title: updatedTransaction.title,
        property_address: updatedTransaction.property_address,
        currentPhase: updatedTransaction.current_phase,
        created_by: updatedTransaction.negotiator_id,
        created_at: updatedTransaction.created_at.toISOString(),
        updated_at: updatedTransaction.updated_at.toISOString(),
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update transaction',
        }
      });
    }
  },

  /**
   * Get all parties for a transaction
   */
  async getParties(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const transactionId = req.params.id;

      // Get all participants
      const participants = await storage.getParticipantsByTransactionId(transactionId);
      
      // Format with user details
      const result = await Promise.all(participants.map(async (participant) => {
        const user = await storage.getUserById(participant.user_id);
        return {
          userId: participant.user_id,
          name: user?.name || 'Unknown',
          role: participant.role_in_transaction,
          status: participant.status,
          lastAction: participant.last_action,
          last_updated: participant.updated_at.toISOString(),
        };
      }));

      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      console.error('Get parties error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve transaction parties',
        }
      });
    }
  },

  /**
   * Update a party's status
   */
  async updatePartyStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const transactionId = req.params.transactionId;
      const userId = req.params.userId;

      // Validate request body
      const validation = UpdatePartyStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status data',
            details: validation.error.errors,
          }
        });
      }

      const { status, lastAction } = validation.data;

      // Update the participant status
      const updatedParticipant = await storage.updateParticipantStatus(
        transactionId,
        userId,
        status,
        lastAction
      );

      // Get user details
      const user = await storage.getUserById(updatedParticipant.user_id);

      return res.status(200).json({
        userId: updatedParticipant.user_id,
        name: user?.name || 'Unknown',
        role: updatedParticipant.role_in_transaction,
        status: updatedParticipant.status,
        lastAction: updatedParticipant.last_action,
        last_updated: updatedParticipant.updated_at.toISOString(),
      });
    } catch (error) {
      console.error('Update party status error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update party status',
        }
      });
    }
  },
};
