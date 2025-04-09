# Contabo Server Deployment Instructions for Personal Finance Manager

This guide provides step-by-step instructions for deploying the Personal Finance Manager application on your Contabo server, including port configuration to avoid conflicts with existing applications.

## Prerequisites

- Contabo VPS with SSH access
- Ubuntu 20.04 or later
- Node.js 14+ and npm
- MongoDB 4+
- Git

## Step 1: Clone the Repository

```bash
# Connect to your Contabo server via SSH
ssh username@your-contabo-server-ip

# Create a directory for the application
mkdir -p /var/www/personalfinance

# Clone the repository
cd /var/www/personalfinance
git clone https://github.com/binti59/PersonalFinance.git .
```

## Step 2: Update Port Configuration

Since your server already has an application (xandminer) using ports 3000 and 4000, we need to modify the port configuration for the Personal Finance Manager.

```bash
# Edit the backend .env file
nano backend/.env
```

Update the following line:
```
PORT=5001
```

```bash
# Edit the frontend .env file
nano frontend/.env
```

Update the following line:
```
REACT_APP_API_URL=http://your-domain.com:5001/api
```

```bash
# Edit the start.sh script to use the correct ports
nano start.sh
```

Find any references to port 3000 and change them to 3001 for the frontend.

## Step 3: Install Dependencies and Build the Application

```bash
# Make all scripts executable
chmod +x *.sh

# Run the installation script
./install.sh
```

This script will:
- Set up environment variables
- Install backend dependencies
- Install frontend dependencies
- Build the frontend for production

## Step 4: Configure MongoDB

```bash
# Install MongoDB if not already installed
sudo apt update
sudo apt install -y mongodb

# Start MongoDB and enable it to start on boot
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB is running
sudo systemctl status mongodb
```

## Step 5: Configure Environment Variables

```bash
# Edit the backend .env file to update MongoDB connection
nano backend/.env
```

Update the following line:
```
MONGO_URI=mongodb://localhost:27017/pfm
JWT_SECRET=your_secure_random_string
```

Replace `your_secure_random_string` with a secure random string for JWT authentication.

## Step 6: Configure Security Settings

```bash
# Run the security configuration script
./security.sh
```

This script will:
- Set proper file permissions
- Configure CORS settings
- Implement rate limiting
- Set up security headers

## Step 7: Set Up Nginx as a Reverse Proxy

```bash
# Install Nginx if not already installed
sudo apt update
sudo apt install -y nginx

# Create a new Nginx configuration file
sudo nano /etc/nginx/sites-available/personalfinance.conf
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name finance.bikramjitchowdhury.com;

    location / {
        root /var/www/personalfinance/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/personalfinance.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Set Up PM2 for Process Management

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the backend with PM2
cd /var/www/personalfinance/backend
pm2 start src/server.js --name "pfm-backend" --env production

# Set PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-username --hp /home/your-username
pm2 save
```

## Step 9: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d finance.bikramjitchowdhury.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 10: Test the Deployment

1. Visit your domain in a browser: `https://finance.bikramjitchowdhury.com`
2. Verify that the application loads correctly
3. Test user registration and login
4. Test connecting to bank accounts (if TrueLayer API is configured)
5. Test creating and managing accounts, transactions, budgets, and goals

## Step 11: Set Up Regular Backups

```bash
# Create a backup directory
mkdir -p /var/backups/personalfinance

# Create a backup script
nano /var/backups/personalfinance/backup.sh
```

Add the following content:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/personalfinance"
APP_DIR="/var/www/personalfinance"

# Backup MongoDB
mongodump --out "$BACKUP_DIR/db_$TIMESTAMP"

# Backup environment files
mkdir -p "$BACKUP_DIR/env_$TIMESTAMP"
cp "$APP_DIR/backend/.env" "$BACKUP_DIR/env_$TIMESTAMP/backend.env"
cp "$APP_DIR/frontend/.env" "$BACKUP_DIR/env_$TIMESTAMP/frontend.env"

# Create a tarball
tar -czf "$BACKUP_DIR/pfm_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "db_$TIMESTAMP" "env_$TIMESTAMP"

# Remove temporary directories
rm -rf "$BACKUP_DIR/db_$TIMESTAMP" "$BACKUP_DIR/env_$TIMESTAMP"

# Keep only the 10 most recent backups
ls -t "$BACKUP_DIR"/pfm_backup_*.tar.gz | tail -n +11 | xargs -r rm
```

```bash
# Make the script executable
chmod +x /var/backups/personalfinance/backup.sh

# Set up a cron job to run the backup daily
(crontab -l 2>/dev/null; echo "0 2 * * * /var/backups/personalfinance/backup.sh") | crontab -
```

## Step 12: Monitoring and Maintenance

```bash
# Monitor the application logs
pm2 logs pfm-backend

# Monitor system resources
sudo apt install -y htop
htop

# Update the application when needed
cd /var/www/personalfinance
git pull
./update.sh
```

## Troubleshooting

### If the application doesn't start:
1. Check the logs: `pm2 logs pfm-backend`
2. Verify MongoDB is running: `sudo systemctl status mongodb`
3. Check Nginx configuration: `sudo nginx -t`
4. Verify port availability: `sudo netstat -tulpn | grep 5001`

### If you can't connect to the database:
1. Check MongoDB status: `sudo systemctl status mongodb`
2. Verify MongoDB connection string in `.env` file
3. Check MongoDB logs: `sudo journalctl -u mongodb`

### If Nginx returns a 502 Bad Gateway:
1. Verify the backend is running: `pm2 status`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify the proxy_pass directive in Nginx configuration

## Server Requirements and Recommendations

Based on your Contabo server configuration, here are some recommendations:

1. **Memory Management**: If your server has limited RAM, consider:
   - Increasing MongoDB's cache size for better performance
   - Using PM2 to limit memory usage for Node.js processes

2. **Disk Space**: Regularly monitor disk usage and set up alerts:
   ```bash
   sudo apt install -y ncdu
   ncdu /var
   ```

3. **CPU Usage**: If you experience high CPU usage:
   - Consider enabling Node.js clustering in PM2
   - Optimize MongoDB queries and indexes

4. **Network Configuration**: Ensure your firewall allows traffic on ports 80, 443, and 5001:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 5001/tcp
   ```

## Conclusion

Your Personal Finance Manager application should now be successfully deployed on your Contabo server, accessible at https://finance.bikramjitchowdhury.com, and configured to avoid port conflicts with your existing xandminer application.

For any issues or questions, refer to the troubleshooting section or consult the project documentation.
