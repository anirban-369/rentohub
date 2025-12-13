#!/bin/bash

# RentoHub EC2 Deployment Script
# Run this on your Ubuntu EC2 instance to set up the application

set -e

echo "🚀 Starting RentoHub deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PostgreSQL client (for database testing)
echo "📦 Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Install Docker (optional but recommended)
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
echo "📁 Creating application directory..."
mkdir -p ~/rentohub
cd ~/rentohub

# Clone repository (replace with your repo URL)
echo "📥 Cloning repository..."
# git clone <YOUR-REPO-URL> .

# Install dependencies
echo "📦 Installing Node dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Note: Update .env.production with actual values before running migrations
echo ""
echo "⚠️  IMPORTANT: Before proceeding, do the following:"
echo "1. Upload or create .env.production with your actual configuration values"
echo "2. Make sure DATABASE_URL points to your RDS instance"
echo "3. Fill in all required secrets and keys"
echo ""
echo "Then run:"
echo "  npx prisma migrate deploy"
echo "  npm run build"
echo "  pm2 start npm --name 'rentohub' -- start"
echo ""

# Configure PM2
echo "⚙️  Configuring PM2..."
pm2 save
pm2 startup

echo ""
echo "✅ Deployment setup complete!"
echo "📖 Next steps in AWS_DEPLOYMENT_GUIDE.md"
