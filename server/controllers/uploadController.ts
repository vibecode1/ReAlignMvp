import { Request, Response } from 'express';
import { z } from 'zod';
import { UploadFileSchema } from '@shared/types';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config';
import { supabaseAdmin } from '../lib/supabase';

// Set up temp directory for uploads
const uploadDir = config.uploadsDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: config.maxFileSize, // 10MB max file size
  },
});

/**
 * Controller for file upload routes
 */
export const uploadController = {
  /**
   * Upload a file to a transaction
   */
  uploadFile: [
    // Multer middleware for handling file upload
    upload.single('file'),
    
    // Controller function
    async (req: AuthenticatedRequest, res: Response) => {
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

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: 'No file uploaded',
            }
          });
        }

        // Validate other form fields
        const docType = req.body.docType;
        const visibility = req.body.visibility;
        const documentRequestId = req.body.documentRequestId;

        const validation = UploadFileSchema.safeParse({
          docType,
          visibility,
          documentRequestId: documentRequestId || undefined,
        });

        if (!validation.success) {
          // Clean up temp file
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }

          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid upload data',
              details: validation.error.errors,
            }
          });
        }

        // Upload file to Supabase Storage
        const fileStream = fs.createReadStream(req.file.path);
        const filePath = `${transactionId}/${Date.now()}-${req.file.originalname}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('uploads')
          .upload(filePath, fileStream, {
            contentType: req.file.mimetype,
            upsert: false,
            duplex: 'half',
          });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        if (uploadError) {
          return res.status(500).json({
            error: {
              code: 'UPLOAD_FAILED',
              message: 'Failed to upload file to storage',
            }
          });
        }

        // Get public URL for the file
        const { data: publicUrl } = supabaseAdmin.storage
          .from('uploads')
          .getPublicUrl(filePath);

        // Store file metadata in database
        const upload = await storage.createUpload(
          {
            transaction_id: transactionId,
            doc_type: docType,
            visibility: visibility,
            file_url: publicUrl.publicUrl,
            file_name: req.file.originalname,
            content_type: req.file.mimetype,
            size_bytes: req.file.size,
          },
          transactionId,
          req.user.id,
          documentRequestId
        );

        // If this upload is associated with a document request, update the request status
        if (documentRequestId) {
          await storage.updateDocumentRequestStatus(documentRequestId, 'complete');
        }

        // Return upload details
        return res.status(201).json({
          id: upload.id,
          transactionId: upload.transaction_id,
          documentRequestId: upload.document_request_id,
          docType: upload.doc_type,
          fileName: upload.file_name,
          contentType: upload.content_type,
          sizeBytes: upload.size_bytes,
          fileUrl: upload.file_url,
          uploadedBy: upload.uploaded_by_user_id,
          visibility: upload.visibility,
          uploadedAt: upload.uploaded_at.toISOString(),
        });
      } catch (error) {
        console.error('File upload error:', error);
        
        // Clean up temp file if exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
          error: {
            code: 'SERVER_ERROR',
            message: 'Failed to process file upload',
          }
        });
      }
    }
  ],

  /**
   * Update file visibility (negotiator only)
   */
  async updateVisibility(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        });
      }

      // Only negotiators can change file visibility
      if (req.user.role !== 'negotiator') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only negotiators can change file visibility',
          }
        });
      }

      const { uploadId } = req.params;
      const { visibility } = req.body;

      // Validate visibility value
      if (!visibility || !['private', 'shared'].includes(visibility)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Visibility must be either "private" or "shared"',
          }
        });
      }

      // Get the upload to verify it exists
      const upload = await storage.getUploadById(uploadId);
      if (!upload) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Upload not found',
          }
        });
      }

      // Update the visibility in the database
      const updatedUpload = await storage.updateUploadVisibility(uploadId, visibility);

      return res.status(200).json({
        message: 'File visibility updated successfully',
        data: {
          id: updatedUpload.id,
          visibility: updatedUpload.visibility
        }
      });
    } catch (error) {
      console.error('Error updating file visibility:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred while updating file visibility',
        }
      });
    }
  },

  /**
   * Get uploads for a transaction
   */
  async getUploads(req: AuthenticatedRequest, res: Response) {
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

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      // Get uploads with pagination, filtered by user role and visibility
      const { data: uploads, total } = await storage.getUploadsByTransactionId(
        transactionId,
        req.user.id,
        req.user.role,
        page,
        limit
      );
      
      // Format uploads
      const formattedUploads = uploads.map(upload => ({
        id: upload.id,
        transactionId: upload.transaction_id,
        documentRequestId: upload.document_request_id,
        docType: upload.doc_type,
        fileName: upload.file_name,
        contentType: upload.content_type,
        sizeBytes: upload.size_bytes,
        fileUrl: upload.file_url,
        uploadedBy: upload.uploaded_by,
        visibility: upload.visibility,
        uploadedAt: upload.uploaded_at.toISOString(),
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: formattedUploads,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          perPage: limit,
        },
      });
    } catch (error) {
      console.error('Get uploads error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve uploads',
        }
      });
    }
  },
};
