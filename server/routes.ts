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
import { trackerNoteController } from "./controllers/trackerNoteController";
import { phaseController } from "./controllers/phaseController";
import { publicTrackerController } from "./controllers/publicTrackerController";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add middleware to log all incoming requests
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      console.log(`=== INCOMING REQUEST: ${req.method} ${req.url} ===`);
      console.log('Full path:', req.path);
      console.log('Original URL:', req.originalUrl);
    }
    next();
  });

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
  
  // ADD LOGGING MIDDLEWARE AT THE TOP OF transactionRouter
  transactionRouter.use((req, res, next) => {
    console.log(`--- transactionRouter received request: ${req.method} ${req.path} ---`);
    console.log('Request URL:', req.originalUrl);
    console.log('Authorization header present:', !!req.headers.authorization);
    if (req.headers.authorization) {
      console.log('Auth header (first 10 chars):', req.headers.authorization.substring(0, 20) + '...');
    }
    next();
  });
  
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
  
  // -- Tracker Note Routes (New for Tracker MVP) --
  transactionRouter.post('/:id/tracker-notes', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, trackerNoteController.createTrackerNote);
  transactionRouter.get('/:id/tracker-notes', authenticateJWT, requireTransactionAccess, trackerNoteController.getTrackerNotes);
  
  // -- Phase Management Routes (New for Tracker MVP) --
  transactionRouter.put('/:id/phase', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.updateTransactionPhase);
  transactionRouter.get('/:id/phase-history', authenticateJWT, requireTransactionAccess, transactionController.getTransactionPhaseHistory);
  
  // -- Tracker Link Route --
  transactionRouter.get('/:id/tracker-link', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.getTrackerLink);
  
  // -- Upload Routes --
  apiRouter.post('/uploads/:transactionId', authenticateJWT, requireTransactionAccess, uploadController.uploadFile);
  apiRouter.get('/uploads/:transactionId', authenticateJWT, requireTransactionAccess, uploadController.getUploads);
  apiRouter.patch('/uploads/:uploadId/visibility', authenticateJWT, requireNegotiatorRole, uploadController.updateUploadVisibility);
  
  // -- Notification Device Token Routes --
  const notificationRouter = express.Router();
  
  // Device token endpoints
  notificationRouter.post('/device-tokens', authenticateJWT, notificationController.registerDeviceToken);
  notificationRouter.get('/device-tokens', authenticateJWT, notificationController.getUserDeviceTokens);
  notificationRouter.delete('/device-tokens/:token', authenticateJWT, notificationController.unregisterDeviceToken);
  
  // -- Public Tracker Routes (New for Tracker MVP) --
  apiRouter.get('/tracker/:transactionId', publicTrackerController.getTrackerByToken);
  apiRouter.post('/tracker/unsubscribe', publicTrackerController.updateSubscription);

  // Register routers
  console.log('=== REGISTERING API ROUTERS ===');
  console.log('Registering auth router at /auth');
  apiRouter.use('/auth', authRouter);
  console.log('Registering transaction router at /transactions');
  apiRouter.use('/transactions', transactionRouter);
  console.log('Registering notification router at /notifications');
  apiRouter.use('/notifications', notificationRouter);
  
  // Register API router under /api/v1
  console.log('Registering main API router at /api/v1');
  app.use('/api/v1', apiRouter);
  console.log('=== ROUTER REGISTRATION COMPLETE ===');
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to ReAlign WebSocket server'
    }));
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types here
        // For now, just echo back the message
        ws.send(JSON.stringify({
          type: 'echo',
          data
        }));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  return httpServer;
}
