#!/bin/bash

echo "🚀 Starting ReAlign application without WebSocket HMR..."

# Kill ALL existing processes to ensure clean start
pkill -f "tsx" || true
pkill -f "node" || true
pkill -f "vite" || true
pkill -f "npm" || true

# Wait for processes to fully terminate
sleep 3

# Set environment variables
export NODE_ENV=development
export DISABLE_HMR=true
export VITE_HMR_PROTOCOL=false
export VITE_HMR_PORT=false
export VITE_HMR_HOST=false

# Change to the workspace directory
cd /home/runner/workspace

echo "✅ Starting ReAlign server on port 5000..."
tsx server/index-override.ts