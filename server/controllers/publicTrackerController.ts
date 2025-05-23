import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Controller for public tracker access via magic links - new for Tracker MVP
 */
export const publicTrackerController = {
  /**
   * Get transaction details via magic link token (public access)
   */
  async getTrackerByToken(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Magic link token is required',
          }
        });
      }

      // Validate the magic link token
      const validation = await storage.validateMagicLinkToken(token);
      
      if (!validation) {
        return res.status(401).json({
          error: {
            code: 'INVALID_OR_EXPIRED_TOKEN',
            message: 'Invalid or expired magic link. Please contact your negotiator for a new link.',
          }
        });
      }

      const { subscription, transaction } = validation;

      // Verify the transaction ID matches
      if (transaction.id !== transactionId) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Token does not grant access to this transaction',
          }
        });
      }

      // Get transaction data for public view
      const docRequests = await storage.getDocumentRequestsByTransactionId(transactionId, 1, 50);
      const trackerNotes = await storage.getTrackerNotesByTransactionId(transactionId);
      const phaseHistory = await storage.getPhaseHistoryByTransactionId(transactionId);

      // Format document requests for public view (show only status for the party's role)
      const filteredDocRequests = docRequests.data
        .filter(req => req.assigned_party_role === subscription.party_role)
        .map(req => ({
          id: req.id,
          document_name: req.document_name,
          status: req.status,
          requested_at: req.requested_at.toISOString(),
          due_date: req.due_date?.toISOString(),
        }));

      // Format tracker notes for public view
      const formattedNotes = trackerNotes.map(note => ({
        id: note.id,
        note_text: note.note_text,
        created_at: note.created_at.toISOString(),
      }));

      // Format phase history for public view
      const formattedHistory = phaseHistory.map(entry => ({
        phase_key: entry.phase_key,
        timestamp: entry.timestamp.toISOString(),
      }));

      const response = {
        transaction: {
          id: transaction.id,
          title: transaction.title,
          property_address: transaction.property_address,
          current_phase: transaction.current_phase,
        },
        party_role: subscription.party_role,
        document_requests: filteredDocRequests,
        tracker_notes: formattedNotes,
        phase_history: formattedHistory,
        subscription_status: subscription.is_subscribed,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Get public tracker error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve tracker information',
        }
      });
    }
  },

  /**
   * Update email subscription status (unsubscribe)
   */
  async updateSubscription(req: Request, res: Response) {
    try {
      const { subscription_id, is_subscribed } = req.body;

      if (!subscription_id || typeof is_subscribed !== 'boolean') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Subscription ID and subscription status are required',
          }
        });
      }

      // Update subscription status
      const updatedSubscription = await storage.updateSubscriptionStatus(
        subscription_id,
        is_subscribed
      );

      return res.status(200).json({
        id: updatedSubscription.id,
        is_subscribed: updatedSubscription.is_subscribed,
        message: is_subscribed 
          ? 'Successfully subscribed to email updates' 
          : 'Successfully unsubscribed from email updates',
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update subscription status',
        }
      });
    }
  },
};