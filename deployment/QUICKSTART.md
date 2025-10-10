# ⚡ Quick Start Deployment Guide

Fast deployment guide for experienced developers. For detailed instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md).

## 🚀 One-Command Setup

```bash
# 1. Initial server setup (run as root)
wget -qO- https://raw.githubusercontent.com/yourusername/appointment/deployment-setup/deployment/server-setup.sh | sudo bash

# 2. Clone and setup
su - deploy
cd /var/www/appointment
git clone https://github.com/yourusername/appointment.git .
git checkout deployment-setup

# 3. Configure environment
cp backend/env.production.example backend/.env
cp frontend/env.production.example frontend/.env.local
# Edit both files with your values

# 4. Install and build
cd backend && npm ci --production && cd ..
cd frontend && npm ci --production && npm run build && cd ..

# 5. Setup Nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/appointment
sudo ln -s /etc/nginx/sites-available/appointment /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 6. Start applications
pm2 start ecosystem.config.js
pm2 save

# 7. Setup SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📝 Essential Commands

```bash
# Deploy updates
cd /var/www/appointment && bash deployment/deploy.sh

# View logs
pm2 logs

# Restart apps
pm2 restart all

# Check status
pm2 status
```

## 🔧 Configuration Checklist

- [ ] Update `backend/.env` with production values
- [ ] Update `frontend/.env.local` with API URL
- [ ] Replace domain in `deployment/nginx.conf`
- [ ] Generate strong JWT secret
- [ ] Configure MongoDB connection
- [ ] Setup SSL certificate

## 🎯 Ports

- Frontend: 3000 (internal)
- Backend: 5000 (internal)
- Nginx: 80, 443 (external)
- MongoDB: 27017 (internal)

## 📊 Post-Deployment

```bash
# Test health endpoint
curl https://yourdomain.com/health

# Check PM2 status
pm2 status

# Monitor logs
pm2 logs --lines 50
```

Done! 🎉

