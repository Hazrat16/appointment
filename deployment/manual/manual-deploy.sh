#!/bin/bash

# Appointment Booking System - Deployment Script
# This script deploys both backend and frontend to production

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/appointment"
REPO_URL="https://github.com/yourusername/appointment.git"  # Update with your repo
BRANCH="main"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Navigate to project directory
cd $PROJECT_DIR || {
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
}

print_success "Changed to project directory"

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
print_success "Code updated from repository"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production
print_success "Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --production
print_success "Frontend dependencies installed"

# Build frontend
echo "🔨 Building frontend..."
npm run build
print_success "Frontend built successfully"

# Go back to root
cd ..

# Restart applications with PM2
echo "🔄 Restarting applications..."
pm2 restart ecosystem.config.js --update-env
print_success "Applications restarted"

# Show PM2 status
echo ""
echo "📊 Application Status:"
pm2 status

# Save PM2 configuration
pm2 save

print_success "Deployment completed successfully! 🎉"
echo ""
echo "📝 Next steps:"
echo "   - Check logs: pm2 logs"
echo "   - Monitor: pm2 monit"
echo "   - Check website: https://yourdomain.com"

