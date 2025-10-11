#!/bin/bash

# CI/CD SSH Key Setup Script
# Run this on your VPS to setup SSH keys for GitHub Actions

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "🔑 CI/CD SSH Key Setup"
echo "======================"
echo ""

# Check if running as deploy user
if [ "$USER" != "deploy" ]; then
    print_warning "This script should be run as 'deploy' user"
    print_info "Switching to deploy user..."
    exec su - deploy -c "bash $0"
fi

print_success "Running as deploy user"

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh
print_success "SSH directory ready"

# Check if key already exists
if [ -f ~/.ssh/github_actions ]; then
    print_warning "GitHub Actions SSH key already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing key. Displaying private key..."
        echo ""
        echo "========================================="
        cat ~/.ssh/github_actions
        echo "========================================="
        echo ""
        print_info "Copy the above private key to GitHub Secrets as VPS_SSH_KEY"
        exit 0
    fi
fi

# Generate SSH key
print_info "Generating SSH key for GitHub Actions..."
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
print_success "SSH key generated"

# Add public key to authorized_keys
print_info "Adding public key to authorized_keys..."
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
print_success "Public key added to authorized_keys"

# Remove duplicate entries
print_info "Removing duplicate entries..."
sort -u ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.tmp
mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
print_success "Duplicates removed"

# Display keys
echo ""
echo "========================================="
echo "✅ SSH Key Setup Complete!"
echo "========================================="
echo ""

print_info "Public Key (already added to authorized_keys):"
echo "---"
cat ~/.ssh/github_actions.pub
echo "---"
echo ""

print_warning "IMPORTANT: Copy the PRIVATE KEY below to GitHub Secrets"
echo ""
print_info "Private Key (copy this to GitHub Secrets as VPS_SSH_KEY):"
echo ""
echo "========================================="
cat ~/.ssh/github_actions
echo "========================================="
echo ""

print_info "Next Steps:"
echo "  1. Copy the PRIVATE KEY above (including BEGIN and END lines)"
echo "  2. Go to GitHub: Settings → Secrets → Actions → New secret"
echo "  3. Name: VPS_SSH_KEY"
echo "  4. Value: Paste the private key"
echo "  5. Add other secrets:"
echo "     - VPS_HOST: $(curl -s ifconfig.me)"
echo "     - VPS_USERNAME: deploy"
echo "     - VPS_PORT: 22"
echo ""

print_success "SSH key setup completed successfully!"
echo ""
print_info "Test the SSH key:"
echo "  ssh -i ~/.ssh/github_actions deploy@$(curl -s ifconfig.me)"

