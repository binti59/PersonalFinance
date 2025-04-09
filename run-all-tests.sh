#!/bin/bash

# Comprehensive test runner for Personal Finance Manager
# This script runs all tests to verify the application is fully functional

echo "Running comprehensive tests for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the application is running
if [ ! -f backend.pid ]; then
  echo "Starting the application for testing..."
  ./start.sh
  sleep 5
fi

# Run basic functionality tests
echo -e "\n========== RUNNING BASIC FUNCTIONALITY TESTS =========="
./test.sh

# Run end-to-end tests
echo -e "\n========== RUNNING END-TO-END TESTS =========="
./e2e-test.sh

# Run performance tests
echo -e "\n========== RUNNING PERFORMANCE TESTS =========="
./performance-test.sh

# Run security tests
echo -e "\n========== RUNNING SECURITY TESTS =========="
./security-test.sh

# Generate comprehensive test report
echo -e "\nGenerating comprehensive test report..."
cat > logs/test_report.md << EOL
# Personal Finance Manager - Test Report
Generated on: $(date)

## Summary
This report contains the results of comprehensive testing of the Personal Finance Manager application.

## Functionality Tests
$(cat logs/auth_test.log 2>/dev/null || echo "No data available")
$(cat logs/accounts_test.log 2>/dev/null || echo "No data available")
$(cat logs/transactions_test.log 2>/dev/null || echo "No data available")
$(cat logs/budgets_test.log 2>/dev/null || echo "No data available")
$(cat logs/goals_test.log 2>/dev/null || echo "No data available")
$(cat logs/reports_test.log 2>/dev/null || echo "No data available")

## Performance Tests
$(cat logs/performance_summary.txt 2>/dev/null || echo "No data available")

## Security Tests
$(cat logs/cors_test.log 2>/dev/null || echo "No data available")
$(cat logs/csp_test.log 2>/dev/null || echo "No data available")
$(cat logs/xss_test.log 2>/dev/null || echo "No data available")
$(cat logs/rate_limit_test.log 2>/dev/null || echo "No data available")

## Recommendations
- Review any failed tests and address issues
- Regularly run these tests after making changes to the application
- Consider implementing continuous integration for automated testing
EOL

echo -e "\nAll tests completed!"
echo "Comprehensive test report generated at: logs/test_report.md"
