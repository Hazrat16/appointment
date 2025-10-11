# 🔒 Security Guide

Important security considerations for your Appointment Booking System.

---

## ⚠️ **CRITICAL: Never Commit Secrets**

### **Files That Should NEVER Be Committed:**

```bash
# These files contain real credentials
backend/.env                    # ❌ NEVER commit
frontend/.env.local             # ❌ NEVER commit
mongodb-credentials.txt         # ❌ NEVER commit

# Only commit example files
backend/env.example             # ✅ Safe (no real credentials)
backend/env.production.example  # ✅ Safe (no real credentials)
frontend/env.production.example # ✅ Safe (no real credentials)
```

### **Already in .gitignore:**
- ✅ `.env`
- ✅ `.env.local`
- ✅ `.env.production.local`
- ✅ `.env.development.local`
- ✅ `mongodb-credentials.txt`

---

## 🔐 **Rotating Exposed Secrets**

### **If You Accidentally Committed Real Credentials:**

#### **1. Immediately Change MongoDB Password**

If you exposed MongoDB Atlas credentials:

```bash
# Go to MongoDB Atlas
# https://cloud.mongodb.com/

# Steps:
1. Login to MongoDB Atlas
2. Go to Database Access
3. Edit the exposed user
4. Change password
5. Update your .env file with new password
6. Restart your application
```

#### **2. Generate New JWT Secret**

```bash
# Generate a new strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update backend/.env
JWT_SECRET=<new-generated-secret>

# Restart application
pm2 restart all
```

#### **3. Remove from Git History**

⚠️ **This is complex - consider making repository private instead**

```bash
# Option 1: Use git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path backend/env.example --invert-paths

# Option 2: Use BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Option 3: Make repository private (easiest)
# Go to GitHub → Settings → Danger Zone → Change visibility
```

---

## 🛡️ **Security Best Practices**

### **1. Environment Variables**

```bash
# ✅ DO: Use example files as templates
cp backend/env.example backend/.env
# Then edit .env with real values

# ❌ DON'T: Commit .env files
git add backend/.env  # ❌ NEVER DO THIS!
```

### **2. Strong Secrets**

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate strong MongoDB password
# Use password manager or:
openssl rand -base64 32
```

### **3. Database Security**

```bash
# ✅ Enable MongoDB authentication
# Run: bash deployment/mongodb-setup.sh

# ✅ Use strong passwords (at least 16 characters)
# ✅ Limit IP access in MongoDB Atlas
# ✅ Use environment variables, not hardcoded credentials
```

### **4. GitHub Secrets**

```bash
# ✅ Store credentials in GitHub Secrets (for CI/CD)
# Settings → Secrets → Actions → New secret

# Never in code:
VPS_SSH_KEY=<private-key>      # ✅ GitHub Secret
VPS_HOST=<ip-address>          # ✅ GitHub Secret

# Not in committed files:
const password = "mypass123";  # ❌ NEVER
```

---

## 🔍 **Checking for Exposed Secrets**

### **Before Committing:**

```bash
# Check what you're about to commit
git diff

# Look for these patterns:
# - mongodb+srv://username:password@...
# - Real email addresses
# - Real passwords
# - Real API keys
# - SSH private keys

# If found, remove them!
```

### **Scan Your Repository:**

```bash
# Install gitleaks
# https://github.com/gitleaks/gitleaks

# Scan for secrets
gitleaks detect --source . --verbose

# Or use GitHub's secret scanning (automatic)
```

---

## 🚨 **What to Do If You Exposed Secrets**

### **Immediate Actions:**

1. **🔴 Change the exposed credentials IMMEDIATELY**
   - MongoDB password
   - JWT secret
   - API keys
   - Any other exposed secrets

2. **🟡 Remove from repository**
   - Delete the file with secrets
   - Commit the deletion
   - Push to GitHub

3. **🟢 Update example files**
   - Use placeholders: `<username>`, `<password>`
   - Add clear comments
   - Commit safe examples

4. **📧 Consider notifying users**
   - If production database
   - If user data affected
   - If widely distributed

---

## ✅ **Safe Example File Format**

### **Good Example (env.example):**

```bash
# Database Configuration
# IMPORTANT: Replace with your actual credentials
MONGODB_URI=mongodb://localhost:27017/appointment_dev
# For MongoDB Atlas, replace <username>, <password>, <cluster>:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/appointment

# JWT Secret
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=generate-a-strong-secret-key-here

# API Keys
# Get from: https://example.com/api-keys
API_KEY=your-api-key-here
```

### **Bad Example:**

```bash
# ❌ Real credentials exposed
MONGODB_URI=mongodb+srv://realuser:realpass123@cluster0.mongodb.net/db
JWT_SECRET=actualsecretkey123
API_KEY=sk_live_51H7xxxxxxxxxxxxxxxxxxx
```

---

## 🔐 **Credentials Checklist**

### **Before Pushing to GitHub:**

- [ ] No real passwords in code
- [ ] No real API keys in code
- [ ] No real database connection strings
- [ ] No SSH private keys
- [ ] Example files use placeholders
- [ ] .gitignore includes .env files
- [ ] Ran `git diff` to verify
- [ ] Checked for commented secrets

### **Production Deployment:**

- [ ] Strong JWT secret generated
- [ ] Strong MongoDB password set
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (only necessary ports)
- [ ] Environment files have correct permissions (chmod 600)
- [ ] Secrets stored in GitHub Secrets (for CI/CD)
- [ ] Regular security updates scheduled

---

## 📚 **Additional Resources**

### **Tools:**
- [Gitleaks](https://github.com/gitleaks/gitleaks) - Scan for secrets
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Remove secrets from history

### **Guides:**
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Security Practices](https://owasp.org/www-project-top-ten/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

## 🆘 **Need Help?**

### **If You Exposed Production Credentials:**

1. **Immediate**: Change all exposed credentials
2. **Review**: Check application logs for suspicious access
3. **Monitor**: Watch for unusual activity
4. **Update**: Deploy with new credentials
5. **Learn**: Review this guide to prevent future exposure

### **Prevention:**

- Use environment variables
- Never commit .env files
- Use strong, unique passwords
- Enable 2FA on critical accounts
- Regular security audits

---

## 🎓 **Learning Points**

### **Why This Matters:**

1. **Data Security**: Exposed credentials = database access
2. **User Privacy**: Attackers could access user data
3. **Financial Impact**: Malicious usage of APIs
4. **Reputation**: Loss of trust from users
5. **Legal**: Potential GDPR/privacy violations

### **Good Habits:**

- ✅ Always use .env files for secrets
- ✅ Check git diff before committing
- ✅ Use strong, random secrets
- ✅ Rotate secrets regularly
- ✅ Use GitHub Secrets for CI/CD

---

**Remember: Security is not optional - it's essential! 🔒**

Stay safe and code responsibly! 🛡️

