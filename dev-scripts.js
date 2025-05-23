#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command = process.argv[2] || 'dev:safe';

const scripts = {
  'dev:safe': () => {
    console.log('Starting development server without WebSocket HMR...');
    // Start server without Vite HMR
    process.env.DISABLE_HMR = 'true';
    process.env.NODE_ENV = 'development';
    process.env.VITE_HMR_PROTOCOL = 'false';
    process.env.VITE_HMR_PORT = 'false';
    process.env.VITE_HMR_HOST = 'false';
    
    spawn('tsx', ['server/index.ts'], {
      stdio: 'inherit',
      env: process.env,
      cwd: __dirname
    });
  },
  
  'dev:split': () => {
    console.log('Starting Vite and server separately...');
    // Start Vite separately without WebSocket
    const viteProcess = spawn('npx', ['vite', '--port', '5173', '--host', '0.0.0.0'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
      cwd: path.join(__dirname, 'client')
    });
    
    // Start backend server after a delay
    setTimeout(() => {
      spawn('tsx', ['server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development', VITE_EXTERNAL: 'true' },
        cwd: __dirname
      });
    }, 3000);
  },
  
  'dev:prod-mode': () => {
    // Build and run in production mode
    console.log('Building application...');
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Build complete, starting server...');
        spawn('npm', ['run', 'start'], {
          stdio: 'inherit',
          cwd: __dirname
        });
      }
    });
  }
};

const selectedScript = scripts[command];
if (selectedScript) {
  selectedScript();
} else {
  console.error(`Unknown command: ${command}`);
  console.log('Available commands:', Object.keys(scripts).join(', '));
  process.exit(1);
}