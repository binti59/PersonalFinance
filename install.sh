#!/bin/bash

# Environment variables setup
echo "Setting up environment variables..."
if [ ! -f .env ]; then
  echo "Creating .env file for backend..."
  cat > ./backend/.env << EOL
PORT=5000
MONGO_URI=mongodb://localhost:27017/pfm
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=production
TRUELAYER_CLIENT_ID=your_truelayer_client_id
TRUELAYER_CLIENT_SECRET=your_truelayer_client_secret
TRUELAYER_REDIRECT_URI=http://localhost:3000/connect/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@pfm.com
FRONTEND_URL=http://localhost:3000
EOL

  echo "Creating .env file for frontend..."
  cat > ./frontend/.env << EOL
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_TRUELAYER_CLIENT_ID=your_truelayer_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
EOL
fi

# Install dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production

echo "Installing frontend dependencies..."
cd ../frontend
npm install --production

# Build frontend
echo "Building frontend..."
npm run build

# Return to root directory
cd ..

echo "Installation complete!"
echo "To start the application, run: ./start.sh"
