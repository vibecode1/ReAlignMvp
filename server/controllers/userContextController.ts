
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

// Schema for creating/updating user context profiles
const CreateUserContextProfileSchema = z.object({
  transaction_id: z.string().uuid().optional(),
  preferred_ai_communication_style: z.enum(['professional', 'friendly', 'technical']).optional(),
  ai_assistance_level: z.enum(['minimal', 'balanced', 'comprehensive']).optional(),
  active_context_recipes: z.array(z.string()).optional(),
  context_recipe_customizations: z.string().optional(),
  uba_completion_patterns: z.string().optional(),
  frequent_form_sections: z.array(z.string()).optional(),
  notification_preferences: z.string().optional(),
  workflow_step_preferences: z.string().optional(),
  ai_interaction_history: z.string().optional(),
  form_completion_velocity: z.number().optional(),
  error_patterns: z.string().optional(),
});

const UpdateUserContextProfileSchema = CreateUserContextProfileSchema.partial();

export const userContextController = {
  /**
   * Create a new user context profile
   */
  async createProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = CreateUserContextProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: validation.error.errors,
          }
        });
      }

      const profileData = {
        user_id: req.user.id,
        ...validation.data,
      };

      const profile = await storage.createUserContextProfile(profileData);

      return res.status(201).json(profile);
    } catch (error) {
      console.error('Create user context profile error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create user context profile',
        }
      });
    }
  },

  /**
   * Get user context profile by user ID and optional transaction ID
   */
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { transactionId } = req.query;
      
      const profile = await storage.getUserContextProfile(
        req.user.id, 
        transactionId as string
      );

      if (!profile) {
        return res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'User context profile not found',
          }
        });
      }

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Get user context profile error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve user context profile',
        }
      });
    }
  },

  /**
   * Update user context profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const { profileId } = req.params;

      const validation = UpdateUserContextProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: validation.error.errors,
          }
        });
      }

      const updatedProfile = await storage.updateUserContextProfile(
        profileId,
        req.user.id,
        validation.data
      );

      if (!updatedProfile) {
        return res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'User context profile not found or access denied',
          }
        });
      }

      return res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Update user context profile error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update user context profile',
        }
      });
    }
  },

  /**
   * Get all profiles for a user
   */
  async getUserProfiles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const profiles = await storage.getUserContextProfiles(req.user.id);

      return res.status(200).json(profiles);
    } catch (error) {
      console.error('Get user context profiles error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve user context profiles',
        }
      });
    }
  },
};
