#!/bin/bash

# Security test script for Personal Finance Manager
# This script runs security tests to verify the application is secure

echo "Running security tests for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the application is running
if [ ! -f backend.pid ]; then
  echo "Starting the application for testing..."
  ./start.sh
  sleep 5
fi

# Install OWASP ZAP if not already installed
if ! command -v zap.sh &> /dev/null; then
  echo "OWASP ZAP not found. Please install it manually for security testing."
  echo "You can download it from: https://www.zaproxy.org/download/"
  echo "Continuing with basic security tests..."
fi

# Basic security tests
echo "Running basic security tests..."

# Test CORS headers
echo "1. Testing CORS headers..."
curl -s -I -H "Origin: http://example.com" http://localhost:5000/api/auth/status > logs/cors_test.log
if grep -q "Access-Control-Allow-Origin" logs/cors_test.log; then
  echo "✓ CORS headers are properly set"
else
  echo "✗ CORS headers are missing"
fi

# Test Content Security Policy
echo "2. Testing Content Security Policy..."
curl -s -I http://localhost:5000/api/auth/status > logs/csp_test.log
if grep -q "Content-Security-Policy" logs/csp_test.log; then
  echo "✓ Content Security Policy is properly set"
else
  echo "✗ Content Security Policy is missing"
fi

# Test XSS protection
echo "3. Testing XSS protection..."
curl -s -I http://localhost:5000/api/auth/status > logs/xss_test.log
if grep -q "X-XSS-Protection" logs/xss_test.log; then
  echo "✓ XSS protection is properly set"
else
  echo "✗ XSS protection is missing"
fi

# Test rate limiting
echo "4. Testing rate limiting..."
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/auth/status >> logs/rate_limit_test.log
done
if grep -q "429" logs/rate_limit_test.log; then
  echo "✓ Rate limiting is working"
else
  echo "✗ Rate limiting is not working or threshold is too high"
fi

# Test SQL injection protection
echo "5. Testing SQL injection protection..."
curl -s -o logs/sql_injection_test.log -w "%{http_code}" "http://localhost:5000/api/users?username=admin'--"
if grep -q "200" logs/sql_injection_test.log; then
  echo "✗ Potential SQL injection vulnerability"
else
  echo "✓ SQL injection protection seems to be working"
fi

# Test JWT token validation
echo "6. Testing JWT token validation..."
curl -s -o logs/jwt_test.log -w "%{http_code}" -H "Authorization: Bearer invalid_token" http://localhost:5000/api/accounts
if grep -q "401" logs/jwt_test.log; then
  echo "✓ JWT token validation is working"
else
  echo "✗ JWT token validation may not be working properly"
fi

# Run OWASP ZAP if available
if command -v zap.sh &> /dev/null; then
  echo -e "\nRunning OWASP ZAP security scan..."
  zap.sh -cmd -quickurl http://localhost:5000 -quickout logs/zap_report.html
  echo "ZAP security scan completed. Report saved to logs/zap_report.html"
fi

echo -e "\nAll security tests completed!"
echo "Check the logs directory for detailed security test results."
