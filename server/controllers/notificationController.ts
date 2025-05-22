import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';

// Schema for validating device token registration requests
const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(1, "Device token is required"),
  type: z.enum(['fcm', 'apn', 'web'], {
    errorMap: () => ({ message: "Token type must be one of: fcm, apn, web" })
  })
});

/**
 * Controller for notification device token management
 */
export const notificationController = {
  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        });
      }

      // Validate request body
      const result = RegisterDeviceTokenSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request data',
            details: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }
      
      const { token, type } = result.data;
      
      // Save the device token
      const deviceToken = await storage.saveUserDeviceToken(req.user.id, token, type);
      
      return res.status(201).json({
        message: 'Device token registered successfully',
        data: {
          id: deviceToken.id,
          token: deviceToken.device_token,
          type: deviceToken.token_type
        }
      });
    } catch (error) {
      console.error('Error registering device token:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred while registering the device token',
        }
      });
    }
  },
  
  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        });
      }

      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Token parameter is required',
          }
        });
      }
      
      // Delete the device token
      await storage.deleteUserDeviceToken(token);
      
      return res.status(200).json({
        message: 'Device token unregistered successfully'
      });
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred while unregistering the device token',
        }
      });
    }
  },

  /**
   * Get all device tokens for the current user
   */
  async getUserDeviceTokens(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          }
        });
      }
      
      // Get all device tokens for the user
      const tokens = await storage.getUserDeviceTokens(req.user.id);
      
      return res.status(200).json({
        data: tokens.map(token => ({
          id: token.id,
          token: token.device_token,
          type: token.token_type,
          created_at: token.created_at
        }))
      });
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred while retrieving device tokens',
        }
      });
    }
  }
};