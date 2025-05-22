import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import config from "./config";
import { authenticateJWT, requireNegotiatorRole, requireTransactionAccess } from "./middleware/auth";
import { authController } from "./controllers/authController";
import { transactionController } from "./controllers/transactionController";
import { messageController } from "./controllers/messageController";
import { documentController } from "./controllers/documentController";
import { uploadController } from "./controllers/uploadController";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - all prefixed with /api/v1
  const apiRouter = express.Router();
  
  // -- Authentication Routes --
  const authRouter = express.Router();
  
  // Rate limiting for magic links (3 per hour)
  const magicLinkLimiter = rateLimit({
    windowMs: config.magicLinkRateLimit.windowMs,
    max: config.magicLinkRateLimit.max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      }
    },
  });
  
  // Auth endpoints
  authRouter.post('/login', authController.login);
  authRouter.post('/magic-link', magicLinkLimiter, authController.sendMagicLink);
  authRouter.post('/magic-link/resend', magicLinkLimiter, authController.resendMagicLink);
  authRouter.get('/me', authenticateJWT, authController.getCurrentUser);
  
  // -- Transaction Routes --
  const transactionRouter = express.Router();
  
  // Transaction endpoints
  transactionRouter.post('/', authenticateJWT, requireNegotiatorRole, transactionController.createTransaction);
  transactionRouter.get('/', authenticateJWT, transactionController.getTransactions);
  transactionRouter.get('/:id', authenticateJWT, requireTransactionAccess, transactionController.getTransaction);
  transactionRouter.patch('/:id', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.updateTransaction);
  
  // -- Party Status Routes --
  transactionRouter.get('/:id/parties', authenticateJWT, requireTransactionAccess, transactionController.getParties);
  transactionRouter.patch('/:transactionId/parties/:userId', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.updatePartyStatus);
  
  // -- Message Routes --
  transactionRouter.get('/:id/messages', authenticateJWT, requireTransactionAccess, messageController.getMessages);
  transactionRouter.post('/:id/messages', authenticateJWT, requireTransactionAccess, messageController.createMessage);
  
  // -- Document Request Routes --
  transactionRouter.post('/:id/doc-requests', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, documentController.createDocumentRequest);
  transactionRouter.get('/:id/doc-requests', authenticateJWT, requireTransactionAccess, documentController.getDocumentRequests);
  
  // Document request update route (not under transaction namespace)
  apiRouter.patch('/doc-requests/:requestId', authenticateJWT, requireNegotiatorRole, documentController.updateDocumentRequest);
  
  // -- Upload Routes --
  apiRouter.post('/uploads/:transactionId', authenticateJWT, requireTransactionAccess, uploadController.uploadFile);
  apiRouter.get('/uploads/:transactionId', authenticateJWT, requireTransactionAccess, uploadController.getUploads);
  
  // Register routers
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/transactions', transactionRouter);
  
  // Register API router under /api/v1
  app.use('/api/v1', apiRouter);
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
