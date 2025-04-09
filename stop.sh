#!/bin/bash

# Stop the application
echo "Stopping the application..."

# Check if backend is running
if [ -f backend.pid ]; then
  BACKEND_PID=$(cat backend.pid)
  if ps -p $BACKEND_PID > /dev/null; then
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
  else
    echo "Backend server is not running."
  fi
  rm backend.pid
fi

# Check if frontend is running
if [ -f frontend.pid ]; then
  FRONTEND_PID=$(cat frontend.pid)
  if ps -p $FRONTEND_PID > /dev/null; then
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
  else
    echo "Frontend server is not running."
  fi
  rm frontend.pid
fi

echo "Application stopped successfully!"
