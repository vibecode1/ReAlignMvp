import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Custom request interface to add user property
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

/**
 * Middleware to verify JWT token from Supabase Auth
 */
export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please provide a valid token.',
      }
    });
  }
  
  // Extract token from Bearer header
  const token = authHeader.split(' ')[1];
  console.log('auth.middleware: Authorization header received, extracted token length:', token ? token.length : 0);
  
  if (!token) {
    console.log('auth.middleware: No token found in Authorization header');
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid authentication format. Use: Bearer <token>',
      }
    });
  }
  
  try {
    console.log('auth.middleware: Verifying token with Supabase Auth');
    // Verify the JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('auth.middleware: Token verification error:', error.message);
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid or expired token',
        }
      });
    }
    
    if (!data.user) {
      console.error('auth.middleware: No user found for the provided token');
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid or expired token',
        }
      });
    }
    
    console.log('auth.middleware: Supabase user verified:', {
      id: data.user.id,
      email: data.user.email,
      role: data.user.app_metadata?.role || 'unknown'
    });
    
    // Set user information on the request
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: (data.user.app_metadata?.role as string) || 'unknown',
    };
    
    console.log('auth.middleware: User object set on request:', req.user);
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication failed. Please try again later.',
      }
    });
  }
};

/**
 * Middleware to check if user has the negotiator role
 */
export const requireNegotiatorRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      }
    });
  }
  
  if (req.user.role !== 'negotiator') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Only negotiators can perform this action',
      }
    });
  }
  
  next();
};

/**
 * Middleware to check if the negotiator's trial has expired
 * This should be used after requireNegotiatorRole
 */
export const checkNegotiatorTrial = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      }
    });
  }
  
  try {
    // Check if user is a negotiator with an active trial
    const { data: user, error } = await supabase
      .from('users')
      .select('trial_ends_at')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        }
      });
    }
    
    // If trial_ends_at exists and is in the past, trial has expired
    if (user.trial_ends_at && new Date(user.trial_ends_at) < new Date()) {
      return res.status(403).json({
        error: {
          code: 'TRIAL_EXPIRED',
          message: 'Your 30-day trial has expired. Please contact support to continue service.',
        }
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to verify trial status',
      }
    });
  }
};

/**
 * Middleware to check if user has access to a specific transaction
 */
export const requireTransactionAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      }
    });
  }
  
  const transactionId = req.params.id || req.params.transactionId;
  
  if (!transactionId) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Transaction ID is required',
      }
    });
  }
  
  try {
    // If user is a negotiator, they have access to all transactions they created
    if (req.user.role === 'negotiator') {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .eq('created_by', req.user.id)
        .single();
      
      if (error || !transaction) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found or you do not have access',
          }
        });
      }
    } else {
      // For other roles, check if they are a participant in the transaction
      const { data: participant, error } = await supabase
        .from('transaction_participants')
        .select('id')
        .eq('transaction_id', transactionId)
        .eq('user_id', req.user.id)
        .single();
      
      if (error || !participant) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found or you do not have access',
          }
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to verify transaction access',
      }
    });
  }
};
