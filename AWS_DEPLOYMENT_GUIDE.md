# RentoHub AWS Deployment Guide

Deploy your Next.js application to `anir.co.in` using AWS services.

## Architecture Overview

We'll use:
- **AWS RDS** - PostgreSQL database (managed)
- **AWS EC2** - Application server (or use App Runner for easier management)
- **AWS Route 53** - Domain DNS management
- **AWS S3** - File uploads storage (already configured)
- **AWS CloudFront** - CDN for static files and caching
- **AWS Certificate Manager** - SSL/TLS certificate (free)

---

## Step 1: Prepare Your Application

### 1.1 Create Production Environment File

Create `.env.production` in your project root:

```bash
# Database (will be your RDS endpoint)
DATABASE_URL="postgresql://your-username:your-password@your-rds-endpoint:5432/rentohub"

# JWT Secret (use a strong, unique key)
JWT_SECRET="your-production-jwt-secret-key-here"

# Stripe Keys (use production keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# AWS S3 (keep your existing config)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="eu-north-1"

# Production App URL
NEXT_PUBLIC_APP_URL="https://anir.co.in"

# Optional: Analytics, Sentry, etc.
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

### 1.2 Create Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

### 1.3 Create .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.DS_Store
.next
out
```

### 1.4 Update next.config.js (if not optimized)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
    unoptimizedgain: process.env.NODE_ENV === 'production' ? false : true,
  },
};

module.exports = nextConfig;
```

---

## Step 2: Set Up AWS Services

### 2.1 Create RDS PostgreSQL Database

1. **Go to AWS RDS Console**
   - Navigate to: https://console.aws.amazon.com/rds/

2. **Create Database**
   - Click "Create database"
   - Engine: PostgreSQL (version 15 or higher)
   - DB instance class: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB
   - DB instance identifier: `rentohub-db`
   - Username: `anirban`
   - Password: Create a strong password
   - Publicly accessible: **No** (we'll access via EC2)
   - Database name: `rentohub`

3. **Security Group**
   - Create a new security group: `rentohub-db-sg`
   - Allow inbound traffic from EC2 security group on port 5432

4. **Get RDS Endpoint**
   - After creation, copy the endpoint (e.g., `rentohub-db.xxxxx.eu-north-1.rds.amazonaws.com`)
   - Update your `.env.production` with this endpoint

### 2.2 Create EC2 Instance

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS (free tier)
   - Instance Type: `t2.micro` (free tier)
   - Security Group: Create new `rentohub-app-sg`
   - Inbound Rules:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - HTTPS (port 443) from anywhere
   
2. **Allow RDS Access**
   - In EC2 security group, add outbound rule to RDS security group on port 5432

3. **Create and Download Key Pair**
   - Save as `rentohub-key.pem`
   - Set permissions: `chmod 400 rentohub-key.pem`

### 2.3 Register Domain with Route 53

1. **Transfer or Register Domain**
   - Go to: https://console.aws.amazon.com/route53/
   - Click "Hosted zones" → "Create hosted zone"
   - Domain: `anir.co.in`

2. **Get Nameservers**
   - Copy the 4 nameservers from Route 53
   - Update your domain registrar's nameserver settings

2. **Create Certificate in ACM**
   - Go to: https://console.aws.amazon.com/acm/
   - Request certificate for `rentohub.anir.co.in` and `*.rentohub.anir.co.in`
   - Add CNAME records in Route 53 to validate (automatic validation)

---

## Step 3: Deploy to EC2

### 3.1 Connect to EC2

```bash
ssh -i rentohub-key.pem ubuntu@your-ec2-public-ip
```

### 3.2 Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm globally
sudo npm install -g npm

# Install Docker (optional, recommended)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx
```

### 3.3 Deploy Application (Option A: Without Docker)

```bash
# Clone or upload your code
git clone <your-repo-url> ~/rentohub
cd ~/rentohub

# Create .env.production with your values
nano .env.production

# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start npm --name "rentohub" -- start
pm2 save
pm2 startup
```

### 3.4 Configure Nginx

Create `/etc/nginx/sites-available/anir.co.in`:

```nginx
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

    location /_next/static {
        proxy_pass http://nextjs_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        alias /home/ubuntu/rentohub/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS (after SSL is set up)
server {
    listen 443 ssl http2;
    server_name anir.co.in www.anir.co.in;
    
    ssl_certificate /etc/letsencrypt/live/anir.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anir.co.in/privkey.pem;
    
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
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/anir.co.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.5 Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d anir.co.in -d www.anir.co.in

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Step 4: Set Up DNS in Route 53

1. **Go to Route 53 Hosted Zone**
   - Select your zone: `anir.co.in`

2. **Create Records**
   
   **A Record (for root domain):**
   - Type: A
   - Name: `anir.co.in`
   - Value: Your EC2 public IP address
   - TTL: 300

   **CNAME Record (for www subdomain):**
   - Type: CNAME
   - Name: `www.anir.co.in`
   - Value: `anir.co.in`
   - TTL: 300

   **Optional: CloudFront Distribution** (for better performance)
   - Create CloudFront distribution pointing to your EC2 instance
   - Use ACM certificate for SSL

---

## Step 5: Monitor and Maintain

### Check Application Status

```bash
# View PM2 logs
pm2 logs rentohub

# Monitor processes
pm2 monit

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backups

- RDS automatically backs up daily (retention: 7 days)
- Enable automated backups in RDS console
- Consider enabling Multi-AZ for high availability

### Auto-scaling (Optional)

- Use Auto Scaling Group for production
- Set up LoadBalancer (ALB) in front of EC2 instances
- Configure CloudWatch alarms for monitoring

---

## Cost Estimation (Monthly)

| Service | Cost |
|---------|------|
| EC2 t2.micro | ~$9.50 (free tier for 1 year) |
| RDS db.t3.micro | ~$12.50 (free tier for 1 year) |
| S3 (with current usage) | ~$1-5 |
| Data Transfer | Varies |
| Route 53 | $0.50 |
| SSL Certificate | Free (ACM) |
| **Total** | ~$25-30/month (or free with free tier) |

---

## Troubleshooting

### Application not connecting to database

```bash
# SSH into EC2 and test connection
sudo apt install postgresql-client
psql -h your-rds-endpoint -U anirban -d rentohub
```

### Nginx configuration error

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload
```

### PM2 application crashed

```bash
pm2 restart rentohub
pm2 logs rentohub  # Check error logs
```

### Domain not resolving

- Check Route 53 hosted zone nameservers match your domain registrar
- DNS propagation can take up to 48 hours
- Verify with: `nslookup anir.co.in`

---

## Next Steps

1. Set up CloudFront for static assets CDN
2. Configure CloudWatch monitoring and alarms
3. Set up automated backups and disaster recovery
4. Implement CI/CD pipeline (GitHub Actions → AWS)
5. Enable AWS WAF for security

---

## Quick Reference: Environment Variables

Update these in `.env.production` before deployment:

```
DATABASE_URL=postgresql://anirban:password@your-rds-endpoint:5432/rentohub
JWT_SECRET=your-secure-random-string
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
NEXT_PUBLIC_APP_URL=https://anir.co.in
```

Good luck with your deployment! 🚀
