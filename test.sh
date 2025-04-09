#!/bin/bash

# Test script for Personal Finance Manager
# This script runs tests to verify the functionality of the application

echo "Running tests for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the application is running
if [ ! -f backend.pid ]; then
  echo "Starting the application for testing..."
  ./start.sh
  sleep 5
fi

# Test API endpoints
echo "Testing API endpoints..."
echo "1. Testing authentication endpoints..."
curl -s -o logs/auth_test.log -w "%{http_code}" http://localhost:5000/api/auth/status

echo -e "\n2. Testing accounts endpoints..."
curl -s -o logs/accounts_test.log -w "%{http_code}" http://localhost:5000/api/accounts

echo -e "\n3. Testing transactions endpoints..."
curl -s -o logs/transactions_test.log -w "%{http_code}" http://localhost:5000/api/transactions

echo -e "\n4. Testing budgets endpoints..."
curl -s -o logs/budgets_test.log -w "%{http_code}" http://localhost:5000/api/budgets

echo -e "\n5. Testing goals endpoints..."
curl -s -o logs/goals_test.log -w "%{http_code}" http://localhost:5000/api/goals

echo -e "\n6. Testing reports endpoints..."
curl -s -o logs/reports_test.log -w "%{http_code}" http://localhost:5000/api/reports

# Test frontend build
echo -e "\nTesting frontend build..."
if [ -d frontend/build ] && [ -f frontend/build/index.html ]; then
  echo "Frontend build exists and contains index.html"
else
  echo "Error: Frontend build is missing or incomplete"
  exit 1
fi

# Check for required environment variables
echo -e "\nChecking environment variables..."
if [ -f backend/.env ]; then
  echo "Backend environment file exists"
  # Check for required variables
  required_vars=("PORT" "MONGO_URI" "JWT_SECRET" "JWT_EXPIRE")
  for var in "${required_vars[@]}"; do
    if grep -q "$var=" backend/.env; then
      echo "✓ $var is defined"
    else
      echo "✗ $var is missing"
    fi
  done
else
  echo "Error: Backend environment file is missing"
  exit 1
fi

if [ -f frontend/.env ]; then
  echo "Frontend environment file exists"
  # Check for required variables
  if grep -q "REACT_APP_API_URL=" frontend/.env; then
    echo "✓ REACT_APP_API_URL is defined"
  else
    echo "✗ REACT_APP_API_URL is missing"
  fi
else
  echo "Error: Frontend environment file is missing"
  exit 1
fi

# Check MongoDB connection
echo -e "\nChecking MongoDB connection..."
mongo --eval "db.stats()" > logs/mongo_test.log 2>&1
if [ $? -eq 0 ]; then
  echo "MongoDB connection successful"
else
  echo "Error: Could not connect to MongoDB"
  cat logs/mongo_test.log
  exit 1
fi

echo -e "\nAll tests completed!"
echo "Check the logs directory for detailed test results."
