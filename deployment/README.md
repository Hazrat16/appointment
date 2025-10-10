# 📁 Deployment Configuration Files

This directory contains all necessary files and scripts for deploying the Appointment Booking System to a production VPS.

## 📄 Files Overview

### Configuration Files

- **`nginx.conf`** - Nginx reverse proxy configuration
  - Routes API requests to backend (port 5000)
  - Routes frontend requests to Next.js (port 3000)
  - SSL/HTTPS configuration
  - Gzip compression and caching

- **`ecosystem.config.js`** (root directory) - PM2 process manager configuration
  - Manages both backend and frontend processes
  - Auto-restart on crashes
  - Log management
  - Memory limits

### Scripts

- **`server-setup.sh`** - Initial VPS setup script
  - Installs Node.js, PM2, Nginx, MongoDB
  - Configures firewall
  - Creates project directories
  - Sets up SSL with Certbot
  - **Run once** when setting up a new server

- **`deploy.sh`** - Application deployment script
  - Pulls latest code from Git
  - Installs dependencies
  - Builds frontend
  - Restarts applications
  - **Run every time** you want to deploy updates

### Environment Templates

- **`backend/env.production.example`** - Backend environment variables template
- **`frontend/env.production.example`** - Frontend environment variables template

### Documentation

- **`DEPLOYMENT.md`** (root directory) - Complete deployment guide
  - Step-by-step instructions
  - Troubleshooting tips
  - Monitoring and maintenance
  - Security best practices

- **`QUICKSTART.md`** - Quick reference for experienced developers

## 🚀 Usage

### First Time Setup

1. Get a VPS (BanglaHost VPS-1 recommended)
2. SSH into your server
3. Run `server-setup.sh` as root
4. Clone your repository
5. Configure environment variables
6. Run `deploy.sh`

### Subsequent Deployments

```bash
cd /var/www/appointment
bash deployment/deploy.sh
```

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional)
- Git repository

## 🔧 Customization

### Change Ports

Edit `ecosystem.config.js`:
```javascript
env: {
  PORT: 5000  // Change backend port
}
```

Edit `nginx.conf`:
```nginx
proxy_pass http://localhost:5000;  // Update to match
```

### Change Domain

Edit `nginx.conf`:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### Change Project Directory

Edit `deploy.sh`:
```bash
PROJECT_DIR="/var/www/appointment"  // Change path
```

## 📊 Architecture

```
Internet
    ↓
Nginx (Port 80/443)
    ↓
    ├─→ Frontend (Port 3000) - Next.js
    └─→ Backend (Port 5000) - Express API
            ↓
        MongoDB (Port 27017)
```

## 🔐 Security Notes

- All environment files (`.env`) are gitignored
- Never commit production credentials
- Use strong JWT secrets in production
- Enable firewall (UFW)
- Keep SSL certificates updated
- Regular security updates

## 📞 Support

For detailed instructions, see:
- [Complete Deployment Guide](../DEPLOYMENT.md)
- [Quick Start Guide](./QUICKSTART.md)

## 🎯 Quick Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart applications
pm2 restart all

# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# Deploy updates
bash deployment/deploy.sh
```

## 📝 Deployment Checklist

- [ ] VPS server ready
- [ ] Domain configured (optional)
- [ ] Run server-setup.sh
- [ ] Clone repository
- [ ] Configure environment variables
- [ ] Update Nginx config with domain
- [ ] Run deploy.sh
- [ ] Setup SSL certificate
- [ ] Test application
- [ ] Setup monitoring
- [ ] Configure backups

Happy deploying! 🚀

