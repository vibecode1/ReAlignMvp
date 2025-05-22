import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { LoginSchema, MagicLinkRequestSchema, NegotiatorRegistrationSchema } from '@shared/types';
import config from '../config';
import { storage } from '../storage';
import { notificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { addDays } from 'date-fns';

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

/**
 * Controller for authentication routes
 */
export const authController = {
  /**
   * Register a new negotiator with a 30-day trial
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
            details: validation.error.errors,
          }
        });
      }

      const { name, email, password } = validation.data;

      // Check if email already exists in Supabase directly
      const { data: existingUserData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingUserData) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use',
          }
        });
      }

      // Create a new Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'negotiator',
          }
        }
      });

      if (authError || !authData.user) {
        return res.status(500).json({
          error: {
            code: 'AUTH_ERROR',
            message: 'Failed to create authentication account',
          }
        });
      }

      // Calculate trial end date (30 days from now)
      const trialEndsAt = addDays(new Date(), 30);

      // Create user in our database with the Supabase user ID
      const insertData = {
        name,
        email,
        role: 'negotiator',
        trial_ends_at: trialEndsAt,
      };
      
      // Insert directly with Supabase to set the ID properly
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          ...insertData,
          id: authData.user.id,
        })
        .select()
        .single();
        
      if (userError || !userData) {
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create user record',
          }
        });
      }
      
      const newUser = userData;

      // Return user info and token
      return res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
          trial_ends_at: newUser.trial_ends_at,
        },
        token: authData.session?.access_token,
      });
    } catch (error) {
      console.error('Negotiator registration error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process registration request',
        }
      });
    }
  },
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

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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

      // Return user info and token
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: data.session?.access_token,
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
};
