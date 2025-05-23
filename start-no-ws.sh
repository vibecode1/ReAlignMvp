#!/bin/bash

# Kill any existing node processes
pkill -f "tsx|node|vite" || true

# Wait for processes to die
sleep 2

echo "Starting development server without WebSocket HMR..."

# Set environment variables to disable WebSocket
export NODE_ENV=development
export VITE_HMR_PROTOCOL=false
export VITE_HMR_PORT=false
export VITE_HMR_HOST=false
export DISABLE_HMR=true
export FORCE_COLOR=0

# Start the development server
tsx server/index.ts