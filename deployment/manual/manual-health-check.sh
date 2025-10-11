#!/bin/bash

# Health Check Script
# Checks if all services are running properly

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

echo "🏥 Health Check - Appointment System"
echo "===================================="
echo ""

# Check Nginx
echo "Checking Nginx..."
systemctl is-active --quiet nginx
print_status $? "Nginx"

# Check MongoDB
echo "Checking MongoDB..."
systemctl is-active --quiet mongod
print_status $? "MongoDB"

# Check PM2 processes
echo "Checking PM2 processes..."
pm2 pid appointment-backend > /dev/null 2>&1
print_status $? "Backend Process"

pm2 pid appointment-frontend > /dev/null 2>&1
print_status $? "Frontend Process"

# Check if ports are listening
echo ""
echo "Checking Ports..."
netstat -tuln | grep -q ":80 "
print_status $? "Port 80 (HTTP)"

netstat -tuln | grep -q ":443 "
print_status $? "Port 443 (HTTPS)"

netstat -tuln | grep -q ":3000 "
print_status $? "Port 3000 (Frontend)"

netstat -tuln | grep -q ":5000 "
print_status $? "Port 5000 (Backend)"

netstat -tuln | grep -q ":27017 "
print_status $? "Port 27017 (MongoDB)"

# Check API health endpoint
echo ""
echo "Checking API Health..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$response" = "200" ]; then
    print_status 0 "API Health Endpoint"
else
    print_status 1 "API Health Endpoint (HTTP $response)"
fi

# Check disk space
echo ""
echo "System Resources:"
df -h / | tail -1 | awk '{print "Disk Usage: " $5 " of " $2 " used"}'
free -h | grep Mem | awk '{print "Memory Usage: " $3 " of " $2 " used"}'

# Check SSL certificate expiry (if exists)
echo ""
if [ -f "/etc/letsencrypt/live/yourdomain.com/cert.pem" ]; then
    echo "SSL Certificate:"
    expiry_date=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/cert.pem | cut -d= -f2)
    echo "Expires: $expiry_date"
fi

echo ""
echo "===================================="
echo "Health check completed!"

