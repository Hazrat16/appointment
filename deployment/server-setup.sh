#!/bin/bash

# Initial Server Setup Script for VPS
# Run this script once when setting up a new VPS
# Usage: sudo bash server-setup.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "🚀 Starting VPS Server Setup..."
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y
print_success "System packages updated"

# Install essential tools
echo "🔧 Installing essential tools..."
apt install -y curl wget git build-essential ufw
print_success "Essential tools installed"

# Install Node.js (using NodeSource repository)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
print_success "Node.js installed: $(node --version)"
print_success "NPM installed: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed and started"

# Install MongoDB
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod
print_success "MongoDB installed and started"

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status
print_success "Firewall configured"

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /var/www/appointment
mkdir -p /var/www/appointment/logs
print_success "Project directory created"

# Create a non-root user for deployment (optional but recommended)
echo "👤 Creating deployment user..."
if id "deploy" &>/dev/null; then
    print_warning "User 'deploy' already exists"
else
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    print_success "User 'deploy' created"
fi

# Set permissions
chown -R deploy:deploy /var/www/appointment
print_success "Permissions set"

# Install Certbot for SSL (Let's Encrypt)
echo "🔒 Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Setup PM2 startup script
echo "🔄 Setting up PM2 startup..."
su - deploy -c "pm2 startup systemd -u deploy --hp /home/deploy" | tail -n 1 | bash
print_success "PM2 startup configured"

echo ""
echo "================================"
print_success "Server setup completed! 🎉"
echo ""
echo "📝 Next steps:"
echo "   1. Clone your repository to /var/www/appointment"
echo "   2. Copy environment files and update with production values"
echo "   3. Configure Nginx with the provided config file"
echo "   4. Obtain SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo "   5. Start applications with PM2"
echo ""
echo "🔐 Security recommendations:"
echo "   - Change SSH port from default 22"
echo "   - Disable root SSH login"
echo "   - Setup SSH key authentication"
echo "   - Configure fail2ban"
echo "   - Regular system updates"

