# 🚀 Deployment Setup Branch

## Welcome to the Deployment Branch!

This branch contains everything you need to deploy your Appointment Booking System to a VPS (BanglaHost or any Linux server).

---

## 📦 What's Included

### 🔧 Configuration Files
- **`ecosystem.config.js`** - PM2 process manager configuration
- **`deployment/nginx.conf`** - Nginx reverse proxy setup
- **`backend/env.production.example`** - Backend environment template
- **`frontend/env.production.example`** - Frontend environment template

### 📜 Deployment Scripts
- **`deployment/server-setup.sh`** - One-time VPS setup (installs Node.js, PM2, Nginx, MongoDB)
- **`deployment/deploy.sh`** - Deploy/update your application
- **`deployment/mongodb-setup.sh`** - Secure MongoDB setup
- **`deployment/health-check.sh`** - Check system health
- **`deployment/backup.sh`** - Automated backup script

### 📚 Documentation
- **`DEPLOYMENT.md`** - Complete deployment guide (START HERE!)
- **`deployment/QUICKSTART.md`** - Quick reference for experienced users
- **`deployment/README.md`** - Deployment folder overview
- **`deployment/DEPLOYMENT_SUMMARY.md`** - Summary and architecture

---

## 🎯 Quick Start

### For Complete Beginners:
1. Read **`DEPLOYMENT.md`** - It has step-by-step instructions
2. Get a VPS from BanglaHost (Taka 599/month recommended)
3. Follow the guide exactly as written
4. Ask for help if you get stuck!

### For Experienced Developers:
1. Check **`deployment/QUICKSTART.md`**
2. Run the setup scripts
3. Deploy and enjoy!

---

## 💰 Recommended VPS Package

**BanglaHost VPS-1/Shurute**
- **Price**: Taka 599/month (Taka 7,188/year)
- **Specs**: 1 CPU, 4GB RAM, 50GB SSD, 4TB Bandwidth
- **Perfect for**: Learning and small to medium applications

This single VPS can host:
- ✅ Backend (Node.js/Express)
- ✅ Frontend (Next.js)
- ✅ Database (MongoDB)
- ✅ Up to 1,000+ concurrent users

---

## 📊 Architecture Overview

```
Internet (HTTPS)
       ↓
   Nginx (Port 443)
       ↓
   ┌───┴───┐
   ↓       ↓
Frontend  Backend
(Port    (Port
 3000)    5000)
           ↓
        MongoDB
       (Port 27017)
```

---

## 🎓 What You'll Learn

By deploying this project, you'll gain hands-on experience with:

### DevOps Skills:
- ✅ Linux server management
- ✅ SSH and remote server access
- ✅ Process management with PM2
- ✅ Reverse proxy with Nginx
- ✅ SSL/HTTPS setup with Let's Encrypt
- ✅ Database administration
- ✅ System monitoring
- ✅ Backup and recovery

### Production Skills:
- ✅ Environment configuration
- ✅ Security best practices
- ✅ Application deployment
- ✅ Troubleshooting production issues
- ✅ Performance optimization
- ✅ Log management

**These skills transfer directly to AWS, Azure, Google Cloud, and any cloud platform!**

---

## 📝 Deployment Steps Summary

### 1️⃣ Initial Setup (One Time)
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Run server setup script
bash server-setup.sh
```

### 2️⃣ Application Setup
```bash
# Clone repository
git clone https://github.com/yourusername/appointment.git
cd appointment
git checkout deployment-setup

