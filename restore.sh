#!/bin/bash

# Restore script for Personal Finance Manager
# This script restores a backup of the database and application files

if [ $# -eq 0 ]; then
  echo "Error: No backup file specified"
  echo "Usage: ./restore.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring Personal Finance Manager from backup: $BACKUP_FILE"

# Create temporary directory for extraction
TEMP_DIR="./temp_restore"
mkdir -p $TEMP_DIR

# Extract the backup
echo "Extracting backup archive..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted directory
BACKUP_DIR=$(ls -d "$TEMP_DIR"/* | head -1)

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Could not find backup directory in archive"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Stop the application if it's running
if [ -f backend.pid ] || [ -f frontend.pid ]; then
  echo "Stopping the application before restore..."
  ./stop.sh
fi

# Restore MongoDB database
echo "Restoring MongoDB database..."
if [ -d "$BACKUP_DIR/db" ]; then
  mongorestore "$BACKUP_DIR/db"
else
  echo "Warning: No database backup found in archive"
fi

# Restore environment files
echo "Restoring environment files..."
if [ -f "$BACKUP_DIR/env/backend.env" ]; then
  cp "$BACKUP_DIR/env/backend.env" ./backend/.env
  echo "Backend environment file restored"
else
  echo "Warning: No backend environment file found in backup"
fi

if [ -f "$BACKUP_DIR/env/frontend.env" ]; then
  cp "$BACKUP_DIR/env/frontend.env" ./frontend/.env
  echo "Frontend environment file restored"
else
  echo "Warning: No frontend environment file found in backup"
fi

# Clean up
rm -rf "$TEMP_DIR"

echo "Restore completed successfully!"
echo "To start the restored application, run: ./start.sh"
