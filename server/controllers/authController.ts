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
      console.log('=== LOGIN REQUEST RECEIVED ===');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Environment check - Supabase URL exists:', !!config.supabaseUrl);
      console.log('Environment check - Supabase Anon Key exists:', !!config.supabaseAnonKey);
      
      // Validate request body
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('Validation failed:', validation.error.errors);
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid login credentials',
            details: validation.error.errors,
          }
        });
      }

      const { email, password } = validation.data;
      console.log('Login attempt for email:', email);
      console.log('Password length:', password.length);

      // Authenticate with Supabase using auth client
      console.log('Attempting Supabase authentication...');
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('=== SUPABASE LOGIN ERROR ===');
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('=== END SUPABASE ERROR ===');
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          }
        });
      }

      console.log('Supabase authentication successful');
      console.log('Session exists:', !!data.session);
      console.log('User exists:', !!data.user);

      // Fetch user details from our database
      console.log('Attempting to fetch user from database with email:', email);
      const user = await storage.getUserByEmail(email);
      console.log('Database lookup result:', user ? 'User found' : 'User not found');
      console.log('User object:', user);

      if (!user) {
        console.log('USER_NOT_FOUND error - email used for lookup:', email);
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
   * Send password reset email
   */
  async resetPassword(req: Request, res: Response) {
    try {
      console.log('=== PASSWORD RESET REQUEST ===');
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
          }
        });
      }

      console.log('Password reset requested for:', email);

      // Check if user exists in our database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        return res.status(200).json({
          message: 'If an account with that email exists, a password reset email has been sent.',
        });
      }

      // Send password reset email via Supabase
      // Use the request origin for the redirect URL, but fallback to a deployed URL if needed
      const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/update-password`,
      });

      if (error) {
        console.error('Supabase password reset error:', error);
        return res.status(500).json({
          error: {
            code: 'RESET_ERROR',
            message: 'Failed to send password reset email',
          }
        });
      }

      console.log('Password reset email sent successfully to:', email);
      
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process password reset request',
        }
      });
    }
  },

  /**
   * Update password with reset token
   */
  async updatePassword(req: Request, res: Response) {
    try {
      console.log('=== PASSWORD UPDATE REQUEST ===');
      
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and new password are required',
          }
        });
      }

      console.log('Password update attempt with token');

      // Update password via Supabase
      const { error } = await supabaseAuthClient.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Supabase password update error:', error);
        return res.status(400).json({
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update password',
          }
        });
      }

      console.log('Password updated successfully');
      
      return res.status(200).json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Password update error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update password',
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
import { Request, Response } from 'express';
import { storage } from '../storage';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import crypto from 'crypto';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

// Validation schemas
const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['homeowner', 'negotiator', 'agent']),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const UpdatePasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const MagicLinkSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['homeowner', 'agent']).optional(),
});

export const authController = {
  /**
   * Register a new user (all roles)
   */
  async register(req: Request, res: Response) {
    try {
      const validation = RegisterUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration data',
            details: validation.error.errors,
          }
        });
      }

      const { email, password, name, role } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          }
        });
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return res.status(500).json({
          error: {
            code: 'AUTH_ERROR',
            message: 'Failed to create user account',
          }
        });
      }

      // Create user in our database
      const user = await storage.createUser({
        id: authUser.user.id,
        email,
        name,
        role,
      });

      // Create initial user context profile
      if (role !== 'negotiator') {
        await storage.createUserContextProfile({
          user_id: user.id,
          preferred_ai_communication_style: 'friendly',
          ai_assistance_level: 'balanced',
          active_context_recipes: ['uba_form_completion_v1'],
        });
      }

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to register user',
        }
      });
    }
  },

  /**
   * Register a negotiator (existing endpoint - enhanced)
   */
  async registerNegotiator(req: Request, res: Response) {
    try {
      const registrationData = { ...req.body, role: 'negotiator' };
      const validation = RegisterUserSchema.safeParse(registrationData);
      
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration data',
            details: validation.error.errors,
          }
        });
      }

      // Use the same registration logic
      req.body = registrationData;
      return this.register(req, res);
    } catch (error) {
      console.error('Negotiator registration error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to register negotiator',
        }
      });
    }
  },

  /**
   * User login
   */
  async login(req: Request, res: Response) {
    try {
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid login data',
            details: validation.error.errors,
          }
        });
      }

      const { email, password } = validation.data;

      // Authenticate with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
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

      // Get user from our database
      const user = await storage.getUserById(data.user.id);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found',
          }
        });
      }

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to login',
        }
      });
    }
  },

  /**
   * Get current user (existing endpoint)
   */
  async getCurrentUser(req: any, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          }
        });
      }

      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get user information',
        }
      });
    }
  },

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const validation = ResetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reset data',
            details: validation.error.errors,
          }
        });
      }

      const { email } = validation.data;

      // Send password reset email via Supabase
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
          error: {
            code: 'RESET_ERROR',
            message: 'Failed to send reset email',
          }
        });
      }

      return res.status(200).json({
        message: 'Password reset email sent',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process password reset',
        }
      });
    }
  },

  /**
   * Update password
   */
  async updatePassword(req: Request, res: Response) {
    try {
      const validation = UpdatePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.errors,
          }
        });
      }

      const { token, password } = validation.data;

      // Update password via Supabase
      const { error } = await supabaseAdmin.auth.admin.updateUserById(token, {
        password,
      });

      if (error) {
        console.error('Update password error:', error);
        return res.status(400).json({
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update password',
          }
        });
      }

      return res.status(200).json({
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update password',
        }
      });
    }
  },

  /**
   * Send magic link (existing endpoints - enhanced)
   */
  async sendMagicLink(req: Request, res: Response) {
    try {
      const validation = MagicLinkSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid magic link data',
            details: validation.error.errors,
          }
        });
      }

      const { email, role } = validation.data;

      // Generate magic link token
      const token = crypto.randomUUID();

      // Send magic link email
      await notificationService.sendMagicLink(email, token, role || 'homeowner');

      return res.status(200).json({
        message: 'Magic link sent successfully',
      });
    } catch (error) {
      console.error('Send magic link error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to send magic link',
        }
      });
    }
  },

  /**
   * Resend magic link
   */
  async resendMagicLink(req: Request, res: Response) {
    // Use the same logic as sendMagicLink
    return this.sendMagicLink(req, res);
  },
};