# Configure environment
cp backend/env.production.example backend/.env
cp frontend/env.production.example frontend/.env.local
# Edit both files with your values
```

### 3️⃣ Deploy
```bash
# Run deployment script
bash deployment/deploy.sh
```

### 4️⃣ SSL Setup
```bash
# Get free SSL certificate
sudo certbot --nginx -d yourdomain.com
```

**Done! Your app is live! 🎉**

---

## 🔧 Daily Operations

### Check Status
```bash
pm2 status
bash deployment/health-check.sh
```

### View Logs
```bash
pm2 logs
```

### Deploy Updates
```bash
bash deployment/deploy.sh
```

### Create Backup
```bash
bash deployment/backup.sh
```

---

## 📚 Documentation Guide

### Start Here:
1. **`DEPLOYMENT.md`** - Read this first! Complete guide with troubleshooting

### Quick Reference:
2. **`deployment/QUICKSTART.md`** - Commands cheat sheet
3. **`deployment/DEPLOYMENT_SUMMARY.md`** - Overview and architecture

### Detailed Info:
4. **`deployment/README.md`** - Deployment files explanation

---

## 🐛 Troubleshooting

### Application Won't Start?
```bash
pm2 logs  # Check error messages
```

### Can't Access Website?
```bash
sudo systemctl status nginx  # Check Nginx
sudo ufw status             # Check firewall
```

### Database Issues?
```bash
sudo systemctl status mongod  # Check MongoDB
```

**See DEPLOYMENT.md for detailed troubleshooting!**

---

## 🔐 Security Checklist

Before going live, ensure:
- [ ] Strong JWT secret generated
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] SSL certificate installed
- [ ] Environment files have correct permissions
- [ ] Regular backups scheduled
- [ ] SSH key authentication setup

---

## 💡 Pro Tips

1. **Test Locally First**: Try deployment scripts on a local VM
2. **Read Error Messages**: They usually tell you what's wrong
3. **Check Logs**: `pm2 logs` is your best friend
4. **Backup Before Changes**: Always backup before major updates
5. **Document Your Changes**: Keep notes of what you customize

---

## 🆘 Need Help?

### Resources:
- Read the full **DEPLOYMENT.md** guide
- Check the troubleshooting section
- Review the script comments
- Search for specific error messages

### Common Issues:
- Port already in use → Kill the process or restart
- Permission denied → Check file permissions
- Module not found → Run `npm install`
- Database connection failed → Check MongoDB status

---

## 🎉 Success Checklist

Your deployment is successful when:
- ✅ `pm2 status` shows all apps running
- ✅ Website loads via HTTPS
- ✅ API responds at `/api/health`
- ✅ Can register and login users
- ✅ Can book appointments
- ✅ SSL certificate is valid
- ✅ Backups are working

---

## 🚀 Next Steps After Deployment

1. **Test Everything**: Register users, book appointments
2. **Setup Monitoring**: Configure alerts and monitoring
3. **Schedule Backups**: Setup automated daily backups
4. **Optimize Performance**: Enable caching, compression
5. **Security Hardening**: Follow security best practices
6. **Scale Up**: Upgrade VPS as your users grow

---

## 💪 You Can Do This!

Deployment might seem scary at first, but:
- ✅ All scripts are tested and documented
- ✅ Step-by-step instructions are provided
- ✅ Common issues have solutions
- ✅ You're learning valuable skills
- ✅ It gets easier with practice

**Take it one step at a time, and you'll have your app deployed in no time!**

---

## 📞 Quick Commands Reference

```bash
# Application
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 restart all              # Restart apps
bash deployment/deploy.sh     # Deploy updates

# Server
sudo systemctl status nginx   # Check Nginx
sudo systemctl status mongod  # Check MongoDB
bash deployment/health-check.sh  # Full health check
bash deployment/backup.sh     # Create backup

# Monitoring
pm2 monit                    # Resource monitor
df -h                        # Disk space
free -h                      # Memory usage
```

---

## 🎊 Ready to Deploy?

1. ✅ Read `DEPLOYMENT.md`
2. ✅ Get your VPS ready
3. ✅ Follow the steps
4. ✅ Deploy your app
5. ✅ Celebrate! 🎉

**Good luck with your deployment journey!** 🚀

---

*Made with ❤️ for learning DevOps and production deployment*

