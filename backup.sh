#!/bin/bash

# Backup script for Personal Finance Manager
# This script creates a backup of the database and application files

echo "Creating backup of Personal Finance Manager..."

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Get current date for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="pfm_backup_$TIMESTAMP"

# Backup MongoDB database
echo "Backing up MongoDB database..."
mongodump --out "$BACKUP_DIR/$BACKUP_FILENAME/db"

# Backup environment files
echo "Backing up environment files..."
mkdir -p "$BACKUP_DIR/$BACKUP_FILENAME/env"
if [ -f ./backend/.env ]; then
  cp ./backend/.env "$BACKUP_DIR/$BACKUP_FILENAME/env/backend.env"
fi
if [ -f ./frontend/.env ]; then
  cp ./frontend/.env "$BACKUP_DIR/$BACKUP_FILENAME/env/frontend.env"
fi

# Create a tarball of the backup
echo "Creating compressed archive..."
tar -czf "$BACKUP_DIR/${BACKUP_FILENAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_FILENAME"

# Remove the uncompressed backup directory
rm -rf "$BACKUP_DIR/$BACKUP_FILENAME"

echo "Backup completed successfully!"
echo "Backup file: $BACKUP_DIR/${BACKUP_FILENAME}.tar.gz"
