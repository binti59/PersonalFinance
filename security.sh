#!/bin/bash

# Security configuration script for Personal Finance Manager
# This script sets up security configurations for the application

echo "Setting up security configurations for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Set proper permissions for sensitive files
echo "Setting proper file permissions..."
chmod 600 backend/.env
chmod 600 frontend/.env
chmod 700 *.sh

# Configure CORS in the backend
echo "Configuring CORS settings..."
cat > ./backend/src/config/cors.js << EOL
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = corsOptions;
EOL

# Configure rate limiting
echo "Setting up rate limiting..."
cat > ./backend/src/middleware/rateLimiter.js << EOL
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login/register requests per hour
  message: 'Too many authentication attempts from this IP, please try again after an hour'
});

module.exports = { apiLimiter, authLimiter };
EOL

# Configure helmet for security headers
echo "Setting up security headers with helmet..."
cat > ./backend/src/config/helmet.js << EOL
const helmet = require('helmet');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://connect.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://www.facebook.com", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://auth.truelayer.com"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
});

module.exports = helmetConfig;
EOL

# Update server.js to include security configurations
echo "Updating server.js with security configurations..."
sed -i '/const express = require/a const cors = require("cors");\nconst corsOptions = require("./config/cors");\nconst helmetConfig = require("./config/helmet");\nconst { apiLimiter, authLimiter } = require("./middleware/rateLimiter");' ./backend/src/server.js
sed -i '/app.use(express.json())/a app.use(cors(corsOptions));\napp.use(helmetConfig);\napp.use("/api", apiLimiter);\napp.use("/api/auth", authLimiter);' ./backend/src/server.js

# Add security packages to package.json
echo "Adding security packages to backend dependencies..."
cd backend
npm install --save helmet express-rate-limit cors
cd ..

echo "Security configuration completed successfully!"
echo "To apply these changes, restart the application with: ./stop.sh && ./start.sh"
