
import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { WorkflowLogger } from '../services/workflowLogger';
import { z } from 'zod';

const OnboardingProfileSchema = z.object({
  preferred_ai_communication_style: z.enum(['professional', 'friendly', 'technical']).default('friendly'),
  ai_assistance_level: z.enum(['minimal', 'balanced', 'comprehensive']).default('balanced'),
  notification_preferences: z.object({
    email_updates: z.boolean().default(true),
    transaction_updates: z.boolean().default(true),
    ai_suggestions: z.boolean().default(true),
  }).optional(),
  experience_level: z.enum(['first_time', 'some_experience', 'experienced']).optional(),
  primary_use_case: z.enum(['buying', 'selling', 'refinancing', 'loss_mitigation']).optional(),
});

export const onboardingController = {
  /**
   * Initialize user context profile during onboarding
   */
  async initializeUserContext(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = OnboardingProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid onboarding data',
            details: validation.error.errors,
          }
        });
      }

      const profileData = validation.data;

      // Check if user already has a context profile
      const existingProfile = await storage.getUserContextProfile(req.user.id);
      
      if (existingProfile) {
        return res.status(409).json({
          error: {
            code: 'PROFILE_EXISTS',
            message: 'User context profile already exists',
          }
        });
      }

      // Set appropriate context recipes based on role and use case
      let activeContextRecipes = ['uba_form_completion_v1'];
      
      if (profileData.primary_use_case === 'loss_mitigation') {
        activeContextRecipes.push('bfs_document_review_v1');
      }

      // Create user context profile
      const contextProfile = await storage.createUserContextProfile({
        user_id: req.user.id,
        preferred_ai_communication_style: profileData.preferred_ai_communication_style,
        ai_assistance_level: profileData.ai_assistance_level,
        active_context_recipes: activeContextRecipes,
        notification_preferences: profileData.notification_preferences ? 
          JSON.stringify(profileData.notification_preferences) : null,
        workflow_step_preferences: JSON.stringify({
          experience_level: profileData.experience_level,
          primary_use_case: profileData.primary_use_case,
        }),
      });

      // Log onboarding completion
      await WorkflowLogger.logUserInteraction(req.user.id, {
        event_name: 'onboarding_completed',
        event_description: 'User completed initial onboarding and context setup',
        metadata: {
          ai_communication_style: profileData.preferred_ai_communication_style,
          ai_assistance_level: profileData.ai_assistance_level,
          primary_use_case: profileData.primary_use_case,
          experience_level: profileData.experience_level,
        },
        success: true,
      });

      return res.status(201).json({
        message: 'Onboarding completed successfully',
        profile: contextProfile,
      });

    } catch (error) {
      console.error('Onboarding initialization error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to initialize user context',
        }
      });
    }
  },

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      // Check if user has completed onboarding
      const contextProfile = await storage.getUserContextProfile(req.user.id);
      
      const hasCompletedOnboarding = !!contextProfile;

      return res.status(200).json({
        user_id: req.user.id,
        has_completed_onboarding: hasCompletedOnboarding,
        onboarding_step: hasCompletedOnboarding ? 'completed' : 'context_setup',
        profile_exists: hasCompletedOnboarding,
      });

    } catch (error) {
      console.error('Get onboarding status error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get onboarding status',
        }
      });
    }
  },

  /**
   * Update onboarding preferences
   */
  async updateOnboardingPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      const validation = OnboardingProfileSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preference data',
            details: validation.error.errors,
          }
        });
      }

      // Get existing profile
      const existingProfile = await storage.getUserContextProfile(req.user.id);
      if (!existingProfile) {
        return res.status(404).json({
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'User context profile not found',
          }
        });
      }

      // Update profile with new preferences
      const updatedProfile = await storage.updateUserContextProfile(
        existingProfile.id,
        req.user.id,
        {
          preferred_ai_communication_style: validation.data.preferred_ai_communication_style,
          ai_assistance_level: validation.data.ai_assistance_level,
          notification_preferences: validation.data.notification_preferences ? 
            JSON.stringify(validation.data.notification_preferences) : undefined,
        }
      );

      // Log preference update
      await WorkflowLogger.logUserInteraction(req.user.id, {
        event_name: 'onboarding_preferences_updated',
        event_description: 'User updated onboarding preferences',
        metadata: validation.data,
        success: true,
      });

      return res.status(200).json({
        message: 'Preferences updated successfully',
        profile: updatedProfile,
      });

    } catch (error) {
      console.error('Update onboarding preferences error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update preferences',
        }
      });
    }
  },
};
