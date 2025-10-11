# 🚀 Deployment Guide - Appointment Booking System

Complete guide to deploy your appointment booking system on a VPS (BanglaHost or any Linux VPS).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Application Deployment](#application-deployment)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### What You Need:
- ✅ VPS Server (BanglaHost VPS-1 or similar)
- ✅ Domain name (optional but recommended)
- ✅ SSH access to your server
- ✅ Basic Linux command knowledge

### Server Requirements:
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 1 core minimum

---

## 🔧 Initial Server Setup

### Step 1: Connect to Your VPS

```bash
# SSH into your server
ssh root@your-server-ip

# Or if using a different user
ssh username@your-server-ip
```

### Step 2: Run Server Setup Script

```bash
# Download the setup script
wget https://raw.githubusercontent.com/yourusername/appointment/deployment-setup/deployment/server-setup.sh

# Make it executable
chmod +x server-setup.sh

# Run the script
sudo bash server-setup.sh
```

**What this script does:**
- ✅ Updates system packages
- ✅ Installs Node.js 18.x
- ✅ Installs PM2 process manager
- ✅ Installs Nginx web server
- ✅ Installs MongoDB database
- ✅ Configures firewall (UFW)
- ✅ Creates project directories
- ✅ Installs Certbot for SSL

### Step 3: Verify Installation

```bash
# Check Node.js
node --version  # Should show v18.x.x

# Check NPM
npm --version

# Check PM2
pm2 --version

# Check Nginx
nginx -v

# Check MongoDB
mongod --version
```

---

## 📦 Application Deployment

### Step 1: Clone Your Repository

```bash
# Switch to deploy user (if created)
su - deploy

# Navigate to project directory
cd /var/www/appointment

# Clone your repository
git clone https://github.com/yourusername/appointment.git .

# Checkout deployment branch
git checkout deployment-setup
```

### Step 2: Configure Environment Variables

#### Backend Configuration:

```bash
# Copy environment template
cd /var/www/appointment/backend
cp env.production.example .env

# Edit with your production values
nano .env
```

**Update these values:**
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/appointment_production
JWT_SECRET=your-generated-secret-key
FRONTEND_URL=https://yourdomain.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend Configuration:

```bash
# Copy environment template
cd /var/www/appointment/frontend
cp env.production.example .env.local

# Edit with your production values
nano .env.local
```

**Update these values:**
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd /var/www/appointment/backend
npm ci --production

# Frontend dependencies
cd /var/www/appointment/frontend
npm ci --production
```

### Step 4: Build Frontend

```bash
cd /var/www/appointment/frontend
npm run build
```

### Step 5: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/appointment/deployment/nginx.conf /etc/nginx/sites-available/appointment

# Update domain name in the config
sudo nano /etc/nginx/sites-available/appointment
# Replace 'yourdomain.com' with your actual domain

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/appointment /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 6: Start Applications with PM2

```bash
# Navigate to project root
cd /var/www/appointment

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

---

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Free SSL)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certificate will auto-renew every 90 days!**

---

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs

# View specific app logs
pm2 logs appointment-backend
pm2 logs appointment-frontend

# Monitor resources
pm2 monit

# Restart applications
pm2 restart all
pm2 restart appointment-backend
pm2 restart appointment-frontend

# Stop applications
pm2 stop all

# Delete from PM2
pm2 delete all
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# View Nginx logs
sudo tail -f /var/log/nginx/appointment-access.log
sudo tail -f /var/log/nginx/appointment-error.log
```

### Database Backup

```bash
# Create backup directory
mkdir -p /var/www/appointment/backups

# Backup MongoDB
mongodump --db appointment_production --out /var/www/appointment/backups/$(date +%Y%m%d)

# Restore from backup
mongorestore --db appointment_production /var/www/appointment/backups/20240101/appointment_production
```

### Automated Backups (Cron Job)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mongodump --db appointment_production --out /var/www/appointment/backups/$(date +\%Y\%m\%d) && find /var/www/appointment/backups -type d -mtime +7 -exec rm -rf {} +
```

---

## 🔄 Updating Your Application

### Manual Update

```bash
cd /var/www/appointment
git pull origin main
cd backend && npm ci --production
cd ../frontend && npm ci --production && npm run build
cd ..
pm2 restart all
```

### Using Deployment Script

```bash
cd /var/www/appointment
bash deployment/deploy.sh
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs

# Check if ports are in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000

# Restart applications
pm2 restart all
```

### Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart applications
pm2 restart all

# Clear cache
sync; echo 3 > /proc/sys/vm/drop_caches
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Restart applications
pm2 restart all
```

---

## 🔐 Security Best Practices

### 1. SSH Security

```bash
# Change default SSH port
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222

# Disable root login
# Change: PermitRootLogin yes to PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 2. Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow new SSH port (if changed)
sudo ufw allow 2222/tcp

# Enable firewall
sudo ufw enable
```

### 3. Install Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 4. Regular Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/appointment/backend && npm update
cd /var/www/appointment/frontend && npm update
```

---

## 📞 Support & Resources

### Useful Links:
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

### Quick Commands Reference:

```bash
# Application Management
pm2 status                    # Check app status
pm2 logs                      # View logs
pm2 restart all              # Restart apps

# Server Management
sudo systemctl status nginx   # Check Nginx
sudo systemctl status mongod  # Check MongoDB
df -h                        # Check disk space
free -h                      # Check memory

# Deployment
git pull origin main         # Update code
npm ci --production          # Install dependencies
npm run build                # Build frontend
pm2 restart all             # Restart apps
```

---

## 🎉 Congratulations!

Your appointment booking system is now deployed and running in production! 🚀

**Access your application:**
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api
- Health Check: https://yourdomain.com/health

**Next Steps:**
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Plan for scaling as your user base grows

Happy deploying! 🎊

