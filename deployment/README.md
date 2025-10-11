# 📁 Deployment Directory

Two deployment approaches available: **CI/CD (Recommended)** and **Manual Deployment**

---

## 📂 Directory Structure

```
deployment/
├── README.md                    # This file
├── DEPLOYMENT_SUMMARY.md        # General overview
├── nginx.conf                   # Nginx configuration (shared)
├── server-setup.sh              # Initial VPS setup (shared)
├── mongodb-setup.sh             # MongoDB setup (shared)
│
├── cicd/                        # 🤖 CI/CD Automation (Recommended)
│   ├── CICD_SETUP.md           # Complete CI/CD guide
│   ├── CICD_QUICKSTART.md      # 5-minute setup
│   └── setup-cicd-ssh.sh       # SSH key setup for GitHub Actions
│
└── manual/                      # 👷 Manual Deployment (Backup)
    ├── manual-deploy.sh         # Manual deployment script
    ├── manual-backup.sh         # Manual backup script
    └── manual-health-check.sh   # Manual health check script
```

---

## 🚀 Recommended Approach: CI/CD

**Use this for automated deployment on every push to main.**

### Quick Setup:
1. Read `cicd/CICD_QUICKSTART.md`
2. Run `bash cicd/setup-cicd-ssh.sh` on your VPS
3. Add secrets to GitHub
4. Push to main → automatic deployment! 🎉

### Advantages:
- ✅ **Automated** - Push and forget
- ✅ **Fast** - 2-3 minute deployments
- ✅ **Consistent** - Same process every time
- ✅ **Monitored** - GitHub Actions logs everything
- ✅ **Professional** - Industry-standard approach

**📚 Documentation:**
- `cicd/CICD_QUICKSTART.md` - Quick start guide
- `cicd/CICD_SETUP.md` - Complete documentation
- `.github/workflows/deploy.yml` - Simple workflow
- `.github/workflows/ci-cd.yml` - Advanced workflow

---

## 👷 Backup Approach: Manual Deployment

**Use this when:**
- CI/CD is down
- Testing something manually
- Learning the deployment process
- Troubleshooting issues

### Quick Usage:
```bash
# SSH into your VPS
ssh deploy@your-vps-ip

# Run manual deployment
cd /var/www/appointment
bash deployment/manual/manual-deploy.sh
```

### Scripts Available:
- **`manual-deploy.sh`** - Deploy application manually
- **`manual-backup.sh`** - Create backup
- **`manual-health-check.sh`** - Check system health

### Advantages:
- ✅ **Direct Control** - You see everything happening
- ✅ **Learning Tool** - Understand the process
- ✅ **Backup Plan** - When CI/CD fails
- ✅ **Troubleshooting** - Debug deployment issues

---

## 🔧 Shared Files

These are used by both approaches:

### Initial Setup (Run Once):
- **`server-setup.sh`** - Install Node.js, PM2, Nginx, MongoDB
- **`mongodb-setup.sh`** - Secure MongoDB setup

### Configuration (Always Needed):
- **`nginx.conf`** - Nginx reverse proxy config
- **`../ecosystem.config.js`** - PM2 process manager config

---

## 📊 Comparison

| Feature | CI/CD | Manual |
|---------|-------|--------|
| **Speed** | ⚡ Fast (automated) | 🐢 Slower (manual steps) |
| **Effort** | 🎯 Push code only | 💪 SSH and run script |
| **Consistency** | ✅ Always same | ⚠️ Can vary |
| **Learning** | 📚 DevOps automation | 🎓 Hands-on process |
| **Logs** | 📊 GitHub Actions | 📝 Terminal output |
| **Best For** | Production | Learning/Testing |

---

## 🎯 Recommended Setup

### Step 1: Initial Setup (Once)
```bash
# Run on VPS
ssh root@your-vps-ip
bash deployment/server-setup.sh
```

### Step 2: Choose Your Approach

#### Option A: CI/CD (Recommended)
```bash
# Setup CI/CD
bash deployment/cicd/setup-cicd-ssh.sh
# Add secrets to GitHub
# Push to main → done!
```

#### Option B: Manual
```bash
# Deploy manually
bash deployment/manual/manual-deploy.sh
```

#### Option C: Both (Best for Learning)
- Use CI/CD for regular deployments
- Keep manual scripts for emergencies
- Learn both approaches!

---

## 📚 Documentation Quick Links

### Getting Started:
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)
- [Main Deployment Guide](../DEPLOYMENT.md)

### CI/CD (Automated):
- [CI/CD Quick Start](./cicd/CICD_QUICKSTART.md) ⭐ Start here!
- [CI/CD Complete Guide](./cicd/CICD_SETUP.md)

### Manual (Backup):
- Scripts in `manual/` directory
- Follow [Main Deployment Guide](../DEPLOYMENT.md)

---

## 🔄 Deployment Workflow

### With CI/CD:
```bash
# On your local machine
git add .
git commit -m "Update feature"
git push origin main

# That's it! GitHub Actions deploys automatically
```

### With Manual:
```bash
# On your local machine
git push origin main

# On VPS
ssh deploy@your-vps-ip
cd /var/www/appointment
bash deployment/manual/manual-deploy.sh
```

---

## 🎓 Learning Path

### Week 1: Manual Deployment
- Learn each step manually
- Understand what's happening
- Use `manual/` scripts

### Week 2: Setup CI/CD
- Setup GitHub Actions
- Automate the process
- Use `cicd/` approach

### Week 3: Master Both
- Use CI/CD for production
- Keep manual scripts for backup
- Understand when to use each

---

## 🆘 Troubleshooting

### CI/CD Issues?
See `cicd/CICD_SETUP.md` troubleshooting section

### Manual Deployment Issues?
See `../DEPLOYMENT.md` troubleshooting section

### Server Issues?
Run health check:
```bash
bash deployment/manual/manual-health-check.sh
```

---

## ✅ Quick Commands

### CI/CD:
```bash
# Push to deploy
git push origin main

# View deployment
# Go to GitHub → Actions tab
```

### Manual:
```bash
# Deploy
bash deployment/manual/manual-deploy.sh

# Backup
bash deployment/manual/manual-backup.sh

# Health check
bash deployment/manual/manual-health-check.sh
```

---

## 🎉 Conclusion

**For Production: Use CI/CD** (`cicd/` directory)
- Automated, fast, professional

**For Learning/Backup: Use Manual** (`manual/` directory)
- Hands-on, educational, reliable backup

**Best Practice: Keep both!**
- Primary: CI/CD
- Backup: Manual scripts
- Result: Flexible and robust deployment strategy

---

**Choose your path and start deploying! 🚀**
