#!/bin/bash

# Production deployment script for Personal Finance Manager
# This script deploys the application to a production server

echo "Deploying Personal Finance Manager to production..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
  echo "MongoDB is not installed. Installing MongoDB..."
  sudo apt-get update
  sudo apt-get install -y mongodb
  sudo systemctl enable mongodb
  sudo systemctl start mongodb
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Installing Node.js..."
  curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "PM2 is not installed. Installing PM2..."
  sudo npm install -g pm2
fi

# Install dependencies and build the application
echo "Installing dependencies and building the application..."
./install.sh

# Configure Nginx if it's installed
if command -v nginx &> /dev/null; then
  echo "Configuring Nginx..."
  sudo tee /etc/nginx/sites-available/pfm.conf > /dev/null << EOL
server {
    listen 80;
    server_name finance.bikramjitchowdhury.com;

    location / {
        root $(pwd)/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

  # Enable the site and restart Nginx
  sudo ln -sf /etc/nginx/sites-available/pfm.conf /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl restart nginx
fi

# Start the backend with PM2
echo "Starting the backend with PM2..."
cd backend
pm2 start src/server.js --name "pfm-backend" --env production
cd ..

echo "Deployment complete!"
echo "The application is now running at: http://finance.bikramjitchowdhury.com"
echo "API is accessible at: http://finance.bikramjitchowdhury.com/api"
