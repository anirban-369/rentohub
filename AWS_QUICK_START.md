# AWS Deployment Quick Start Guide

Get your RentoHub application live on `rentohub.anir.co.in` in 30 minutes!

## Prerequisites

- AWS Account
- Domain `rentohub.anir.co.in` (already registered or ready to register)
- Stripe production keys (if you want payments)
- Git repository (GitHub, GitLab, etc.)

---

## 5-Step Deployment Process

### Step 1: Set Up AWS Services (10 mins)

#### 1.1 Create RDS Database

```bash
AWS Console → RDS → Create database

Engine: PostgreSQL 15
Instance: db.t3.micro (free tier)
Name: rentohub
Username: anirban
Password: Create strong password
Publicly accessible: No

COPY the endpoint after creation
```

#### 1.2 Launch EC2 Instance

```bash
AWS Console → EC2 → Launch instance

AMI: Ubuntu Server 22.04 LTS
Instance: t2.micro (free tier)
Storage: 20 GB
Security Group: Create new (allow 22, 80, 443)
Key pair: Create & download (save as rentohub-key.pem)
```

#### 1.3 Set Up Route 53

```bash
AWS Console → Route 53

Create hosted zone
Domain: rentohub.anir.co.in
Copy the 4 nameservers
Update your domain registrar with these nameservers
```

---

### Step 2: Connect to EC2 (2 mins)

```bash
# Make key accessible
chmod 400 rentohub-key.pem

# SSH into instance
ssh -i rentohub-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Once connected, run deployment script
curl -O https://raw.githubusercontent.com/YOUR_REPO/scripts/deploy-ec2.sh
bash deploy-ec2.sh
```

---

### Step 3: Deploy Application (10 mins)

```bash
# On your local machine - prepare files
cp .env.production ~/.env.production.backup

# Edit .env.production with actual values:
# DATABASE_URL=postgresql://anirban:PASSWORD@RDS_ENDPOINT:5432/rentohub
# JWT_SECRET=generate-strong-random-string
# STRIPE_SECRET_KEY=sk_live_xxx
# etc.

# Upload to EC2
scp -i rentohub-key.pem .env.production ubuntu@EC2_IP:~/rentohub/

# Build and start on EC2
ssh -i rentohub-key.pem ubuntu@EC2_IP << 'EOF'
cd ~/rentohub
npm run build
npx prisma migrate deploy
pm2 start npm --name "rentohub" -- start
pm2 save
EOF
```

---

### Step 4: Set Up SSL Certificate (5 mins)

```bash
# SSH to EC2
ssh -i rentohub-key.pem ubuntu@EC2_IP

# Copy Nginx config
sudo cp nginx/rentohub.anir.co.in.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/rentohub.anir.co.in.conf /etc/nginx/sites-enabled/
sudo nginx -t

# Create certbot directory
sudo mkdir -p /var/www/certbot

# Get SSL certificate
sudo certbot certonly --standalone -d rentohub.anir.co.in -d www.rentohub.anir.co.in

# Restart Nginx
sudo systemctl restart nginx

# Enable auto-renewal
sudo systemctl enable certbot.timer
```

---

### Step 5: Configure DNS (2 mins)

```bash
AWS Console → Route 53 → Your Zone (rentohub.anir.co.in)

Create Record:
- Type: A
- Name: rentohub.anir.co.in
- Value: YOUR_EC2_PUBLIC_IP
- TTL: 300

Create Record:
- Type: CNAME
- Name: www
- Value: rentohub.anir.co.in
- TTL: 300
```

---

## ✅ Verification Checklist

After deployment, verify everything works:

```bash
# 1. Check application is running
pm2 status

# 2. Check Nginx
sudo systemctl status nginx

# 3. Test local connection
curl http://localhost:3000

# 4. Test through Nginx
curl http://localhost

# 5. Check logs
pm2 logs rentohub
sudo tail -f /var/log/nginx/error.log

# 6. Test DNS (wait up to 48 hours)
nslookup rentohub.anir.co.in
curl https://rentohub.anir.co.in
```

---

## 🔧 Common Commands

### View Application Logs
```bash
pm2 logs rentohub
```

### Restart Application
```bash
pm2 restart rentohub
```

### Rebuild Application
```bash
npm run build
pm2 restart rentohub
```

### Update Application
```bash
git pull
npm install
npm run build
pm2 restart rentohub
```

### Database Migrations
```bash
npx prisma migrate deploy
npx prisma studio  # Interactive DB browser
```

### Nginx Config Check
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitor Performance

### CPU/Memory Usage
```bash
pm2 monit
```

### Application Logs
```bash
pm2 logs rentohub --lines 100
```

### Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

### Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs rentohub

# Verify environment variables
cat .env.production

# Test database connection
psql -h RDS_ENDPOINT -U anirban -d rentohub
```

### Cannot connect to database
```bash
# SSH to EC2 and test
sudo apt install postgresql-client
psql -h your-rds-endpoint -U anirban -d rentohub

# Check security group
# - RDS must allow inbound from EC2 security group on port 5432
# - EC2 must allow outbound on port 5432
```

### Domain not resolving
```bash
# Check nameservers in Route 53
nslookup rentohub.anir.co.in

# Can take up to 48 hours for DNS to propagate
# Use dig for more detailed info
dig rentohub.anir.co.in
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --dry-run

# Check Nginx SSL config
sudo nginx -t
```

### Nginx returning 502 Bad Gateway
```bash
# Make sure app is running
pm2 status

# Check Nginx config
sudo nginx -t

# Check if port 3000 is listening
netstat -tlnp | grep 3000
```

---

## 📈 Next Steps

1. **Set up monitoring:**
   - CloudWatch for AWS services
   - Sentry for error tracking
   - New Relic or DataDog for APM

2. **Optimize performance:**
   - Set up CloudFront CDN
   - Enable image optimization
   - Configure caching headers

3. **Increase reliability:**
   - Set up RDS Multi-AZ
   - Configure Auto Scaling Group
   - Use Application Load Balancer (ALB)

4. **Automate deployments:**
   - GitHub Actions CI/CD
   - Automatic builds and deployments
   - Blue-green deployments

5. **Security hardening:**
   - Enable AWS WAF
   - Configure security groups properly
   - Use IAM roles for EC2
   - Enable VPC endpoints for S3

---

## 💰 Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| EC2 t2.micro | 12 months free | ~$9/month |
| RDS db.t3.micro | 12 months free | ~$12/month |
| Route 53 | First 25 queries free | $0.50/month |
| S3 storage | 5 GB free | ~$1-5/month |
| Data transfer | 1 GB free | ~$5-10/month |
| **Total (first year)** | Free | **Free (free tier)** |
| **Total (after free tier)** | - | **~$25-40/month** |

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

---

Good luck! 🚀 You'll have your website live soon!
