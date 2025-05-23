import { Request, Response } from 'express';
import { LoginSchema, MagicLinkRequestSchema, NegotiatorRegistrationSchema } from '@shared/types';
import config from '../config';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { supabaseAuthClient, supabaseAdmin } from '../lib/supabase';

/**
 * Controller for authentication routes
 */
export const authController = {
  /**
   * Login with email and password (for negotiators)
   */
  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid login credentials',
            details: validation.error.errors,
          }
        });
      }

      const { email, password } = validation.data;

      // Authenticate with Supabase using auth client
      console.log('Login attempt for:', email);
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          }
        });
      }

      // Fetch user details from our database
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found',
          }
        });
      }

      // Check if user is a negotiator
      if (user.role !== 'negotiator') {
        return res.status(403).json({
          error: {
            code: 'UNAUTHORIZED_ROLE',
            message: 'Only negotiators can login with email and password',
          }
        });
      }

      // Return user info and session data with proper token
      console.log('Login successful for:', email, 'with role:', user.role);
      console.log('Access token generated (first 10 chars):', data.session?.access_token?.substring(0, 10) + '...');
      
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process login request',
        }
      });
    }
  },

  /**
   * Generate and send a magic link
   */
  async sendMagicLink(req: Request, res: Response) {
    try {
      // Validate request body
      const validation = MagicLinkRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.errors,
          }
        });
      }

      const { email, phone } = validation.data;

      // For MVP, only support email-based magic links
      if (!email) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Email is required for magic link authentication',
          }
        });
      }

      // Check if user exists in our database
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or not invited to any transaction',
          }
        });
      }

      // Generate and send magic link through notification service
      const success = await notificationService.sendMagicLink(email);

      if (!success) {
        return res.status(500).json({
          error: {
            code: 'SEND_FAILURE',
            message: 'Failed to send magic link',
          }
        });
      }

      return res.status(200).json({
        message: 'Magic link sent successfully. Please check your email/SMS.',
      });
    } catch (error) {
      console.error('Magic link error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process magic link request',
        }
      });
    }
  },

  /**
   * Resend a magic link
   */
  async resendMagicLink(req: Request, res: Response) {
    try {
      // Validate request body
      const validation = MagicLinkRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.errors,
          }
        });
      }

      const { email, phone } = validation.data;

      // For MVP, only support email-based magic links
      if (!email) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Email is required for magic link authentication',
          }
        });
      }

      // Check if user exists in our database
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or not invited to any transaction',
          }
        });
      }

      // Generate and send magic link through notification service
      const success = await notificationService.sendMagicLink(email);

      if (!success) {
        return res.status(500).json({
          error: {
            code: 'SEND_FAILURE',
            message: 'Failed to resend magic link',
          }
        });
      }

      return res.status(200).json({
        message: 'Magic link resent successfully.',
      });
    } catch (error) {
      console.error('Magic link resend error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process magic link resend request',
        }
      });
    }
  },

  /**
   * Get current authenticated user's details
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      // Fetch detailed user information from database
      const user = await storage.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          }
        });
      }

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve user information',
        }
      });
    }
  },

  /**
   * Register a new negotiator
   */
  async registerNegotiator(req: Request, res: Response) {
    try {
      // Validate request body
      const validation = NegotiatorRegistrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration data',
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        });
      }

      const { name, email, password } = validation.data;

      // Check for existing user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.warn(`Attempt to register existing email: ${email}`);
        return res.status(409).json({
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'An account with this email already exists.'
          }
        });
      }

      // Create Supabase user using auth client
      console.log(`Attempting Supabase signUp for ${email}`);
      const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error(`Supabase signUp error for ${email}:`, authError?.message);
        return res.status(400).json({
          error: {
            code: 'SIGNUP_FAILED_SUPABASE',
            message: authError?.message || 'Failed to create Supabase auth user.'
          }
        });
      }
      console.log(`Supabase user created for ${email} with ID: ${authData.user.id}`);

      // CRITICAL STEP: Update app_metadata with role and name using ADMIN client
      console.log(`Attempting to set app_metadata for user ${authData.user.id}`);
      const { error: adminUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id,
        { 
          app_metadata: { 
            role: 'negotiator', 
            name: name, 
            internal_user_id: authData.user.id 
          } 
        }
      );

      if (adminUpdateError) {
        console.error(`Failed to update Supabase user app_metadata for ${authData.user.id}:`, adminUpdateError.message);
        // Rollback: Attempt to delete the Supabase auth user if app_metadata update fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          console.log(`Rolled back Supabase user creation for ${authData.user.id} due to app_metadata failure.`);
        } catch (deleteError: any) {
          console.error(`Failed to rollback Supabase user ${authData.user.id}:`, deleteError.message);
        }
        return res.status(500).json({
          error: {
            code: 'USER_SETUP_ERROR',
            message: 'Failed to set user role during registration. Registration has been rolled back. Please try again or contact support.'
          }
        });
      }
      console.log(`Successfully set app_metadata for user ${authData.user.id}: role=negotiator, name=${name}`);

      // Create local user record in your application's database
      console.log(`Creating local user record for ${email}`);
      try {
        await storage.createUser({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          role: 'negotiator'
        });
        console.log(`Local user record created for ${email}`);
      } catch (storageError) {
        console.error('Failed to create local user record:', storageError);
        return res.status(500).json({
          error: {
            code: 'USER_CREATION_FAILED',
            message: 'Failed to create user profile'
          }
        });
      }

      res.status(201).json({
        message: "Negotiator registration successful. Please check your email to confirm your account."
      });
    } catch (error) {
      console.error('Register negotiator error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }
};
