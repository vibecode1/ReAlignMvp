#!/usr/bin/env node

// Temporary script to start the app with WebSocket workarounds
import { spawn } from 'child_process';

console.log('Starting ReAlign app with WebSocket workarounds...');

// Set environment variables to disable problematic features
process.env.NODE_ENV = 'development';
process.env.VITE_HMR = 'false';
process.env.FORCE_COLOR = '0';

// Start the server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Disable WebSocket features that are causing issues
    VITE_WS_DEBUG = 'false',
    WS_ENGINE = 'ws'
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill();
  process.exit(0);
});