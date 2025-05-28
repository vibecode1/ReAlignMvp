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

// Role-based permissions configuration
const ROLE_PERMISSIONS = {
  negotiator: [
    'transaction:create',
    'transaction:update',
    'transaction:delete',
    'transaction:manage_parties',
    'transaction:manage_phase',
    'document:request',
    'document:manage',
    'tracker_note:create',
    'tracker_note:update',
    'user_context:admin',
    'workflow_log:admin',
    'uba_form:create',
    'uba_form:update',
    'uba_form:view',
    'uba_form:view_own',
  ],
  homeowner: [
    'transaction:view',
    'transaction:upload_documents',
    'message:send',
    'message:view',
    'uba_form:create',
    'uba_form:update',
    'uba_form:view',
    'uba_form:view_own',
    'user_context:manage_own',
    'workflow_log:own',
  ],
  agent: [
    'transaction:view',
    'transaction:upload_documents',
    'message:send',
    'message:view',
    'document:view',
    'user_context:manage_own',
    'workflow_log:own',
  ],
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('!!! MIDDLEWARE TRACE: requireRole starting for roles:', allowedRoles);
    console.log('User from req:', req.user);

    if (!req.user) {
      console.log('!!! MIDDLEWARE TRACE: requireRole - no user found');
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('!!! MIDDLEWARE TRACE: requireRole - user role mismatch:', req.user.role);
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        }
      });
    }

    console.log('!!! MIDDLEWARE TRACE: requireRole - success, proceeding');
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('!!! MIDDLEWARE TRACE: requirePermission starting for:', permission);

    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        }
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];

    if (!userPermissions.includes(permission)) {
      console.log('!!! MIDDLEWARE TRACE: requirePermission - permission denied:', permission, 'for role:', req.user.role);
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission '${permission}' required`,
        }
      });
    }

    console.log('!!! MIDDLEWARE TRACE: requirePermission - success, proceeding');
    next();
  };
};

// Legacy middleware for backward compatibility
export const requireNegotiatorRole = requireRole(['negotiator']);

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