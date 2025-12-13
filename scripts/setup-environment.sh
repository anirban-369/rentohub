#!/bin/bash

# Setup script to generate required environment variables
# Run this to generate secure random values for production

echo "🔐 RentoHub AWS Deployment - Environment Setup"
echo "=============================================="
echo ""

# Generate JWT Secret
echo "Generating JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Display template
echo "📋 Environment Variables Template (.env.production)"
echo "=============================================="
cat > /tmp/env-template.txt << 'EOF'
# ============================================
# RentoHub Production Environment Variables
# ============================================

# DATABASE CONFIGURATION
# Get DATABASE_URL from your AWS RDS console
# Format: postgresql://username:password@endpoint:5432/rentohub
DATABASE_URL="postgresql://anirban:YOUR_RDS_PASSWORD@your-rds-endpoint.region.rds.amazonaws.com:5432/rentohub"

# JWT CONFIGURATION
# Generate secure secret: openssl rand -base64 32
JWT_SECRET="GENERATE_SECURE_JWT_SECRET_HERE"

# STRIPE PRODUCTION KEYS
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLISHABLE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLISHABLE"

# AWS S3 CONFIGURATION
# Create IAM user for S3 access
# Get from: https://console.aws.amazon.com/iam/
AWS_ACCESS_KEY_ID="AKIA_YOUR_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="eu-north-1"

# APPLICATION CONFIGURATION
NEXT_PUBLIC_APP_URL="https://anir.co.in"
NODE_ENV="production"

# OPTIONAL: Analytics & Monitoring
# NEXT_PUBLIC_GA_ID="G-YOUR_GOOGLE_ANALYTICS_ID"
# SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
EOF

cat /tmp/env-template.txt
echo ""

# Generate checklist
cat > /tmp/setup-checklist.txt << 'EOF'
✅ AWS Deployment Checklist

BEFORE DEPLOYMENT:
☐ AWS Account created and verified
☐ Domain anir.co.in registered/ready
☐ IAM user created for S3 access
☐ Stripe account created (if using payments)

AWS SERVICES:
☐ RDS PostgreSQL instance created
☐ EC2 instance launched (Ubuntu 22.04)
☐ Security groups configured properly
☐ Key pair downloaded and secured (rentohub-key.pem)

CONFIGURATION:
☐ .env.production file created with all values
☐ JWT_SECRET generated and added
☐ Database credentials configured
☐ Stripe keys (if needed) added
☐ AWS credentials configured
☐ RDS endpoint copied to DATABASE_URL

DEPLOYMENT:
☐ Code pushed to Git repository
☐ SSH access to EC2 verified
☐ Deployment script executed on EC2
☐ Dependencies installed
☐ Prisma migrations applied
☐ Application built successfully

SSL/DOMAIN:
☐ Route 53 hosted zone created
☐ Nameservers updated at domain registrar
☐ Nginx configuration deployed
☐ SSL certificate obtained (Let's Encrypt)
☐ Nginx restarted

VERIFICATION:
☐ Application running (pm2 status)
☐ Nginx serving requests
☐ Domain resolves to correct IP
☐ HTTPS working on https://anir.co.in
☐ Database connection working
☐ S3 uploads functional
☐ All API endpoints responding

MONITORING:
☐ PM2 logs checked for errors
☐ Nginx logs checked
☐ Application tested in browser
☐ Dashboard accessible and functional
EOF

cat /tmp/setup-checklist.txt
echo ""

# Create script to validate environment
cat > /tmp/validate-env.sh << 'EOF'
#!/bin/bash
echo "🔍 Validating Environment Variables..."

required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "STRIPE_SECRET_KEY"
  "STRIPE_PUBLISHABLE_KEY"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_BUCKET_NAME"
  "AWS_REGION"
  "NEXT_PUBLIC_APP_URL"
)

missing=0
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    ((missing++))
  else
    # Show first 10 chars only for security
    value="${!var}"
    echo "✅ $var = ${value:0:10}...${value: -5}"
  fi
done

if [ $missing -eq 0 ]; then
  echo ""
  echo "✅ All required variables are set!"
else
  echo ""
  echo "❌ $missing variables missing!"
  exit 1
fi
EOF

chmod +x /tmp/validate-env.sh

echo ""
echo "📝 Template saved to: /tmp/env-template.txt"
echo "✅ Checklist saved to: /tmp/setup-checklist.txt"
echo "🔍 Validation script: /tmp/validate-env.sh"
echo ""

echo "🚀 NEXT STEPS:"
echo "1. Edit the template with your values"
echo "2. Save as .env.production in your project"
echo "3. Upload to EC2 during deployment"
echo "4. Run validation script to verify all variables"
echo ""

# Offer to generate to file
read -p "Save template to current directory? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cp /tmp/env-template.txt .env.production.template
  echo "✅ Saved to: .env.production.template"
fi
