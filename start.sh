#!/bin/bash

# Start MongoDB (if not already running)
echo "Checking MongoDB status..."
if ! pgrep -x "mongod" > /dev/null; then
  echo "Starting MongoDB..."
  mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
else
  echo "MongoDB is already running."
fi

# Start backend server
echo "Starting backend server..."
cd backend
NODE_ENV=production nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend server (if not in production)
if [ "$1" = "dev" ]; then
  echo "Starting frontend development server..."
  cd frontend
  nohup npm start > ../logs/frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > ../frontend.pid
  cd ..
  echo "Frontend development server started."
  echo "Access the application at: http://localhost:3000"
else
  echo "Backend server started."
  echo "Access the API at: http://localhost:5000/api"
  echo "Frontend is built as static files. To serve them, use a web server like nginx or run:"
  echo "cd frontend/build && npx serve -s"
fi

echo "Application started successfully!"
