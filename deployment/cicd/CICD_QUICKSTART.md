# ⚡ CI/CD Quick Start

Fast setup guide for GitHub Actions automated deployment.

## 🚀 5-Minute Setup

### Step 1: Generate SSH Key on VPS

```bash
# SSH into your VPS
ssh deploy@your-vps-ip

# Run the setup script
cd /var/www/appointment
bash deployment/setup-cicd-ssh.sh

# Copy the PRIVATE KEY that's displayed
```

### Step 2: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets → Actions → New secret**

Add these secrets:

| Name | Value |
|------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USERNAME` | `deploy` |
| `VPS_SSH_KEY` | Private key from Step 1 |
| `VPS_PORT` | `22` |

### Step 3: Push to Main Branch

```bash
git add .
git commit -m "Enable CI/CD"
git push origin main
```

### Step 4: Watch Deployment

Go to: **GitHub Repo → Actions tab**

Watch your automated deployment! 🎉

---

## 📊 What Happens Automatically

```
Push Code → GitHub Actions → Deploy to VPS → Health Check → ✅ Done!
```

Every time you push to `main`:
1. ✅ Code is pulled on VPS
2. ✅ Dependencies installed
3. ✅ Frontend built
4. ✅ Apps restarted with PM2
5. ✅ Health check runs
6. ✅ You get notified

---

## 🔧 Workflows Available

### Simple Deployment (`deploy.yml`)
- Triggers: Push to `main` or `production`
- What: Deploys to production VPS
- Use: Basic automated deployment

### Advanced CI/CD (`ci-cd.yml`)
- Triggers: Push to `main`, `develop`, `staging`
- What: Tests, builds, deploys with environments
- Use: Full CI/CD pipeline

---

## 🧪 Test Your Setup

### Test 1: Manual Trigger
1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Watch it deploy!

### Test 2: Make a Change
```bash
echo "# Test" >> README.md
git add README.md
git commit -m "Test CI/CD"
git push origin main
```

Go to Actions tab and watch! 🎬

---

## 🐛 Common Issues

### SSH Connection Failed
```bash
# On VPS, check authorized_keys
cat ~/.ssh/authorized_keys

# Check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Deployment Failed
```bash
# On VPS, check logs
pm2 logs

# Check if git can pull
cd /var/www/appointment
git pull origin main
```

### Health Check Failed
```bash
# Check if apps are running
pm2 status

# Restart apps
pm2 restart all
```

---

## 📚 Full Documentation

See [CICD_SETUP.md](./CICD_SETUP.md) for complete guide.

---

## ✅ Success!

When setup correctly:
- ✅ Green checkmark on GitHub commits
- ✅ Automatic deployments on push
- ✅ Email notifications
- ✅ Deployment history in Actions tab

**You now have professional CI/CD! 🎊**

