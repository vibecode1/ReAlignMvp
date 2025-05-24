import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import config from '../config';

// Custom request interface to add user property
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

/**
 * Middleware to verify JWT token from Supabase Auth
 */
export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log(`--- authenticateJWT MIDDLEWARE CALLED for ${req.method} ${req.originalUrl} ---`);
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
  
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid authentication format. Use: Bearer <token>',
      }
    });
  }
  
  try {
    // Add detailed console logging before token validation
    console.log('Token validation attempt:');
    console.log('  Token (first 10 chars):', token.substring(0, 10) + '...');
    console.log('  Token (last 10 chars):', '...' + token.substring(token.length - 10));
    console.log('  Supabase URL:', config.supabaseUrl);
    
    // Verify the JWT with Supabase Admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Supabase auth error details:');
      console.error('  Error message:', error.message);
      console.error('  Error status:', error.status || 'No status');
      console.error('  Full error:', error);
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid or expired token',
        }
      });
    }
    
    if (!data.user) {
      console.error('No user data returned from Supabase auth');
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid or expired token',
        }
      });
    }
    
    console.log(`authenticateJWT: User authenticated: ${data.user.email}, ID: ${data.user.id}`);
    console.log('authenticateJWT: User app_metadata from Supabase:', data.user.app_metadata);

    const role = (data.user.app_metadata?.role as string) || 'unknown';
    const name = (data.user.app_metadata?.name as string) || data.user.email;

    console.log(`authenticateJWT: Resolved role: '${role}', Resolved name: '${name}'`);
    
    // Set user information on the request
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: role,
      name: name
    };
    
    console.log(`!!! TRACE: authenticateJWT SUCCESS for ${req.user?.email}, path ${req.path}. Calling next().`);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
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
    // If user is a negotiator, they have access to all transactions they created - fixed for Tracker MVP
    if (req.user.role === 'negotiator') {
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .eq('negotiator_id', req.user.id)
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
      const { data: participant, error } = await supabaseAdmin
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
    
    console.log(`!!! TRACE: requireTransactionAccess SUCCESS for ${req.user?.email}, transactionId ${transactionId}, path ${req.path}. Calling next().`);
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
