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

// Schema for adding parties to existing transactions
const AddPartyToTransactionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(['seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow'], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

// Schema for adding multiple parties to existing transactions
const AddPartiesToTransactionSchema = z.object({
  parties: z.array(AddPartyToTransactionSchema).min(1, "At least one party must be provided"),
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

      // Process each party and set up email subscriptions
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

          // Create email subscription with magic link token for Tracker MVP
          const magicLinkToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const tokenExpiresAt = new Date();
          tokenExpiresAt.setFullYear(tokenExpiresAt.getFullYear() + 1); // 1 year expiry

          await storage.createEmailSubscription({
            transaction_id: transaction.id,
            party_email: party.email,
            party_role: party.role,
            magic_link_token: magicLinkToken,
            token_expires_at: tokenExpiresAt,
            is_subscribed: true,
          });

          // Send welcome email with tracker magic link
          try {
            await notificationService.sendTrackerMagicLink(
              party.email,
              party.name,
              party.role,
              transaction.title,
              transaction.property_address,
              negotiator?.name || 'Your Negotiator',
              magicLinkToken,
              transaction.id
            );
          } catch (emailError) {
            console.error(`Failed to send welcome email to ${party.email}:`, emailError);
            // Continue processing other parties even if email fails
          }
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
      console.log('=== CONTROLLER: getTransaction METHOD ENTRY ===');
      console.log(`Transaction ID from params: ${id}`);

      // ---- NEW DIAGNOSTIC LOGS ----
      console.log('>>> CONTROLLER: Attempting to call storage layer to fetch transaction.');

      let transactionDataFromStorage;

      const storageMethodBeingCalled = 'storage.getTransactionById';
      console.log(`>>> CONTROLLER: About to call storage method: ${storageMethodBeingCalled} with ID: ${id}`);

      transactionDataFromStorage = await storage.getTransactionById(id);

      console.log(`>>> CONTROLLER: Data RECEIVED from storage method (${storageMethodBeingCalled}):`, JSON.stringify(transactionDataFromStorage, null, 2));
      // ---- END OF NEW DIAGNOSTIC LOGS ----

      if (!transactionDataFromStorage) {
        console.log('<<< CONTROLLER: Transaction not found by storage method. Returning 404.');
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      console.log('=== CONTROLLER: Sending response to frontend ===');
      console.log('Response data:', JSON.stringify(transactionDataFromStorage, null, 2));
      return res.status(200).json(transactionDataFromStorage);
    } catch (error) {
      console.error(`Get transaction error in controller for ID ${req.params.id}:`, error);
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
   * Update transaction phase
   */
  async updateTransactionPhase(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { id } = req.params;
      const { phase } = req.body;

      if (!phase) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Phase is required',
          }
        });
      }

      const updatedTransaction = await storage.updateTransactionPhase(id, phase, req.user.id);

      return res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error('Update transaction phase error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update transaction phase',
        }
      });
    }
  },

  /**
   * Get transaction phase history
   */
  async getTransactionPhaseHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const phaseHistory = await storage.getPhaseHistoryByTransactionId(id);

      return res.status(200).json(phaseHistory);
    } catch (error) {
      console.error('Get phase history error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve phase history',
        }
      });
    }
  },

  /**
   * Add parties to a transaction
   */
  addPartiesToTransaction: async (req: AuthenticatedRequest, res: Response) => {
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
      const { parties } = req.body;

      if (!Array.isArray(parties) || parties.length === 0) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Parties array is required and must not be empty',
          }
        });
      }

      // Validate each party has required fields
      for (const party of parties) {
        if (!party.email || !party.name || !party.role) {
          return res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: 'Each party must have email, name, and role',
            }
          });
        }
      }

      const addedParties = await storage.addPartiesToTransaction(transactionId, parties);

      res.json({
        success: true,
        data: {
          parties: addedParties
        }
      });
    } catch (error) {
      console.error('Error adding parties to transaction:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add parties to transaction',
        }
      });
    }
  },

  /**
   * Get parties for a transaction
   */
  getParties: async (req: AuthenticatedRequest, res: Response) => {
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
  },

  /**
   * Add party to existing transaction
   */
  async addPartyToTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('=== ADD PARTY TO TRANSACTION REQUEST ===');
      console.log('Transaction ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user?.email, req.user?.id);

      if (!req.user) {
        console.log('ERROR: No authenticated user');
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { id: transactionId } = req.params;

      // Validate request body
      const validation = AddPartyToTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        console.error('VALIDATION_ERROR in addPartyToTransaction:', validation.error.errors);
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid party data',
            details: validation.error.errors,
          }
        });
      }

      const { name, email, role } = validation.data;
      console.log('Validated party data:', { name, email, role });

      // Get the transaction to verify it exists and get details for email
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        console.log('ERROR: Transaction not found');
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          }
        });
      }

      console.log('Transaction found:', transaction.title, transaction.property_address);

      // Get negotiator details for email
      const negotiator = await storage.getUserById(req.user.id);
      console.log('Negotiator details:', negotiator?.name, negotiator?.email);

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      console.log('Existing user check:', user ? `Found user: ${user.name}` : 'User not found, will create new one');

      // Create user if it doesn't exist
      if (!user) {
        console.log('Creating new user for party...');
        user = await storage.createUser({
          email,
          name,
          role,
        });
        console.log('New user created:', user.id, user.email);
      }

      // Check if user is already a participant in this transaction WITH THE SAME ROLE
      const existingParticipants = await storage.getParticipantsByTransactionId(transactionId);
      const existingParticipantWithSameRole = existingParticipants.find(p => p.user_id === user!.id && p.role_in_transaction === role);

      if (existingParticipantWithSameRole) {
        console.log('ERROR: User already has this exact role in this transaction');
        return res.status(400).json({
          error: {
            code: 'DUPLICATE_ROLE',
            message: `User already has the role "${role}" in this transaction`,
          }
        });
      }

      // Log if user has other roles (for visibility)
      const userRoles = existingParticipants.filter(p => p.user_id === user!.id);
      if (userRoles.length > 0) {
        console.log(`User already has roles: [${userRoles.map(p => p.role_in_transaction).join(', ')}]. Adding additional role: ${role}`);
      }

      console.log('Adding user as participant...');
      // Add as participant
      const participant = await storage.addParticipant({
        transaction_id: transactionId,
        user_id: user.id,
        role_in_transaction: role,
        status: 'pending',
        last_action: `Added to transaction by ${negotiator?.name || 'negotiator'}`,
      });
      console.log('Participant added successfully');

      // Create email subscription with magic link token
      console.log('Creating email subscription with magic link...');
      const magicLinkToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setFullYear(tokenExpiresAt.getFullYear() + 1); // 1 year expiry

      const emailSubscription = await storage.createEmailSubscription({
        transaction_id: transactionId,
        party_email: email,
        party_role: role,
        magic_link_token: magicLinkToken,
        token_expires_at: tokenExpiresAt,
        is_subscribed: true,
      });
      console.log('Email subscription created:', emailSubscription.id, 'Token:', magicLinkToken);

      // Send welcome email with tracker magic link
      console.log('=== SENDING EMAIL NOTIFICATION ===');
      console.log('Email details:');
      console.log('  To:', email);
      console.log('  Name:', name);
      console.log('  Role:', role);
      console.log('  Transaction:', transaction.title);
      console.log('  Property:', transaction.property_address);
      console.log('  Negotiator:', negotiator?.name || 'Your Negotiator');
      console.log('  Magic Link Token:', magicLinkToken);

      try {
        const emailSent = await notificationService.sendTrackerMagicLink(
          email,
          name,
          role,
          transaction.title,
          transaction.property_address,
          negotiator?.name || 'Your Negotiator',
          magicLinkToken,
          transactionId
        );

        if (emailSent) {
          console.log('✅ EMAIL SENT SUCCESSFULLY to', email);
        } else {
          console.log('⚠️ EMAIL SENDING RETURNED FALSE for', email);
        }
      } catch (emailError) {
        console.error('❌ EMAIL SENDING FAILED:', emailError);
        console.error('Email error details:', {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
          code: (emailError as any)?.code || 'Unknown code',
        });
        // Continue processing - don't fail the entire request for email issues
      }

      console.log('=== ADD PARTY OPERATION COMPLETED ===');

      // Return the new participant details
      const responseData = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: participant.role_in_transaction,
        status: participant.status,
        lastAction: participant.last_action,
        magicLinkToken: magicLinkToken, // Include for debugging purposes
      };

      console.log('Response data:', JSON.stringify(responseData, null, 2));
      return res.status(201).json(responseData);
    } catch (error) {
      console.error('❌ ADD PARTY TO TRANSACTION ERROR:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? emailError.stack : 'No stack trace',
        code: (emailError as any)?.code || 'Unknown code',
      });
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to add party to transaction',
        }
      });
    }
  },

  /**
   * Get tracker link for a transaction
   */
  async getTrackerLink(req: AuthenticatedRequest, res: Response) {
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

      // Get the first available magic link token for this transaction
      const subscriptions = await storage.getEmailSubscriptionsByTransactionId(transactionId);

      if (subscriptions.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NO_TRACKER_LINK',
            message: 'No tracker link available for this transaction',
          }
        });
      }

      // Return the first valid token
      return res.status(200).json({
        token: subscriptions[0].magic_link_token
      });
    } catch (error) {
      console.error('Get tracker link error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve tracker link',
        }
      });
    }
  },
};