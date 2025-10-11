#!/bin/bash

# Automated Backup Script for Appointment System
# Backs up MongoDB database and application files

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Configuration
BACKUP_DIR="/var/www/appointment/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="appointment_production"
RETENTION_DAYS=7

echo "🔄 Starting Backup Process..."
echo "=============================="

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR
print_success "Backup directory ready"

# Backup MongoDB
echo "📦 Backing up MongoDB database..."
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE
print_success "Database backed up to: $BACKUP_DIR/mongodb_$DATE"

# Backup environment files
echo "📦 Backing up environment files..."
mkdir -p $BACKUP_DIR/env_$DATE
cp /var/www/appointment/backend/.env $BACKUP_DIR/env_$DATE/backend.env 2>/dev/null || true
cp /var/www/appointment/frontend/.env.local $BACKUP_DIR/env_$DATE/frontend.env.local 2>/dev/null || true
print_success "Environment files backed up"

# Backup Nginx configuration
echo "📦 Backing up Nginx configuration..."
mkdir -p $BACKUP_DIR/nginx_$DATE
cp /etc/nginx/sites-available/appointment $BACKUP_DIR/nginx_$DATE/nginx.conf 2>/dev/null || true
print_success "Nginx configuration backed up"

# Compress backups
echo "🗜️  Compressing backups..."
cd $BACKUP_DIR
tar -czf backup_$DATE.tar.gz mongodb_$DATE env_$DATE nginx_$DATE
rm -rf mongodb_$DATE env_$DATE nginx_$DATE
print_success "Backup compressed: backup_$DATE.tar.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.tar.gz | cut -f1)
print_info "Backup size: $BACKUP_SIZE"

# Remove old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | wc -l)
print_success "Old backups removed. Remaining backups: $REMAINING"

echo ""
echo "=============================="
print_success "Backup completed successfully! 🎉"
echo ""
echo "📊 Backup Summary:"
echo "   Location: $BACKUP_DIR/backup_$DATE.tar.gz"
echo "   Size: $BACKUP_SIZE"
echo "   Total backups: $REMAINING"
echo ""
echo "💡 To restore from this backup:"
echo "   tar -xzf $BACKUP_DIR/backup_$DATE.tar.gz"
echo "   mongorestore --db $DB_NAME mongodb_$DATE/$DB_NAME"

