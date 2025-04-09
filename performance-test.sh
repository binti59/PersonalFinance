#!/bin/bash

# Performance test script for Personal Finance Manager
# This script runs performance tests to verify the application can handle load

echo "Running performance tests for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the application is running
if [ ! -f backend.pid ]; then
  echo "Starting the application for testing..."
  ./start.sh
  sleep 5
fi

# Install Apache Bench if not already installed
if ! command -v ab &> /dev/null; then
  echo "Installing Apache Bench for performance testing..."
  sudo apt-get update
  sudo apt-get install -y apache2-utils
fi

# Run performance tests on API endpoints
echo "Testing API performance..."

# Test authentication endpoint
echo "1. Testing authentication endpoint performance..."
ab -n 100 -c 10 -g logs/auth_perf.tsv http://localhost:5000/api/auth/status > logs/auth_perf.log

# Test accounts endpoint
echo "2. Testing accounts endpoint performance..."
ab -n 100 -c 10 -g logs/accounts_perf.tsv http://localhost:5000/api/accounts > logs/accounts_perf.log

# Test transactions endpoint
echo "3. Testing transactions endpoint performance..."
ab -n 100 -c 10 -g logs/transactions_perf.tsv http://localhost:5000/api/transactions > logs/transactions_perf.log

# Test budgets endpoint
echo "4. Testing budgets endpoint performance..."
ab -n 100 -c 10 -g logs/budgets_perf.tsv http://localhost:5000/api/budgets > logs/budgets_perf.log

# Test goals endpoint
echo "5. Testing goals endpoint performance..."
ab -n 100 -c 10 -g logs/goals_perf.tsv http://localhost:5000/api/goals > logs/goals_perf.log

# Test reports endpoint
echo "6. Testing reports endpoint performance..."
ab -n 100 -c 10 -g logs/reports_perf.tsv http://localhost:5000/api/reports > logs/reports_perf.log

# Analyze results
echo -e "\nAnalyzing performance test results..."
echo "Summary of performance tests:" > logs/performance_summary.txt
for endpoint in auth accounts transactions budgets goals reports; do
  if [ -f logs/${endpoint}_perf.log ]; then
    requests_per_second=$(grep "Requests per second" logs/${endpoint}_perf.log | awk '{print $4}')
    time_per_request=$(grep "Time per request" logs/${endpoint}_perf.log | head -1 | awk '{print $4}')
    echo "${endpoint} endpoint: ${requests_per_second} requests/sec, ${time_per_request} ms per request" >> logs/performance_summary.txt
  fi
done

# Display summary
cat logs/performance_summary.txt

echo -e "\nAll performance tests completed!"
echo "Check the logs directory for detailed performance test results."
