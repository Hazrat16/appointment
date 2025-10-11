# 👷 Manual Deployment Scripts

Scripts for manual deployment when you need direct control or CI/CD is unavailable.

---

## 📋 Available Scripts

### 1. `manual-deploy.sh` - Deploy Application
**Purpose:** Manually deploy your application to the VPS

**Usage:**
```bash
cd /var/www/appointment
bash deployment/manual/manual-deploy.sh
```

**What it does:**
1. ✅ Pulls latest code from Git
2. ✅ Installs backend dependencies
3. ✅ Installs frontend dependencies
4. ✅ Builds frontend
5. ✅ Restarts applications with PM2
6. ✅ Shows status

**When to use:**
- 🔧 CI/CD is not setup yet
- 🐛 Troubleshooting deployment issues
- 📚 Learning the deployment process
- 🆘 Emergency deployment when CI/CD fails

---

### 2. `manual-backup.sh` - Create Backup
**Purpose:** Create a backup of your database and configuration

**Usage:**
```bash
cd /var/www/appointment
bash deployment/manual/manual-backup.sh
```

**What it backs up:**
- 📦 MongoDB database
- 🔐 Environment files (.env)
- ⚙️ Nginx configuration

**Backup location:** `/var/www/appointment/backups/`

**Retention:** 7 days (automatic cleanup)

**When to use:**
- 📅 Regular scheduled backups
- 🚀 Before major deployments
- 🔄 Before system updates
- 🛡️ Before making risky changes

---

### 3. `manual-health-check.sh` - System Health Check
**Purpose:** Check if all services are running properly

**Usage:**
```bash
cd /var/www/appointment
bash deployment/manual/manual-health-check.sh
```

**What it checks:**
- ✅ Nginx status
- ✅ MongoDB status
- ✅ PM2 processes (backend/frontend)
- ✅ Port availability (80, 443, 3000, 5000, 27017)
- ✅ API health endpoint
- ✅ System resources (disk, memory)
- ✅ SSL certificate expiry

**When to use:**
- 🏥 After deployment
- 🔍 Troubleshooting issues
- 📊 Regular monitoring
- 🚨 When something feels wrong

---

## 🚀 Quick Start Guide

### First Deployment

```bash
# 1. SSH into your VPS
ssh deploy@your-vps-ip

# 2. Navigate to project
cd /var/www/appointment

# 3. Make scripts executable (if needed)
chmod +x deployment/manual/*.sh

# 4. Run deployment
bash deployment/manual/manual-deploy.sh

# 5. Check health
bash deployment/manual/manual-health-check.sh
```

### Subsequent Deployments

```bash
# SSH and deploy
ssh deploy@your-vps-ip
cd /var/www/appointment
bash deployment/manual/manual-deploy.sh
```

---

## 📊 Typical Workflow

### Daily Operations

```bash
# Check system health
bash deployment/manual/manual-health-check.sh

# If needed, deploy updates
bash deployment/manual/manual-deploy.sh

# Create backup (optional)
bash deployment/manual/manual-backup.sh
```

### Before Major Changes

```bash
# 1. Create backup first!
bash deployment/manual/manual-backup.sh

# 2. Deploy changes
bash deployment/manual/manual-deploy.sh

# 3. Verify everything works
bash deployment/manual/manual-health-check.sh
```

---

## 🔧 Customization

### Change Backup Retention

Edit `manual-backup.sh`:
```bash
RETENTION_DAYS=7  # Change to desired days
```

### Change Project Directory

Edit scripts and update:
```bash
PROJECT_DIR="/var/www/appointment"  # Your path
```

### Add Custom Checks

Edit `manual-health-check.sh` and add your checks

---

## 🐛 Troubleshooting

### Script Permission Denied

```bash
chmod +x deployment/manual/*.sh
```

### Script Not Found

```bash
# Make sure you're in the right directory
cd /var/www/appointment
ls -la deployment/manual/
```

### Deployment Failed

```bash
# Check logs
pm2 logs

# Check what failed
bash deployment/manual/manual-health-check.sh

# Try restarting manually
pm2 restart all
```

---

## 📚 Related Documentation

- [Main Deployment Guide](../../DEPLOYMENT.md)
- [Deployment Directory Overview](../README.md)
- [CI/CD Setup Guide](../cicd/CICD_SETUP.md)

---

## ⚖️ Manual vs CI/CD

### Use Manual Scripts When:
- 🎓 **Learning** - Understand each step
- 🆘 **Emergency** - CI/CD is down
- 🔧 **Troubleshooting** - Debug issues
- 🧪 **Testing** - Try things manually

### Use CI/CD When:
- 🚀 **Production** - Regular deployments
- ⚡ **Speed** - Fast automated deployment
- 👥 **Team** - Multiple developers
- 📊 **Consistency** - Same process always

---

## 💡 Pro Tips

1. **Always backup before deploying**
   ```bash
   bash deployment/manual/manual-backup.sh
   bash deployment/manual/manual-deploy.sh
   ```

2. **Check health after deployment**
   ```bash
   bash deployment/manual/manual-deploy.sh
   sleep 5
   bash deployment/manual/manual-health-check.sh
   ```

3. **Schedule regular backups**
   ```bash
   # Add to crontab
   crontab -e
   # Daily backup at 2 AM
   0 2 * * * cd /var/www/appointment && bash deployment/manual/manual-backup.sh
   ```

4. **Keep a deployment log**
   ```bash
   bash deployment/manual/manual-deploy.sh | tee -a ~/deployment.log
   ```

---

## ✅ Script Checklist

Before running scripts, ensure:

- [ ] You're logged in as `deploy` user (not root)
- [ ] You're in `/var/www/appointment` directory
- [ ] Scripts have execute permissions
- [ ] You have backup (if deploying)
- [ ] You've tested in staging (if available)

---

## 🎯 Remember

**Manual scripts are your backup plan and learning tool!**

- Primary: Use CI/CD for automated deployment
- Backup: Keep these scripts for emergencies
- Learning: Use these to understand the process
- Flexibility: Have options when CI/CD isn't suitable

**Happy deploying! 🚀**

