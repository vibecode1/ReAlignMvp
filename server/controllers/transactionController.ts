import { Request, Response } from 'express';
import { z } from 'zod';
import { UpdateTransactionSchema, UpdatePartyStatusSchema } from '@shared/types';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Import Supabase admin client for database operations
import { supabaseAdmin } from '../lib/supabase';

// Tracker MVP specific schema for transaction creation (backend)
const CreateTransactionSchemaTrackerMVP = z.object({
  title: z.string().min(1, "Title is required"),
  property_address: z.string().min(1, "Property address is required"),
  parties: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    role: z.enum(['seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow'], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
  })).optional(),
  welcome_email_body: z.string().optional(),
});

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

      // Validate request body using Tracker MVP schema
      const validation = CreateTransactionSchemaTrackerMVP.safeParse(req.body);
      if (!validation.success) {
        console.error('VALIDATION_ERROR in createTransaction:', validation.error.errors);
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transaction data',
            details: validation.error.errors,
          }
        });
      }

      const { title, property_address, parties, welcome_email_body } = validation.data;

      // Create the transaction with email subscriptions for Tracker MVP
      const transaction = await storage.createTransaction(
        {
          title,
          property_address,
          current_phase: 'Transaction Initiated', // Always start with first phase
          negotiator_id: req.user.id,
        },
        req.user.id,
        parties?.map(p => ({ email: p.email, role: p.role })) || [],
        welcome_email_body
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
      if (parties) {
        for (const party of parties) {
          // Check if user already exists
          let user = await storage.getUserByEmail(party.email);

          // Create user if it doesn't exist
          if (!user) {
            user = await storage.createUser({
              email: party.email,
              name: party.name,
              role: party.role,
            });
          }

          // Add as participant
          await storage.addParticipant({
            transaction_id: transaction.id,
            user_id: user.id,
            role_in_transaction: party.role,
            status: 'pending',
          });
        }
      }

      // Add initial welcome message if provided
      if (welcome_email_body) {
        await storage.createMessage(
          {
            transaction_id: transaction.id,
            text: welcome_email_body,
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
        messages: welcome_email_body ? [{
          id: 'seed', // Replace with actual ID once available
          text: welcome_email_body,
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const { data: transactions, total } = await storage.getTransactionsByNegotiatorId(
        req.user.id,
        page,
        limit
      );

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: transactions,
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
   * Get a specific transaction by ID
   */
  async getTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransactionById(id);

      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      return res.status(200).json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve transaction',
        }
      });
    }
  },

  /**
   * Update a transaction
   */
  async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updatedTransaction = await storage.updateTransaction(id, req.body);
      
      return res.status(200).json(updatedTransaction);
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
   * Get parties for a transaction
   */
  async getParties(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const participants = await storage.getParticipantsByTransactionId(transactionId);
      
      return res.status(200).json({ data: participants });
    } catch (error) {
      console.error('Get parties error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve parties',
        }
      });
    }
  },

  /**
   * Update party status
   */
  async updatePartyStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId, userId } = req.params;
      const { status, lastAction } = req.body;
      
      const updatedParticipant = await storage.updateParticipantStatus(
        transactionId,
        userId,
        status,
        lastAction
      );
      
      return res.status(200).json(updatedParticipant);
    } catch (error) {
      console.error('Update party status error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update party status',
        }
      });
    }
  }
};