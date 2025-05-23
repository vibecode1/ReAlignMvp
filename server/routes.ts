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
import { notificationController } from "./controllers/notificationController";
import { WebSocketServer } from "ws";

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
  authRouter.post('/register/negotiator', authController.registerNegotiator);
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
  apiRouter.patch('/uploads/:uploadId/visibility', authenticateJWT, requireNegotiatorRole, uploadController.updateVisibility);
  apiRouter.get('/uploads/:uploadId/download-link', authenticateJWT, uploadController.generateDownloadUrl);
  
  // -- Notification Device Token Routes --
  const notificationRouter = express.Router();
  
  // Device token endpoints
  notificationRouter.post('/device-tokens', authenticateJWT, notificationController.registerDeviceToken);
  notificationRouter.get('/device-tokens', authenticateJWT, notificationController.getUserDeviceTokens);
  notificationRouter.delete('/device-tokens/:token', authenticateJWT, notificationController.unregisterDeviceToken);
  
  // Register routers
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/transactions', transactionRouter);
  apiRouter.use('/notifications', notificationRouter);
  
  // Register API router under /api/v1
  app.use('/api/v1', apiRouter);
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  const clients = new Map<string, Set<any>>(); // Map transaction IDs to connected clients
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userTransactions: string[] = [];
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle subscription to transaction updates
        if (data.type === 'subscribe' && data.transactionId) {
          userTransactions.push(data.transactionId);
          
          // Add client to transaction group
          if (!clients.has(data.transactionId)) {
            clients.set(data.transactionId, new Set());
          }
          clients.get(data.transactionId)!.add(ws);
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            transactionId: data.transactionId
          }));
        }
        
        // Handle unsubscription
        if (data.type === 'unsubscribe' && data.transactionId) {
          userTransactions = userTransactions.filter(id => id !== data.transactionId);
          
          if (clients.has(data.transactionId)) {
            clients.get(data.transactionId)!.delete(ws);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove client from all transaction groups
      userTransactions.forEach(transactionId => {
        if (clients.has(transactionId)) {
          clients.get(transactionId)!.delete(ws);
        }
      });
    });
  });
  
  // Export broadcast function for use in controllers
  (global as any).broadcastToTransaction = (transactionId: string, event: any) => {
    if (clients.has(transactionId)) {
      const message = JSON.stringify(event);
      clients.get(transactionId)!.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  };
  
  return httpServer;
}
