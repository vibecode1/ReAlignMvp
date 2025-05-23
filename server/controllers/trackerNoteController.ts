import { Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller for tracker note routes - new for Tracker MVP
 */
export const trackerNoteController = {
  /**
   * Create a new tracker note
   */
  async createTrackerNote(req: AuthenticatedRequest, res: Response) {
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
      const { note_text } = req.body;

      if (!note_text || typeof note_text !== 'string') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Note text is required',
          }
        });
      }

      // Create the tracker note
      const trackerNote = await storage.createTrackerNote({
        transaction_id: transactionId,
        note_text,
        negotiator_id: req.user.id,
      });

      return res.status(201).json({
        id: trackerNote.id,
        note_text: trackerNote.note_text,
        negotiator_id: trackerNote.negotiator_id,
        created_at: trackerNote.created_at.toISOString(),
      });
    } catch (error) {
      console.error('Create tracker note error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create tracker note',
        }
      });
    }
  },

  /**
   * Get tracker notes for a transaction
   */
  async getTrackerNotes(req: AuthenticatedRequest, res: Response) {
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

      // Get all tracker notes for this transaction
      const trackerNotes = await storage.getTrackerNotesByTransactionId(transactionId);

      // Format the response
      const formattedNotes = trackerNotes.map(note => ({
        id: note.id,
        note_text: note.note_text,
        negotiator_id: note.negotiator_id,
        created_at: note.created_at.toISOString(),
      }));

      return res.status(200).json({
        data: formattedNotes,
      });
    } catch (error) {
      console.error('Get tracker notes error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve tracker notes',
        }
      });
    }
  },
};