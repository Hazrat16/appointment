# 🔄 CI/CD Setup Guide

Automated deployment using GitHub Actions for your Appointment Booking System.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [SSH Key Setup](#ssh-key-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Workflow Files](#workflow-files)
6. [Testing CI/CD](#testing-cicd)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is CI/CD?

**CI/CD** (Continuous Integration/Continuous Deployment) automatically:
- ✅ Tests your code when you push
- ✅ Builds your application
- ✅ Deploys to your VPS automatically
- ✅ Runs health checks
- ✅ Notifies you of success/failure

### How It Works

```
Push to GitHub → GitHub Actions → Test & Build → Deploy to VPS → Health Check
```

### Workflows Included

1. **`deploy.yml`** - Simple deployment workflow
2. **`ci-cd.yml`** - Advanced workflow with testing and multiple environments

---

## 📦 Prerequisites

Before setting up CI/CD, you need:

- ✅ GitHub repository for your project
- ✅ VPS deployed and working (follow DEPLOYMENT.md first)
- ✅ SSH access to your VPS
- ✅ Git installed on VPS
- ✅ Application running with PM2

---

## 🔑 SSH Key Setup

### Step 1: Generate SSH Key on Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Switch to deploy user
su - deploy

# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# This creates two files:
# ~/.ssh/github_actions (private key)
# ~/.ssh/github_actions.pub (public key)
```

### Step 2: Add Public Key to Authorized Keys

```bash
# Add public key to authorized keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Get Private Key

```bash
# Display private key (copy this entire output)
cat ~/.ssh/github_actions
```

**Copy the entire output including:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Test SSH Key

```bash
# From your local machine, test the key
ssh -i /path/to/private/key deploy@your-vps-ip

# If it works without password, you're good!
```

---

## 🔐 GitHub Secrets Configuration

### Step 1: Go to GitHub Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Required Secrets

Add the following secrets:

#### For Production Deployment:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `PRODUCTION_VPS_HOST` | `123.45.67.89` | Your VPS IP address |
| `PRODUCTION_VPS_USERNAME` | `deploy` | SSH username (usually 'deploy') |
| `PRODUCTION_VPS_SSH_KEY` | `-----BEGIN OPENSSH...` | Private key from Step 3 above |
| `PRODUCTION_VPS_PORT` | `22` | SSH port (default is 22) |
| `PRODUCTION_DOMAIN` | `yourdomain.com` | Your domain name (optional) |

#### For Simple Workflow (deploy.yml):

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP |
| `VPS_USERNAME` | `deploy` |
| `VPS_SSH_KEY` | Private key |
| `VPS_PORT` | `22` |

#### For Staging (Optional):

| Secret Name | Value |
|-------------|-------|
| `STAGING_VPS_HOST` | Staging server IP |
| `STAGING_VPS_USERNAME` | `deploy` |
| `STAGING_VPS_SSH_KEY` | Staging private key |
| `STAGING_VPS_PORT` | `22` |
| `STAGING_DOMAIN` | `staging.yourdomain.com` |

### Step 3: Verify Secrets

- All secrets should show as **Set** (you can't view them)
- Make sure there are no extra spaces or newlines

---

## 📁 Workflow Files

### Simple Deployment (`deploy.yml`)

**Triggers:**
- Push to `main` or `production` branch
- Manual trigger from GitHub Actions tab

**What it does:**
1. Checks out code
2. SSHs into VPS
3. Pulls latest code
4. Installs dependencies
5. Builds frontend
6. Restarts with PM2
7. Runs health check

### Advanced CI/CD (`ci-cd.yml`)

**Triggers:**
- Push to `main`, `develop`, or `staging` branch
- Pull requests
- Manual trigger

**What it does:**
1. **Test & Build Job:**
   - Installs dependencies
   - Runs tests (if configured)
   - Builds frontend
   - Checks for errors

2. **Deploy Production Job:**
   - Only runs on `main` branch
   - Creates backup before deployment
   - Deploys to production
   - Runs health checks
   - Shows status

3. **Deploy Staging Job:**
   - Only runs on `staging` branch
   - Deploys to staging environment

---

## 🧪 Testing CI/CD

### Test 1: Manual Trigger

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to VPS** or **CI/CD Pipeline**
4. Click **Run workflow**
5. Select branch and click **Run workflow**
6. Watch the deployment in real-time!

### Test 2: Push to Main

```bash
# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD deployment"
git push origin main

# Go to GitHub Actions tab to watch deployment
```

### Test 3: Verify Deployment

```bash
# SSH into your VPS
ssh deploy@your-vps-ip

# Check PM2 status
pm2 status

# Check logs
pm2 logs --lines 50

# Check if latest commit is deployed
cd /var/www/appointment
git log -1
```

---

## 🔍 Monitoring Deployments

### View Deployment Status

1. Go to GitHub repository
2. Click **Actions** tab
3. See all workflow runs
4. Click on any run to see details
5. View logs for each step

### Deployment Badges

Add to your README.md:

```markdown
![Deploy Status](https://github.com/username/appointment/actions/workflows/deploy.yml/badge.svg)
```

---

## 🐛 Troubleshooting

### Issue: SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
```bash
# Verify SSH key is added to authorized_keys
cat ~/.ssh/authorized_keys

# Check permissions
ls -la ~/.ssh/

# Should be:
# drwx------ (700) for .ssh directory
# -rw------- (600) for authorized_keys file
```

### Issue: Git Pull Failed

**Error:** `fatal: could not read Username`

**Solution:**
```bash
# On VPS, configure git to use SSH
cd /var/www/appointment
git remote set-url origin git@github.com:username/appointment.git

# Or use HTTPS with token
git remote set-url origin https://username:token@github.com/username/appointment.git
```

### Issue: Permission Denied on VPS

**Error:** `Permission denied: /var/www/appointment`

**Solution:**
```bash
# Fix ownership
sudo chown -R deploy:deploy /var/www/appointment

# Fix permissions
sudo chmod -R 755 /var/www/appointment
```

### Issue: NPM Install Failed

**Error:** `npm ERR! code EACCES`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: PM2 Not Found

**Error:** `pm2: command not found`

**Solution:**
```bash
# Install PM2 globally
npm install -g pm2

# Or use npx
npx pm2 restart ecosystem.config.js
```

### Issue: Health Check Failed

**Error:** `curl: (7) Failed to connect to localhost port 5000`

**Solution:**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs appointment-backend

# Restart backend
pm2 restart appointment-backend

# Check if port is in use
netstat -tulpn | grep 5000
```

### Issue: Build Failed

**Error:** `npm run build failed`

**Solution:**
```bash
# Check frontend logs
cd /var/www/appointment/frontend
npm run build

# Check for missing dependencies
npm install

# Check environment variables
cat .env.local
```

---

## 🔧 Advanced Configuration

### Add Slack Notifications

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Discord Notifications

```yaml
- name: Notify Discord
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

### Add Email Notifications

GitHub automatically sends emails for failed workflows to repository owners.

### Rollback on Failure

```yaml
- name: Rollback on Failure
  if: failure()
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USERNAME }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /var/www/appointment
      git reset --hard HEAD~1
      pm2 restart all
```

---

## 📊 Deployment Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Developer pushes code to GitHub                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions Triggered                               │
│  - Checkout code                                        │
│  - Setup Node.js                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Test & Build                                           │
│  - Install dependencies                                 │
│  - Run tests (optional)                                 │
│  - Build frontend                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  SSH into VPS                                           │
│  - Connect using SSH key                                │
│  - Navigate to project directory                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Deploy Application                                     │
│  - Create backup                                        │
│  - Pull latest code                                     │
│  - Install dependencies                                 │
│  - Build frontend                                       │
│  - Restart with PM2                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Health Check                                           │
│  - Wait for apps to start                               │
│  - Test API endpoint                                    │
│  - Verify PM2 status                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Notify Results                                         │
│  ✅ Success: Deployment complete!                       │
│  ❌ Failure: Check logs and rollback                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CI/CD Checklist

Before enabling CI/CD:

- [ ] VPS deployed and working
- [ ] SSH key generated on VPS
- [ ] Public key added to authorized_keys
- [ ] Private key copied
- [ ] GitHub secrets configured
- [ ] Workflow files committed
- [ ] Test manual deployment works
- [ ] Test SSH connection from local
- [ ] Git configured on VPS
- [ ] PM2 running applications

After enabling CI/CD:

- [ ] Test manual workflow trigger
- [ ] Test push to main branch
- [ ] Verify deployment on VPS
- [ ] Check application is running
- [ ] Monitor GitHub Actions logs
- [ ] Setup notifications (optional)

---

## 🎉 Benefits of CI/CD

### For Development:
- ✅ **Faster Deployments** - Push and forget
- ✅ **Consistent Process** - Same steps every time
- ✅ **Reduced Errors** - Automated testing
- ✅ **Easy Rollback** - Git history preserved

### For Learning:
- ✅ **DevOps Skills** - Learn industry practices
- ✅ **Automation** - Understand CI/CD pipelines
- ✅ **GitHub Actions** - Popular CI/CD tool
- ✅ **Professional Workflow** - Used in real companies

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [CI/CD Best Practices](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

---

## 🚀 Next Steps

1. **Setup SSH Keys** - Follow the SSH key setup section
2. **Configure Secrets** - Add all required GitHub secrets
3. **Test Deployment** - Try manual workflow trigger
4. **Monitor** - Watch your first automated deployment
5. **Optimize** - Add tests, notifications, etc.

**Congratulations! You now have automated CI/CD for your appointment system!** 🎊

