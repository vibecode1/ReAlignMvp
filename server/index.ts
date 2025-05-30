console.log('!!!!!!!! SERVER ENTRY POINT (server/index.ts) IS RUNNING - VERSION 2 !!!!!!!!');

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as cron from 'node-cron';
import { NotificationService } from './services/notificationService';

const app = express();
// Disable ETags to prevent 304 Not Modified responses that cause stale party data
app.disable('etag');
// Very generous request size limits for document uploads (200MB)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: false, limit: '200mb' }));

// Add middleware to log request sizes for debugging
app.use('/api/v1/uba-forms/process-document', (req, res, next) => {
  const contentLength = req.get('content-length');
  console.log(`📊 UBA Document Upload - Content-Length: ${contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) + 'MB' : 'unknown'}`);
  next();
});

// JSON PARSING ERROR HANDLER for debugging 0ms 401 errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err && err.status === 400) {
    console.error('Malformed JSON in request body:', err.message);
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' }});
  }
  // If it's not a JSON parsing error, pass it to the next error handler
  next(err);
});

app.use((req, res, next) => {
  console.log('!!! GLOBAL TRACE: Main logging middleware --- Path:', req.originalUrl, 'Method:', req.method);
  if (req.method === 'GET' && req.originalUrl.startsWith('/api/v1/transactions/') && !req.originalUrl.includes('/parties') && !req.originalUrl.includes('/messages') && !req.originalUrl.includes('/phase-history')) {
    console.log('!!! GLOBAL TRACE: Main logging middleware is processing GET /api/v1/transactions/:id pattern');
  }
  
  const start = Date.now();
  const path = req.path;
  
  // Log all API requests for debugging
  if (path.startsWith('/api/')) {
    console.log(`=== API REQUEST: ${req.method} ${path} ===`);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
  }
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  // Initialize weekly digest cron job (Friday 5 PM)
  const notificationService = new NotificationService();
  
  // Schedule weekly digest emails every Friday at 5 PM
  cron.schedule('0 17 * * 5', async () => {
    console.log('Running weekly digest email job...');
    try {
      await notificationService.sendWeeklyDigest();
    } catch (error) {
      console.error('Weekly digest job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust timezone as needed
  });

  console.log('Weekly digest cron job scheduled for Fridays at 5 PM');

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
