#!/bin/bash

# End-to-end test script for Personal Finance Manager
# This script runs end-to-end tests to verify the complete functionality of the application

echo "Running end-to-end tests for Personal Finance Manager..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the application is running
if [ ! -f backend.pid ]; then
  echo "Starting the application for testing..."
  ./start.sh dev
  sleep 10
fi

# Install Cypress if not already installed
if [ ! -d "node_modules/cypress" ]; then
  echo "Installing Cypress for end-to-end testing..."
  npm install cypress --save-dev
fi

# Create Cypress test directory if it doesn't exist
mkdir -p cypress/integration

# Create a basic end-to-end test
cat > cypress/integration/pfm_spec.js << EOL
describe('Personal Finance Manager', () => {
  it('Loads the login page', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('Sign In');
    cy.contains('Email');
    cy.contains('Password');
  });

  it('Shows validation errors on login form', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required');
  });

  it('Navigates to registration page', () => {
    cy.visit('http://localhost:3000/login');
    cy.contains('Create an account').click();
    cy.url().should('include', '/register');
    cy.contains('Sign Up');
  });

  it('Shows validation errors on registration form', () => {
    cy.visit('http://localhost:3000/register');
    cy.get('button[type="submit"]').click();
    cy.contains('Name is required');
    cy.contains('Email is required');
    cy.contains('Password is required');
  });
});
EOL

# Create Cypress configuration
cat > cypress.json << EOL
{
  "baseUrl": "http://localhost:3000",
  "video": false,
  "screenshotOnRunFailure": true,
  "screenshotsFolder": "logs/screenshots"
}
EOL

# Run Cypress tests
echo "Running end-to-end tests with Cypress..."
npx cypress run

# Test responsive design
echo -e "\nTesting responsive design..."
cat > cypress/integration/responsive_spec.js << EOL
describe('Responsive Design Tests', () => {
  const sizes = ['iphone-6', 'ipad-2', [1024, 768]];
  
  sizes.forEach(size => {
    it(\`Should display properly on \${size} screen\`, () => {
      if (Cypress._.isArray(size)) {
        cy.viewport(size[0], size[1]);
      } else {
        cy.viewport(size);
      }
      
      cy.visit('http://localhost:3000/login');
      cy.contains('Sign In').should('be.visible');
      
      // Check if the form is visible and properly sized
      cy.get('form').should('be.visible');
    });
  });
});
EOL

# Run responsive design tests
echo "Running responsive design tests..."
npx cypress run --spec cypress/integration/responsive_spec.js

echo -e "\nAll end-to-end tests completed!"
echo "Check the logs directory for detailed test results and screenshots."
