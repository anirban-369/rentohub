#!/bin/bash

# 🚀 RentoHub AWS Deployment Automation Script
# This script automates the deployment process on EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Main deployment
main() {
    print_header "RentoHub AWS Deployment Script"
    
    print_info "This script will set up your RentoHub application on AWS"
    print_info "Make sure you have:"
    print_info "  1. EC2 instance running (Ubuntu 22.04)"
    print_info "  2. RDS database created with endpoint"
    print_info "  3. .env.production file prepared locally"
    print_info "  4. Domain nameservers pointing to Route 53"
    
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
    
    print_header "Step 1: System Updates"
    apt_update
    
    print_header "Step 2: Install Dependencies"
    install_dependencies
    
    print_header "Step 3: Clone Repository"
    clone_repository
    
    print_header "Step 4: Application Setup"
    setup_application
    
    print_header "Step 5: Configure Nginx"
    setup_nginx
    
    print_header "Step 6: Configure SSL"
    setup_ssl
    
    print_header "Deployment Complete!"
    print_success "RentoHub is now running on https://anir.co.in"
    print_info "Check status with: pm2 status"
    print_info "View logs with: pm2 logs rentohub"
}

apt_update() {
    print_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y > /dev/null 2>&1
    print_success "System updated"
}

install_dependencies() {
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    print_success "Node.js $(node --version) installed"
    
    print_info "Installing PM2..."
    sudo npm install -g pm2 > /dev/null 2>&1
    print_success "PM2 installed"
    
    print_info "Installing Nginx..."
    sudo apt install -y nginx > /dev/null 2>&1
    print_success "Nginx installed"
    
    print_info "Installing PostgreSQL client..."
    sudo apt install -y postgresql-client > /dev/null 2>&1
    print_success "PostgreSQL client installed"
    
    print_info "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
    print_success "Certbot installed"
    
    print_info "Installing Git..."
    sudo apt install -y git > /dev/null 2>&1
    print_success "Git installed"
}

clone_repository() {
    echo ""
    read -p "Enter your Git repository URL: " GIT_URL
    
    if [ -d "$HOME/rentohub" ]; then
        print_warning "rentohub directory already exists"
        read -p "Remove and re-clone? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf $HOME/rentohub
        else
            print_info "Using existing directory"
            cd $HOME/rentohub
            git pull origin main
            return
        fi
    fi
    
    print_info "Cloning repository..."
    git clone $GIT_URL $HOME/rentohub
    cd $HOME/rentohub
    print_success "Repository cloned"
}

setup_application() {
    print_info "Current directory: $(pwd)"
    
    # Check for .env.production
    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found!"
        print_info "Please upload .env.production to EC2:"
        print_info "  scp -i key.pem .env.production ubuntu@EC2_IP:~/rentohub/"
        read -p "Press enter after uploading .env.production..."
    fi
    
    print_info "Installing dependencies..."
    npm ci --only=production > /dev/null 2>&1
    print_success "Dependencies installed"
    
    print_info "Generating Prisma client..."
    npx prisma generate > /dev/null 2>&1
    print_success "Prisma client generated"
    
    print_info "Running database migrations..."
    npx prisma migrate deploy
    print_success "Database migrations complete"
    
    print_info "Building application..."
    npm run build > /dev/null 2>&1
    print_success "Application built"
    
    print_info "Starting application with PM2..."
    pm2 start npm --name "rentohub" -- start > /dev/null 2>&1
    pm2 save > /dev/null 2>&1
    print_success "Application started"
    
    print_info "Setting up PM2 startup..."
    pm2 startup | tail -1 | bash > /dev/null 2>&1
    print_success "PM2 startup configured"
}

setup_nginx() {
    print_info "Configuring Nginx..."
    
    # Copy config if it exists in project
    if [ -f "nginx/anir.co.in.conf" ]; then
        sudo cp nginx/anir.co.in.conf /etc/nginx/sites-available/anir.co.in
    else
        # Create basic config
        create_nginx_config
    fi
    
    # Enable site
    if [ ! -L "/etc/nginx/sites-enabled/anir.co.in" ]; then
        sudo ln -s /etc/nginx/sites-available/anir.co.in /etc/nginx/sites-enabled/
    fi
    
    # Test config
    sudo nginx -t > /dev/null 2>&1
    print_success "Nginx configuration valid"
    
    sudo systemctl restart nginx
    print_success "Nginx started"
}

create_nginx_config() {
    cat > /tmp/anir.co.in.conf << 'NGINX_EOF'
upstream nextjs_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name anir.co.in www.anir.co.in;
    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF
    sudo mv /tmp/anir.co.in.conf /etc/nginx/sites-available/anir.co.in
}

setup_ssl() {
    print_info "Setting up SSL certificate..."
    print_warning "Make sure your domain nameservers point to Route 53"
    print_info "This is required for SSL validation"
    
    read -p "Have you updated nameservers? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please update nameservers in Route 53 first"
        print_info "Then run: sudo certbot certonly --standalone -d anir.co.in -d www.anir.co.in"
        return
    fi
    
    print_info "Obtaining SSL certificate..."
    sudo certbot certonly --standalone -d anir.co.in -d www.anir.co.in
    
    # Update Nginx config for HTTPS
    print_info "Updating Nginx for HTTPS..."
    create_nginx_https_config
    
    sudo nginx -t > /dev/null 2>&1
    sudo systemctl restart nginx
    print_success "SSL configured"
    
    # Enable auto-renewal
    sudo systemctl enable certbot.timer > /dev/null 2>&1
    print_success "Auto-renewal configured"
}

create_nginx_https_config() {
    cat > /tmp/anir.co.in.conf << 'NGINX_EOF'
upstream nextjs_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name anir.co.in www.anir.co.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name anir.co.in www.anir.co.in;
    
    ssl_certificate /etc/letsencrypt/live/anir.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anir.co.in/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /_next/static {
        proxy_pass http://nextjs_backend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
    sudo mv /tmp/anir.co.in.conf /etc/nginx/sites-available/anir.co.in
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main
fi
