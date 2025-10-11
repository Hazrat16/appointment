# 🤖 CI/CD Automation

Automated deployment using GitHub Actions - the recommended approach for production.

---

## 🎯 What is CI/CD?

**CI/CD** = Continuous Integration / Continuous Deployment

**What it means:**
- You push code to GitHub
- GitHub Actions automatically deploys it to your VPS
- No manual commands needed!

```
Push Code → GitHub Actions → Auto Deploy → Live! 🎉
```

---

## 📋 Files in This Directory

### 1. `CICD_QUICKSTART.md` ⭐
**5-minute setup guide** - Start here!

Quick steps to get CI/CD running.

### 2. `CICD_SETUP.md`
**Complete documentation** - Everything you need to know

Detailed guide with troubleshooting and advanced features.

### 3. `setup-cicd-ssh.sh`
**Automated SSH key setup script**

Generates SSH keys for GitHub Actions to connect to your VPS.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Generate SSH Key

```bash
# On your VPS
ssh deploy@your-vps-ip
cd /var/www/appointment
bash deployment/cicd/setup-cicd-ssh.sh
```

Copy the **PRIVATE KEY** that's displayed.

### Step 2: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets → Actions**

Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP |
| `VPS_USERNAME` | `deploy` |
| `VPS_SSH_KEY` | Private key from Step 1 |
| `VPS_PORT` | `22` |

### Step 3: Push and Watch!

```bash
git add .
git commit -m "Enable CI/CD"
git push origin main
```

Go to **GitHub → Actions tab** and watch your deployment! 🎬

---

## 📊 How It Works

```
┌─────────────────────┐
│  Push to GitHub     │
│  (main branch)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  Triggered          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Test & Build       │
│  (if configured)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SSH into VPS       │
│  (using key)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Deploy App         │
│  - Pull code        │
│  - Install deps     │
│  - Build frontend   │
│  - Restart PM2      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Health Check       │
│  Verify deployment  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ✅ Done!           │
│  App is live        │
└─────────────────────┘
```

---

## 🎁 Benefits

### For Production:
- ⚡ **Fast** - 2-3 minute deployments
- 🔄 **Consistent** - Same process every time
- 📊 **Monitored** - Full logs in GitHub
- 🔔 **Notifications** - Email on success/failure
- 🛡️ **Safe** - Automatic backups before deploy

### For Learning:
- 🎓 **Industry Standard** - Used by professionals
- 💼 **Resume Skill** - GitHub Actions experience
- 🤖 **Automation** - Understand DevOps
- 📈 **Best Practices** - Learn proper workflows

---

## 📚 Available Workflows

### 1. Simple Deployment
**File:** `../../.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` or `production` branch
- Manual trigger from GitHub

**What it does:**
- Pulls code
- Installs dependencies
- Builds frontend
- Restarts PM2
- Health check

**Best for:** Basic automated deployment

### 2. Advanced CI/CD
**File:** `../../.github/workflows/ci-cd.yml`

**Triggers:**
- Push to `main`, `develop`, `staging`
- Pull requests
- Manual trigger

**What it does:**
- Tests code (if configured)
- Builds application
- Creates backup
- Deploys to production
- Multiple environment support

**Best for:** Production with testing and staging

---

## 🧪 Testing Your Setup

### Test 1: Manual Trigger

1. Go to **GitHub → Actions** tab
2. Click **Deploy to VPS**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**
6. Watch it deploy! 🎬

### Test 2: Push to Deploy

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD"
git push origin main

# Go to Actions tab and watch
```

### Test 3: Verify on VPS

```bash
# SSH into VPS
ssh deploy@your-vps-ip

# Check PM2 status
pm2 status

