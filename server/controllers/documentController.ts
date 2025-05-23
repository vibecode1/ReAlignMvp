import { Response } from 'express';
import { z } from 'zod';
import { DocumentRequestSchema, UpdateDocumentRequestSchema } from '@shared/types';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller for document request routes
 */
export const documentController = {
  /**
   * Create a new document request
   */
  async createDocumentRequest(req: AuthenticatedRequest, res: Response) {
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
      const validation = DocumentRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid document request data',
            details: validation.error.errors,
          }
        });
      }

      const { docType, assignedToUserId, dueDate } = validation.data;

      // Create the document request - updated for Tracker MVP (role-based assignment)
      const documentRequest = await storage.createDocumentRequest({
        transaction_id: transactionId,
        document_name: docType,
        assigned_party_role: assignedToUserId, // Now using role instead of user ID
        status: 'pending',
        due_date: dueDate ? new Date(dueDate) : undefined,
      });

      // Get transaction details for notification
      const transaction = await storage.getTransactionById(transactionId);
      
      // Get negotiator details
      const negotiator = await storage.getUserById(req.user.id);

      // Send notification to the assigned user (if we have a specific user ID)
      if (transaction && negotiator && assignedToUserId) {
        await notificationService.sendDocumentRequest(
          assignedToUserId,
          docType,
          transaction.title,
          negotiator.name,
          dueDate || new Date()
        );
      }

      // Format response - updated for Tracker MVP schema (role-based assignment)
      const response = {
        id: documentRequest.id,
        docType: documentRequest.document_name,
        assignedTo: documentRequest.assigned_party_role,
        status: documentRequest.status,
        dueDate: documentRequest.due_date?.toISOString(),
        requested_at: documentRequest.requested_at.toISOString(),
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('Create document request error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create document request',
        }
      });
    }
  },

  /**
   * Get document requests for a transaction
   */
  async getDocumentRequests(req: AuthenticatedRequest, res: Response) {
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

      // Get document requests with pagination
      const { data: documentRequests, total } = await storage.getDocumentRequestsByTransactionId(
        transactionId,
        page,
        limit
      );
      
      // Format document requests - updated for Tracker MVP schema
      const formattedRequests = documentRequests.map((request) => {
        return {
          id: request.id,
          docType: request.document_name,
          assignedTo: request.assigned_party_role,
          status: request.status,
          dueDate: request.due_date?.toISOString(),
          requested_at: request.requested_at.toISOString(),
        };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: formattedRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          perPage: limit,
        },
      });
    } catch (error) {
      console.error('Get document requests error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve document requests',
        }
      });
    }
  },

  /**
   * Update a document request status
   */
  async updateDocumentRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const requestId = req.params.requestId;

      // Validate request body
      const validation = UpdateDocumentRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid document request update data',
            details: validation.error.errors,
          }
        });
      }

      const { status, revisionNote } = validation.data;

      // Update the document request
      const updatedRequest = await storage.updateDocumentRequestStatus(
        requestId,
        status,
        revisionNote
      );

      // If status is updated to pending with a revision note, send a reminder
      if (status === 'pending' && revisionNote) {
        await notificationService.sendDocumentRequestReminder(requestId);
      }

      // Format response - updated for Tracker MVP schema
      const response = {
        id: updatedRequest.id,
        docType: updatedRequest.document_name,
        assignedTo: updatedRequest.assigned_party_role,
        status: updatedRequest.status,
        dueDate: updatedRequest.due_date?.toISOString(),
        completed_at: updatedRequest.completed_at?.toISOString(),
        requested_at: updatedRequest.requested_at.toISOString(),
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Update document request error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update document request',
        }
      });
    }
  },
};
