import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import config from "./config";
import { authenticateJWT, requireNegotiatorRole, requireTransactionAccess, requireRole, requirePermission } from "./middleware/auth";
import { authController } from "./controllers/authController";
import { transactionController } from "./controllers/transactionController";
import { messageController } from "./controllers/messageController";
import { documentController } from "./controllers/documentController";
import { uploadController } from "./controllers/uploadController";
import { notificationController } from "./controllers/notificationController";
import { trackerNoteController } from "./controllers/trackerNoteController";
import { phaseController } from "./controllers/phaseController";
import { publicTrackerController } from "./controllers/publicTrackerController";
import { userContextController } from "./controllers/userContextController";
import { workflowLogController } from "./controllers/workflowLogController";
import { ubaFormController } from "./controllers/ubaFormController";
import { simpleDocumentController } from "./controllers/simpleDocumentController";
import { onboardingController } from "./controllers/onboardingController";
import { loeDrafterController } from "./controllers/loeDrafterController";
import { documentChecklistController } from './controllers/documentChecklistController';
import financialCalculatorController from './controllers/financialCalculatorController';
import ClaudeController from "./controllers/claudeController.js";
import OpenAIController from "./controllers/openaiController.js";
import { aiConversationController } from './controllers/aiConversationController';
import { caseMemoryController } from './controllers/caseMemoryController';
import { aiServiceController } from './controllers/aiServiceController';
import { documentIntelligenceController } from './controllers/documentIntelligenceController';
import { learningPatternController } from './controllers/learningPatternController';
import { WebSocketServer } from "ws";
import publicRouter from "./routes/public";

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

  // Add debugging middleware for auth routes
  authRouter.use((req, res, next) => {
    console.log(`--- authRouter received request: ${req.method} ${req.path} ---`);
    next();
  });

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

  // Test endpoint for debugging
  authRouter.get('/test', (req, res) => {
    console.log('=== TEST ENDPOINT HIT ===');
    res.json({ message: 'Auth router is working!', timestamp: new Date().toISOString() });
  });

  // Validate auth controller methods exist
  console.log('Auth controller methods:', Object.keys(authController));

  // Auth endpoints
  if (authController.register) authRouter.post('/register', authController.register);
  if (authController.login) authRouter.post('/login', authController.login);
  if (authController.resetPassword) authRouter.post('/reset-password', authController.resetPassword);
  if (authController.updatePassword) authRouter.post('/update-password', authController.updatePassword);
  if (authController.sendMagicLink) authRouter.post('/magic-link', magicLinkLimiter, authController.sendMagicLink);
  if (authController.resendMagicLink) authRouter.post('/magic-link/resend', magicLinkLimiter, authController.resendMagicLink);
  if (authController.registerNegotiator) authRouter.post('/register/negotiator', authController.registerNegotiator);
  if (authController.getCurrentUser) authRouter.get('/me', authenticateJWT, authController.getCurrentUser);

  // -- Transaction Routes --
  const transactionRouter = express.Router();

  // ADD COMPREHENSIVE LOGGING MIDDLEWARE AT THE TOP OF transactionRouter
  transactionRouter.use((req, res, next) => {
    console.log(`\n=== TRANSACTION ROUTER DEBUG ===`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`Base URL: ${req.baseUrl}`);
    console.log(`Route Parameters:`, req.params);
    console.log(`Query Parameters:`, req.query);
    console.log(`Testing route match for POST /:id/parties:`);
    console.log(`  Path matches /POST .*/parties pattern: ${req.method === 'POST' && req.path.includes('/parties')}`);
    console.log(`  Path structure: ${req.path.split('/')}`);
    console.log('Authorization header present:', !!req.headers.authorization);
    if (req.headers.authorization) {
      console.log('Auth header (first 10 chars):', req.headers.authorization.substring(0, 20) + '...');
    }
    console.log(`=== END TRANSACTION ROUTER DEBUG ===\n`);
    next();
  });

  // Transaction endpoints
  transactionRouter.post('/', (req, res, next) => {
    console.log('!!! TRACE: transactionRouter POST / handler');
    next();
  }, authenticateJWT, requireNegotiatorRole, transactionController.createTransaction);

  transactionRouter.get('/', (req, res, next) => {
    console.log('!!! TRACE: transactionRouter GET / handler');
    next();
  }, authenticateJWT, transactionController.getTransactions);

  // -- Add Parties to Transaction Route (NEW) --
  transactionRouter.post(
    '/:id/parties',
    (req, res, next) => {
      console.log('!!! TRACE: transactionRouter POST /:id/parties handler - path:', req.path);
      next();
    },
    authenticateJWT,         // Ensure user is authenticated
    requireNegotiatorRole,   // Ensure user is a negotiator
    requireTransactionAccess, // Ensure negotiator has access to this transaction :id
    transactionController.addPartiesToTransaction // New controller method
  );

  transactionRouter.get('/:id/parties', (req, res, next) => {
    console.log('!!! TRACE: transactionRouter GET /:id/parties handler - path:', req.path);
    next();
  }, authenticateJWT, requireTransactionAccess, transactionController.getParties);

  transactionRouter.patch('/:transactionId/parties/:userId', (req, res, next) => {
    console.log('!!! TRACE: transactionRouter PATCH /:transactionId/parties/:userId handler - path:', req.path);
    next();
  }, authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.updatePartyStatus);

  // Generic transaction routes (must be after specific sub-routes)
  console.log('!!! TRACE: About to define transactionRouter.get("/:id", transactionController.getTransaction)');
  transactionRouter.get('/:id', 
    (req, res, next) => { 
      console.log('!!! TRACE: PRE-AUTH for GET /:id - path:', req.path); 
      next(); 
    },
    authenticateJWT,
    (req, res, next) => { 
      console.log('!!! TRACE: POST-AUTH, PRE-ACCESS for GET /:id - path:', req.path); 
      next(); 
    },
    requireTransactionAccess,
    (req, res, next) => { 
      console.log('!!! TRACE: POST-ACCESS, PRE-CONTROLLER for GET /:id - path:', req.path); 
      next(); 
    },
    transactionController.getTransaction
  );
  transactionRouter.patch('/:id', authenticateJWT, requireNegotiatorRole, requireTransactionAccess, transactionController.updateTransaction);

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

  // -- Phase 0 - User Context Profile Routes --
  const userContextRouter = express.Router();
  userContextRouter.post('/', authenticateJWT, requirePermission('user_context:manage_own'), userContextController.createProfile);
  userContextRouter.get('/', authenticateJWT, requirePermission('user_context:manage_own'), userContextController.getProfile);
  userContextRouter.get('/all', authenticateJWT, requirePermission('user_context:manage_own'), userContextController.getUserProfiles);
  userContextRouter.put('/:profileId', authenticateJWT, requirePermission('user_context:manage_own'), userContextController.updateProfile);

  // -- Phase 0 - Workflow Logging Routes --
  const workflowLogRouter = express.Router();
  workflowLogRouter.post('/events', authenticateJWT, requirePermission('workflow_log:own'), workflowLogController.logEvent);
  workflowLogRouter.get('/events', authenticateJWT, requirePermission('workflow_log:own'), workflowLogController.getEvents);
  workflowLogRouter.get('/events/summary', authenticateJWT, requireRole(['negotiator']), workflowLogController.getEventsSummary);

  // -- Phase 0 - UBA Form Routes --
  const ubaFormRouter = express.Router();
  ubaFormRouter.post('/', authenticateJWT, requirePermission('uba_form:create'), ubaFormController.createForm);
  ubaFormRouter.get('/', authenticateJWT, requirePermission('uba_form:view_own'), ubaFormController.getForms);
  ubaFormRouter.get('/:id', authenticateJWT, requirePermission('uba_form:view_own'), ubaFormController.getForm);
  ubaFormRouter.post('/process-conversation', authenticateJWT, requirePermission('uba_form:create'), ubaFormController.processConversation);
  ubaFormRouter.post('/process-document', authenticateJWT, requirePermission('uba_form:create'), ubaFormController.processDocument);
  ubaFormRouter.post('/process-document-simple', authenticateJWT, requirePermission('uba_form:create'), simpleDocumentController.processDocument);
  ubaFormRouter.post('/process-document-upload', authenticateJWT, requirePermission('uba_form:create'), ubaFormController.processDocumentUpload);
  ubaFormRouter.post('/validate', authenticateJWT, requirePermission('uba_form:create'), ubaFormController.validateForm);
  ubaFormRouter.get('/export/:formId/:formType', authenticateJWT, requirePermission('uba_form:view_own'), ubaFormController.exportToServicerForm);
  ubaFormRouter.get('/export-forms', authenticateJWT, requirePermission('uba_form:view_own'), ubaFormController.getAvailableServicerForms);

  // -- Phase 0 - Onboarding Routes --
  const onboardingRouter = express.Router();
  onboardingRouter.post('/initialize', authenticateJWT, onboardingController.initializeUserContext);
  onboardingRouter.get('/status', authenticateJWT, onboardingController.getOnboardingStatus);
  onboardingRouter.put('/preferences', authenticateJWT, onboardingController.updateOnboardingPreferences);

  // -- Claude AI Routes --
  const claudeRouter = express.Router();
  claudeRouter.post('/analyze-document', authenticateJWT, ClaudeController.analyzeDocument);
  claudeRouter.post('/generate-education', authenticateJWT, ClaudeController.generateEducation);
  claudeRouter.post('/analyze-sentiment', authenticateJWT, ClaudeController.analyzeSentiment);
  claudeRouter.post('/generate-template', authenticateJWT, ClaudeController.generateTemplate);
  claudeRouter.post('/get-recommendations', authenticateJWT, ClaudeController.getRecommendations);

  // -- OpenAI Routes --
  const openaiRouter = express.Router();
  openaiRouter.post('/generate-property-description', authenticateJWT, OpenAIController.generatePropertyDescription);
  openaiRouter.post('/analyze-market-trends', authenticateJWT, OpenAIController.analyzeMarketTrends);
  openaiRouter.post('/generate-email-template', authenticateJWT, OpenAIController.generateEmailTemplate);
  openaiRouter.post('/generate-property-image', authenticateJWT, OpenAIController.generatePropertyImage);
  openaiRouter.post('/compare-options', authenticateJWT, OpenAIController.compareOptions);
  openaiRouter.post('/transcribe-audio', authenticateJWT, OpenAIController.transcribeAudio);

  // -- LOE Drafter Routes (Phase 1 - Task 1.2) --
  const loeRouter = express.Router();
  loeRouter.get('/transaction/:transactionId', authenticateJWT, requireTransactionAccess, loeDrafterController.getTransactionLoeDrafts);
  loeRouter.get('/draft/:draftId', authenticateJWT, loeDrafterController.getLoeDraft);
  loeRouter.post('/draft', authenticateJWT, loeDrafterController.createLoeDraft);
  loeRouter.put('/draft/:draftId', authenticateJWT, loeDrafterController.updateLoeDraft);
  loeRouter.get('/draft/:draftId/export', authenticateJWT, loeDrafterController.exportLoeDraft);
  loeRouter.post('/draft/:draftId/suggestions', authenticateJWT, loeDrafterController.generateSuggestions);
  loeRouter.get('/templates', authenticateJWT, loeDrafterController.getTemplates);

  // -- Document Checklist Routes (Phase 1 - Task 1.3) --
  const checklistRouter = express.Router();
  checklistRouter.post('/generate', authenticateJWT, documentChecklistController.generateChecklist);
  checklistRouter.get('/lenders', authenticateJWT, documentChecklistController.getLenders);
  checklistRouter.post('/templates', authenticateJWT, requireRole(['negotiator']), documentChecklistController.createTemplate);
  checklistRouter.get('/templates', authenticateJWT, documentChecklistController.getTemplates);
  checklistRouter.put('/items/:itemId', authenticateJWT, documentChecklistController.updateChecklistItem);
  
  // Transaction-specific checklist routes
  transactionRouter.get('/:id/checklist', authenticateJWT, requireTransactionAccess, documentChecklistController.getChecklist);
  transactionRouter.get('/:id/checklist/progress', authenticateJWT, requireTransactionAccess, documentChecklistController.getChecklistProgress);

  // -- Financial Calculator Routes (Phase 1 - Task 1.4) --
  const calculatorRouter = express.Router();
  calculatorRouter.get('/available', financialCalculatorController.getAvailableCalculators);
  calculatorRouter.post('/housing-dti', authenticateJWT, financialCalculatorController.calculateHousingDTI);
  calculatorRouter.post('/total-dti', authenticateJWT, financialCalculatorController.calculateTotalDTI);
  calculatorRouter.post('/income-gross-up', authenticateJWT, financialCalculatorController.calculateIncomeGrossUp);
  calculatorRouter.post('/cash-reserves', authenticateJWT, financialCalculatorController.calculateCashReserves);
  calculatorRouter.post('/cash-contribution', authenticateJWT, financialCalculatorController.calculateCashContribution);
  calculatorRouter.post('/escrow-shortage', authenticateJWT, financialCalculatorController.calculateEscrowShortageRepayment);
  calculatorRouter.post('/trial-period-payment', authenticateJWT, financialCalculatorController.calculateTrialPeriodPayment);
  calculatorRouter.post('/repayment-plan', authenticateJWT, financialCalculatorController.calculateRepaymentPlanParameters);
  calculatorRouter.post('/payment-deferral-eligibility', authenticateJWT, financialCalculatorController.calculatePaymentDeferralEligibility);
  calculatorRouter.post('/property-ltv', authenticateJWT, financialCalculatorController.calculatePropertyLTVAndPaydown);
  calculatorRouter.post('/relocation-assistance', authenticateJWT, financialCalculatorController.calculateRelocationAssistanceEligibility);
  calculatorRouter.post('/short-sale-proceeds', authenticateJWT, financialCalculatorController.calculateShortSaleNetProceeds);
  calculatorRouter.post('/affordability-modification', authenticateJWT, financialCalculatorController.calculateAffordabilityForModification);
  calculatorRouter.post('/evaluate-uba-form', authenticateJWT, financialCalculatorController.evaluateUBAFormForWorkoutOption);

  // -- ReAlign 3.0 AI Routes --
  const aiRouter = express.Router();
  
  // AI Conversation endpoints
  aiRouter.post('/conversation', authenticateJWT, aiConversationController.handleConversation);
  aiRouter.get('/conversations/:caseId/history', authenticateJWT, aiConversationController.getConversationHistory);
  aiRouter.post('/conversations/:conversationId/escalate', authenticateJWT, aiConversationController.escalateConversation);
  aiRouter.get('/conversations/active', authenticateJWT, aiConversationController.getActiveConversations);
  
  // AI Service endpoints
  aiRouter.post('/analyze', authenticateJWT, aiServiceController.analyzeText);
  aiRouter.post('/generate', authenticateJWT, aiServiceController.generateResponse);
  aiRouter.get('/interactions', authenticateJWT, aiServiceController.getAIInteractions);
  aiRouter.post('/interactions/:interactionId/feedback', authenticateJWT, aiServiceController.submitFeedback);
  aiRouter.get('/models', authenticateJWT, aiServiceController.getAvailableModels);
  aiRouter.get('/health', aiServiceController.healthCheck);

  // Case Memory endpoints
  const memoryRouter = express.Router();
  memoryRouter.post('/:caseId', authenticateJWT, caseMemoryController.initializeMemory);
  memoryRouter.get('/:caseId', authenticateJWT, caseMemoryController.getMemory);
  memoryRouter.put('/:caseId', authenticateJWT, caseMemoryController.updateMemory);
  memoryRouter.get('/:caseId/summary', authenticateJWT, caseMemoryController.getMemorySummary);
  memoryRouter.get('/:caseId/context/conversation', authenticateJWT, caseMemoryController.getConversationContext);
  memoryRouter.get('/:caseId/context/document', authenticateJWT, caseMemoryController.getDocumentContext);
  memoryRouter.get('/:caseId/context/financial', authenticateJWT, caseMemoryController.getFinancialContext);

  // Also add conversation history endpoint directly on the conversations path
  apiRouter.get('/conversations/:caseId/history', authenticateJWT, aiConversationController.getConversationHistory);

  // Document Intelligence endpoints
  const documentIntelligenceRouter = express.Router();
  documentIntelligenceRouter.post('/analyze', authenticateJWT, documentIntelligenceController.analyzeDocument);
  documentIntelligenceRouter.post('/extract', authenticateJWT, documentIntelligenceController.extractData);
  documentIntelligenceRouter.get('/:documentId/insights', authenticateJWT, documentIntelligenceController.getDocumentInsights);
  documentIntelligenceRouter.post('/batch-analyze', authenticateJWT, documentIntelligenceController.batchAnalyzeDocuments);
  documentIntelligenceRouter.get('/case/:caseId/summary', authenticateJWT, documentIntelligenceController.getCaseDocumentSummary);

  // Learning Pattern endpoints
  const learningRouter = express.Router();
  learningRouter.get('/patterns', authenticateJWT, learningPatternController.getPatterns);
  learningRouter.post('/patterns', authenticateJWT, learningPatternController.recordPattern);
  learningRouter.get('/insights/:caseId', authenticateJWT, learningPatternController.getCaseInsights);
  learningRouter.post('/servicer-intelligence', authenticateJWT, learningPatternController.recordServicerIntelligence);
  learningRouter.get('/servicer/:servicerId', authenticateJWT, learningPatternController.getServicerIntelligence);
  learningRouter.post('/apply', authenticateJWT, learningPatternController.applyLearningToCase);

  // Add API Router level tracing
  console.log('!!! APP TRACE: About to add apiRouter middleware and mount routers');
  apiRouter.use((req, res, next) => {
    console.log('!!! API_ROUTER TRACE: Middleware --- Path:', req.path, 'Method:', req.method);
    if (req.method === 'GET' && req.path.startsWith('/transactions/') && !req.path.includes('/parties') && !req.path.includes('/messages') && !req.path.includes('/phase-history')) {
      console.log('!!! API_ROUTER TRACE: Middleware is processing GET /transactions/:id pattern');
    }
    next();
  });

  // Register routers
  console.log('=== REGISTERING API ROUTERS ===');
  console.log('Registering auth router at /auth');
  apiRouter.use('/auth', authRouter);
  console.log('!!! APP TRACE: About to mount transactionRouter at /transactions');
  apiRouter.use('/transactions', transactionRouter);
  console.log('Registering notification router at /notifications');
  apiRouter.use('/notifications', notificationRouter);
  console.log('Registering user context router at /user-context');
  apiRouter.use('/user-context', userContextRouter);
  console.log('Registering workflow log router at /workflow-log');
  apiRouter.use('/workflow-log', workflowLogRouter);
  console.log('Registering UBA form router at /uba-forms');
  apiRouter.use('/uba-forms', ubaFormRouter);
  console.log('Registering onboarding router at /onboarding');
  apiRouter.use('/onboarding', onboardingRouter);
  console.log('Registering Claude AI router at /claude');
  apiRouter.use('/claude', claudeRouter);
  console.log('Registering OpenAI router at /openai');
  apiRouter.use('/openai', openaiRouter);
  console.log('Registering LOE Drafter router at /loe');
  apiRouter.use('/loe', loeRouter);
  console.log('Registering Document Checklist router at /checklists');
  apiRouter.use('/checklists', checklistRouter);
  console.log('Registering Financial Calculator router at /calculators');
  apiRouter.use('/calculators', calculatorRouter);
  console.log('Registering ReAlign 3.0 AI router at /ai');
  apiRouter.use('/ai', aiRouter);
  console.log('Registering Case Memory router at /memory');
  apiRouter.use('/memory', memoryRouter);
  console.log('Registering Document Intelligence router at /documents');
  apiRouter.use('/documents', documentIntelligenceRouter);
  console.log('Registering Learning Pattern router at /learning');
  apiRouter.use('/learning', learningRouter);

  // Register public routes (no authentication required)
  console.log('Registering public router at /api/public');
  app.use('/api/public', (req, res, next) => {
    console.log(`Public API route hit: ${req.method} ${req.path}`);
    next();
  }, publicRouter);

  // Register API router under /api/v1 with specific middleware
  console.log('Registering main API router at /api/v1');
  app.use('/api/v1', (req, res, next) => {
    console.log(`API route hit: ${req.method} ${req.path}`);
    next();
  }, apiRouter);

  // Add a catch-all for API routes that don't match
  app.use('/api/*', (req, res) => {
    console.log(`Unmatched API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'API endpoint not found' });
  });

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