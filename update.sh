#!/bin/bash

# Update script for Personal Finance Manager
# This script updates the application to the latest version

echo "Updating Personal Finance Manager..."

# Check if the application is running
if [ -f backend.pid ] || [ -f frontend.pid ]; then
  echo "Stopping the application before update..."
  ./stop.sh
fi

# Pull latest changes from git repository
echo "Pulling latest changes from repository..."
git pull

# Install dependencies
echo "Updating backend dependencies..."
cd backend
npm install

echo "Updating frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Return to root directory
cd ..

echo "Update complete!"
echo "To start the updated application, run: ./start.sh"
