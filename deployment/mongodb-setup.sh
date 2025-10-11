#!/bin/bash

# MongoDB Setup and Security Configuration
# Run this script after installing MongoDB

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "🔧 MongoDB Setup and Configuration"
echo "=================================="

# Check if MongoDB is running
if ! systemctl is-active --quiet mongod; then
    print_error "MongoDB is not running. Starting MongoDB..."
    sudo systemctl start mongod
fi

print_success "MongoDB is running"

# Create database and user
echo "👤 Creating database and user..."

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32)

# Create MongoDB user
mongo <<EOF
use appointment_production

db.createUser({
  user: "appointment_user",
  pwd: "$DB_PASSWORD",
  roles: [
    { role: "readWrite", db: "appointment_production" }
  ]
})

print("User created successfully!")
EOF

print_success "Database user created"

# Enable authentication in MongoDB
echo "🔒 Enabling MongoDB authentication..."

# Backup original config
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# Enable authentication
sudo tee -a /etc/mongod.conf > /dev/null <<EOF

# Security settings
security:
  authorization: enabled
EOF

# Restart MongoDB
sudo systemctl restart mongod
print_success "MongoDB authentication enabled"

# Save credentials to file
CRED_FILE="/var/www/appointment/mongodb-credentials.txt"
cat > $CRED_FILE <<EOF
MongoDB Credentials
===================
Database: appointment_production
Username: appointment_user
Password: $DB_PASSWORD

Connection String:
mongodb://appointment_user:$DB_PASSWORD@localhost:27017/appointment_production

Update your backend/.env file with:
MONGODB_URI=mongodb://appointment_user:$DB_PASSWORD@localhost:27017/appointment_production
EOF

chmod 600 $CRED_FILE
print_success "Credentials saved to: $CRED_FILE"

echo ""
echo "================================"
print_success "MongoDB setup completed! 🎉"
echo ""
print_warning "IMPORTANT: Save these credentials securely!"
echo ""
cat $CRED_FILE
echo ""
print_warning "Update your backend/.env file with the connection string above"

