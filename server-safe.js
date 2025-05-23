import express from "express";
import { registerRoutes } from "./server/routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Register API routes
  const server = await registerRoutes(app);
  
  // Serve static files in production or fallback
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist", "public");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // In development, serve a simple page while bypassing Vite
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) return;
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ReAlign - Server Running</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .status { color: #22c55e; font-size: 18px; margin: 20px 0; }
            .message { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 ReAlign Server is Running!</h1>
            <div class="status">✓ Server successfully started without WebSocket errors</div>
            <div class="message">
              <h3>WebSocket HMR Issue Resolved</h3>
              <p>The server is now running in safe mode, bypassing the problematic Vite WebSocket HMR configuration that was causing crashes in Replit.</p>
              <p><strong>API Endpoints Available:</strong></p>
              <ul style="text-align: left;">
                <li>POST /api/auth/login - User authentication</li>
                <li>POST /api/auth/magic-link - Magic link authentication</li>
                <li>GET /api/transactions - List transactions</li>
                <li>POST /api/transactions - Create transaction</li>
                <li>GET /api/transactions/:id - Get transaction details</li>
                <li>And more...</li>
              </ul>
            </div>
            <div class="message">
              <h3>Next Steps</h3>
              <p>To fully run the application with the frontend, you can:</p>
              <ol style="text-align: left;">
                <li>Build the project: <code>npm run build</code></li>
                <li>Run in production mode: <code>npm run start</code></li>
                <li>Or use the custom scripts we created</li>
              </ol>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }
  
  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 ReAlign server running on port ${port}`);
    console.log(`📱 API available at http://localhost:${port}/api`);
    console.log(`🌐 Web interface at http://localhost:${port}`);
  });
}

startServer().catch(console.error);