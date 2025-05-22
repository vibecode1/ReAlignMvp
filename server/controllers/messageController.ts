import { Response } from 'express';
import { z } from 'zod';
import { NewMessageSchema } from '@shared/types';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller for message routes
 */
export const messageController = {
  /**
   * Get messages for a transaction
   */
  async getMessages(req: AuthenticatedRequest, res: Response) {
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

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      // Get messages with pagination
      const { data: messages, total } = await storage.getMessagesByTransactionId(transactionId, page, limit);
      
      // Format messages with sender details
      const formattedMessages = await Promise.all(messages.map(async (message) => {
        const sender = message.sender_id ? await storage.getUserById(message.sender_id) : null;
        return {
          id: message.id,
          sender: sender ? {
            id: sender.id,
            name: sender.name,
            role: sender.role,
          } : {
            id: 'system',
            name: 'System',
            role: 'system',
          },
          text: message.text,
          replyTo: message.reply_to,
          isSeedMessage: message.is_seed_message,
          created_at: message.created_at.toISOString(),
        };
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: formattedMessages,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          perPage: limit,
        },
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve messages',
        }
      });
    }
  },

  /**
   * Create a new message
   */
  async createMessage(req: AuthenticatedRequest, res: Response) {
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
      const validation = NewMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid message data',
            details: validation.error.errors,
          }
        });
      }

      const { text, replyTo, isSeedMessage } = validation.data;

      // Check if user role is negotiator for top-level messages
      const user = await storage.getUserById(req.user.id);
      const isNegotiator = user?.role === 'negotiator';

      // Enforce top-level message restriction: only negotiators can post top-level messages
      if (!replyTo && !isNegotiator) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only negotiators can post top-level messages',
          }
        });
      }

      // If this is a reply, validate that the parent message exists and belongs to this transaction
      if (replyTo) {
        const parentMessage = await storage.getMessageById(replyTo);
        if (!parentMessage) {
          return res.status(404).json({
            error: {
              code: 'PARENT_NOT_FOUND',
              message: 'The message you are replying to does not exist',
            }
          });
        }
        
        // Check if parent message belongs to this transaction
        if (parentMessage.transaction_id !== transactionId) {
          return res.status(400).json({
            error: {
              code: 'INVALID_PARENT',
              message: 'The message you are replying to does not belong to this transaction',
            }
          });
        }
      }

      // Create the message
      const message = await storage.createMessage(
        {
          text,
          reply_to: replyTo,
          is_seed_message: isSeedMessage || false,
        },
        transactionId,
        req.user.id
      );

      // Send notification for the new message
      await notificationService.sendMessageNotification(message.id);

      // Format response
      const response = {
        id: message.id,
        sender: {
          id: user?.id || req.user.id,
          name: user?.name || 'Unknown',
          role: user?.role || 'unknown',
        },
        text: message.text,
        replyTo: message.reply_to,
        isSeedMessage: message.is_seed_message,
        created_at: message.created_at.toISOString(),
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Create message error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create message',
        }
      });
    }
  },
};