# Check latest commit
cd /var/www/appointment
git log -1
```

---

## 📖 Documentation Guide

### Getting Started:
1. **Read First:** `CICD_QUICKSTART.md` (5 min)
2. **Then Read:** `CICD_SETUP.md` (full guide)

### Reference:
- SSH setup: Run `setup-cicd-ssh.sh`
- Workflows: Check `.github/workflows/`
- Troubleshooting: See `CICD_SETUP.md`

---

## 🔧 Required Secrets

All secrets are configured in GitHub, not in code:

```
GitHub Repo → Settings → Secrets and variables → Actions
```

### Minimum Required:
- `VPS_HOST` - Your server IP
- `VPS_USERNAME` - SSH username (deploy)
- `VPS_SSH_KEY` - Private key
- `VPS_PORT` - SSH port (22)

### Optional (for advanced workflow):
- `PRODUCTION_VPS_HOST`
- `PRODUCTION_VPS_USERNAME`
- `PRODUCTION_VPS_SSH_KEY`
- `PRODUCTION_DOMAIN`
- `STAGING_*` secrets (for staging)

---

## 🐛 Common Issues

### SSH Connection Failed
```bash
# On VPS, check authorized_keys
cat ~/.ssh/authorized_keys

# Verify permissions
ls -la ~/.ssh/
```

### Deployment Failed
Check GitHub Actions logs for details

### Health Check Failed
```bash
# On VPS
pm2 status
pm2 logs
```

---

## 💡 Pro Tips

### 1. Monitor Deployments
- GitHub Actions tab shows all deployments
- Enable email notifications
- Add status badges to README

### 2. Use Branches
- `main` → Production
- `staging` → Staging environment
- `develop` → Development

### 3. Add Tests
Uncomment test steps in workflow:
```yaml
# - name: Run Backend Tests
#   run: cd backend && npm test
```

### 4. Add Notifications
Configure Slack/Discord webhooks for deployment alerts

---

## 🎯 Best Practices

### 1. Always Test First
- Test in staging before production
- Use manual trigger for important updates
- Monitor first few automated deployments

### 2. Keep Secrets Secure
- Never commit secrets to code
- Use GitHub Secrets only
- Rotate SSH keys periodically

### 3. Monitor Logs
- Check Actions tab after each push
- Review deployment logs
- Watch for errors or warnings

### 4. Have a Backup Plan
- Keep manual scripts available
- Document rollback procedure
- Test manual deployment occasionally

---

## 📊 Deployment Frequency

### Typical Usage:
- **Development:** Multiple times per day
- **Staging:** Once per day
- **Production:** Once per week (or as needed)

### With CI/CD:
- Push anytime → automatic deployment
- No manual SSH needed
- Consistent and reliable

---

## 🔄 Comparison: CI/CD vs Manual

| Feature | CI/CD | Manual |
|---------|-------|--------|
| **Speed** | ⚡ 2-3 min | 🐢 5-10 min |
| **Effort** | 🎯 Just push | 💪 SSH + commands |
| **Errors** | ✅ Caught early | ⚠️ Human error |
| **Logs** | 📊 Full history | 📝 Terminal only |
| **Learning** | 🎓 DevOps skills | 🎓 Server skills |
| **Best For** | 🚀 Production | 🔧 Learning/Debug |

---

## ✅ Setup Checklist

Before using CI/CD:

- [ ] VPS is setup and running
- [ ] Application deployed manually once
- [ ] SSH key generated on VPS
- [ ] GitHub secrets configured
- [ ] Workflow files committed
- [ ] Test deployment successful
- [ ] Monitoring setup

After CI/CD is working:

- [ ] Remove manual deployment habit
- [ ] Trust the automation
- [ ] Monitor Actions tab
- [ ] Keep manual scripts as backup

---

## 🎉 Success Criteria

Your CI/CD is working when:

- ✅ Green checkmark on GitHub commits
- ✅ Actions tab shows successful deployments
- ✅ VPS updates automatically on push
- ✅ Health checks pass
- ✅ You receive email notifications
- ✅ Deployment takes 2-3 minutes

---

## 🚀 Next Steps

1. ✅ **Setup CI/CD** - Follow CICD_QUICKSTART.md
2. ✅ **Test It** - Push a small change
3. ✅ **Monitor** - Watch Actions tab
4. ✅ **Optimize** - Add tests, notifications
5. ✅ **Scale** - Add staging environment

---

## 📞 Need Help?

- **Quick Start:** Read `CICD_QUICKSTART.md`
- **Full Guide:** Read `CICD_SETUP.md`
- **Troubleshooting:** Check CICD_SETUP.md troubleshooting section
- **Manual Backup:** Use scripts in `../manual/` directory

---

**Welcome to automated deployment! 🎊**

No more SSH commands - just push and relax! ☕️

