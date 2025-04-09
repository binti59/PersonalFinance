# Personal Finance Manager Documentation

## Overview
The Personal Finance Manager (PFM) is a comprehensive web application that helps users manage their finances. It provides features for tracking accounts, transactions, budgets, financial goals, and generating financial reports. The application integrates with TrueLayer API to connect with bank accounts and automatically import transactions.

## Architecture
The application follows a modern client-server architecture:
- **Frontend**: React.js with Redux for state management
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT-based with social login options
- **External API**: TrueLayer for bank connectivity

## Features
- User authentication (email/password and social login)
- Account management
- Transaction tracking and categorization
- Budget creation and monitoring
- Financial goal setting and tracking
- Comprehensive financial reports
- Bank account connectivity via TrueLayer API

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Setup
1. Clone the repository
2. Run the installation script:
   ```
   chmod +x install.sh
   ./install.sh
   ```
3. Configure environment variables in `.env` files

## Deployment
The application includes several scripts for deployment and management:

- `install.sh`: Sets up environment variables and installs dependencies
- `start.sh`: Starts the application (use `./start.sh dev` for development mode)
- `stop.sh`: Stops the application
- `update.sh`: Updates the application to the latest version
- `deploy.sh`: Deploys the application to a production environment
- `backup.sh`: Creates a backup of the database and environment files
- `restore.sh`: Restores from a backup
- `security.sh`: Configures security settings

### Production Deployment
To deploy to production:
1. Configure your domain in `deploy.sh`
2. Run the deployment script:
   ```
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Testing
The application includes comprehensive testing scripts:

- `test.sh`: Basic functionality tests
- `e2e-test.sh`: End-to-end UI tests with Cypress
- `performance-test.sh`: Performance tests with Apache Bench
- `security-test.sh`: Security tests
- `run-all-tests.sh`: Runs all tests and generates a report

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `POST /api/auth/social-login`: Login with social provider
- `GET /api/auth/profile`: Get user profile
- `PUT /api/auth/profile`: Update user profile
- `POST /api/auth/change-password`: Change password
- `POST /api/auth/forgot-password`: Request password reset
- `POST /api/auth/reset-password/:token`: Reset password with token

### Account Endpoints
- `GET /api/accounts`: Get all accounts
- `GET /api/accounts/:id`: Get account by ID
- `POST /api/accounts`: Create new account
- `PUT /api/accounts/:id`: Update account
- `DELETE /api/accounts/:id`: Delete account
- `POST /api/accounts/:id/sync`: Sync account with bank

### Transaction Endpoints
- `GET /api/transactions`: Get transactions (with filtering)
- `GET /api/transactions/:id`: Get transaction by ID
- `POST /api/transactions`: Create new transaction
- `PUT /api/transactions/:id`: Update transaction
- `DELETE /api/transactions/:id`: Delete transaction
- `GET /api/transactions/categories`: Get transaction categories
- `POST /api/transactions/import`: Import transactions from file

### Budget Endpoints
- `GET /api/budgets`: Get all budgets
- `GET /api/budgets/:id`: Get budget by ID
- `POST /api/budgets`: Create new budget
- `PUT /api/budgets/:id`: Update budget
- `DELETE /api/budgets/:id`: Delete budget
- `POST /api/budgets/:id/reset`: Reset budget

### Goal Endpoints
- `GET /api/goals`: Get all goals
- `GET /api/goals/:id`: Get goal by ID
- `POST /api/goals`: Create new goal
- `PUT /api/goals/:id`: Update goal
- `DELETE /api/goals/:id`: Delete goal
- `POST /api/goals/:id/contribute`: Contribute to goal
- `GET /api/goals/:id/history`: Get goal contribution history

### Report Endpoints
- `GET /api/reports`: Get saved reports
- `GET /api/reports/:id`: Get report by ID
- `POST /api/reports`: Save report
- `PUT /api/reports/:id`: Update report
- `DELETE /api/reports/:id`: Delete report
- `GET /api/reports/income-expense`: Generate income/expense report
- `GET /api/reports/net-worth`: Generate net worth report
- `GET /api/reports/category-spending`: Generate category spending report
- `GET /api/reports/financial-health`: Generate financial health report
- `GET /api/reports/:id/export`: Export report

### TrueLayer Endpoints
- `GET /api/truelayer/auth-url`: Get TrueLayer authentication URL
- `POST /api/truelayer/exchange-token`: Exchange authorization code for token
- `GET /api/truelayer/connections`: Get bank connections
- `DELETE /api/truelayer/connections/:id`: Delete bank connection
- `POST /api/truelayer/connections/:id/sync`: Sync bank connection

## Security Considerations
- All API endpoints (except authentication) require JWT authentication
- Passwords are hashed using bcrypt
- Rate limiting is implemented to prevent abuse
- CORS is configured to allow only the frontend domain
- Security headers are set using Helmet
- Environment variables are used for sensitive information

## Maintenance
Regular maintenance tasks:
1. Run `./update.sh` to update the application
2. Run `./backup.sh` to create regular backups
3. Run `./run-all-tests.sh` to verify functionality after updates

## Troubleshooting
Common issues and solutions:
- **MongoDB connection issues**: Verify MongoDB is running with `mongod --version`
- **API errors**: Check backend logs in `logs/backend.log`
- **Frontend issues**: Check frontend logs in `logs/frontend.log`
- **Authentication problems**: Verify JWT_SECRET in backend .env file

## License
This project is licensed under the MIT License.
