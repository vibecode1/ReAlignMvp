import { Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller for transaction phase management - new for Tracker MVP
 */
export const phaseController = {
  /**
   * Update transaction phase
   */
  async updatePhase(req: AuthenticatedRequest, res: Response) {
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
      const { newPhase } = req.body;

      if (!newPhase || typeof newPhase !== 'string') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'New phase is required',
          }
        });
      }

      // Update the transaction phase
      const updatedTransaction = await storage.updateTransactionPhase(
        transactionId,
        newPhase,
        req.user.id
      );

      return res.status(200).json({
        id: updatedTransaction.id,
        title: updatedTransaction.title,
        property_address: updatedTransaction.property_address,
        currentPhase: updatedTransaction.current_phase,
        updated_at: updatedTransaction.updated_at.toISOString(),
      });
    } catch (error) {
      console.error('Update phase error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update transaction phase',
        }
      });
    }
  },

  /**
   * Get phase history for a transaction
   */
  async getPhaseHistory(req: AuthenticatedRequest, res: Response) {
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

      // Get phase history for this transaction
      const phaseHistory = await storage.getPhaseHistoryByTransactionId(transactionId);

      // Format the response
      const formattedHistory = phaseHistory.map(entry => ({
        id: entry.id,
        phase_key: entry.phase_key,
        set_by_negotiator_id: entry.set_by_negotiator_id,
        timestamp: entry.timestamp.toISOString(),
      }));

      return res.status(200).json({
        data: formattedHistory,
      });
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
};