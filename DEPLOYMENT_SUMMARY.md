# 🚀 RentoHub AWS Deployment - Complete Setup

Your RentoHub application is ready to deploy to AWS with your domain `rentohub.anir.co.in`!

## 📦 Deployment Files Created

We've generated everything you need:

```
rentohub-new/
├── Dockerfile                    # Container configuration
├── .dockerignore               # Docker build ignore
├── .env.production             # Production environment template
├── AWS_DEPLOYMENT_GUIDE.md     # Detailed AWS setup guide
├── AWS_QUICK_START.md          # 30-minute quick start
├── DEPLOYMENT_SUMMARY.md       # This file
├── nginx/
│   └── rentohub.anir.co.in.conf         # Nginx reverse proxy config
└── scripts/
    ├── deploy-ec2.sh           # EC2 automated setup
    └── setup-environment.sh    # Environment variable generator
```

---

## 🎯 Your Deployment Path

### Option A: Simple Deployment (Recommended for beginners)

**Time: 45 minutes | Cost: Free (first year)**

1. **Create AWS Services** (15 min)
   - RDS PostgreSQL database
   - EC2 Ubuntu instance
   - Route 53 hosted zone

2. **Deploy Application** (20 min)
   - Connect via SSH
   - Run deployment script
   - Start application with PM2

3. **Configure Domain & SSL** (10 min)
   - Point nameservers to Route 53
   - Get SSL certificate
   - Start serving HTTPS

**See:** `AWS_QUICK_START.md`

---

### Option B: Docker Deployment (Better for production)

**Time: 1 hour | Cost: Similar**

1. **Build Docker image** locally
2. **Push to ECR** (AWS container registry)
3. **Deploy to ECS** or use App Runner
4. **Auto-scaling** ready

**Benefits:**
- Better isolation
- Easy updates
- Scalable
- Container orchestration

---

### Option C: Managed Platform (Easiest)

**Time: 20 minutes | Cost: ~$10-15/month**

Use AWS App Runner instead:
- No server management needed
- Automatic scaling
- Built-in CI/CD
- SSL included

---

## 📋 Quick Reference Checklist

### Pre-Deployment
- [ ] AWS Account created
- [ ] Domain `rentohub.anir.co.in` ready
- [ ] Stripe production keys (optional)
- [ ] IAM user with S3 permissions created

### AWS Setup
- [ ] RDS PostgreSQL created (endpoint copied)
- [ ] EC2 instance launched (public IP noted)
- [ ] Security groups configured (ports 22, 80, 443)
- [ ] Key pair downloaded and secured
- [ ] Route 53 hosted zone created

### Application Preparation
- [ ] `.env.production` filled with actual values
- [ ] Database credentials configured
- [ ] Stripe keys added (if needed)
- [ ] AWS S3 credentials set

### Deployment
- [ ] SSH access to EC2 verified
- [ ] Deployment script executed
- [ ] Dependencies installed
- [ ] Database migrations applied
- [ ] Application built and started

### Domain & SSL
- [ ] Nameservers updated at registrar
- [ ] Route 53 A record created
- [ ] Route 53 CNAME created for www
- [ ] SSL certificate obtained
- [ ] Nginx configured and started

### Verification
- [ ] Application running on localhost:3000
- [ ] Nginx serving on port 80/443
- [ ] HTTPS certificate valid
- [ ] Domain resolving correctly
- [ ] All features working (uploads, database, etc.)

---

## 🔑 Required Information to Have Ready

Before you start, gather these:

1. **AWS Account**
   - AWS Access Key ID
   - AWS Secret Access Key

2. **Domain Details**
   - Current registrar (for nameserver update)
   - Domain: `rentohub.anir.co.in`

3. **Database Credentials**
   - Generate a strong RDS password (save it!)
   - Use username: `anirban`

4. **Security**
   - Generate strong JWT secret: `openssl rand -base64 32`
   - Keep all secrets secure!

5. **Stripe Keys** (optional, if using payments)
   - Get from: https://dashboard.stripe.com/apikeys
   - Need: Secret key & Publishable key

6. **AWS S3**
   - Create IAM user for S3 access
   - Get: Access Key ID & Secret Access Key

---

## 🚀 Step-by-Step: Quick Start (30 minutes)

### Step 1: Create EC2 Instance (5 min)
```bash
1. AWS Console → EC2 → Launch instance
2. Select: Ubuntu Server 22.04 LTS
3. Instance type: t2.micro
4. Configure security group: Allow 22, 80, 443
5. Create key pair: download rentohub-key.pem
6. Launch and note the public IP
```

### Step 2: Create RDS Database (5 min)
```bash
1. AWS Console → RDS → Create database
2. Engine: PostgreSQL 15+
3. Instance: db.t3.micro
4. DB name: rentohub
5. Username: anirban
6. Password: (generate strong one)
7. Note the endpoint after creation
```

### Step 3: Connect & Deploy (15 min)
```bash
# On your local machine
chmod 400 rentohub-key.pem

# SSH to instance
ssh -i rentohub-key.pem ubuntu@YOUR_EC2_IP

# On EC2
curl -O https://raw.githubusercontent.com/YOUR_REPO/scripts/deploy-ec2.sh
bash deploy-ec2.sh

# Upload your prepared files
exit
scp -i rentohub-key.pem .env.production ubuntu@YOUR_EC2_IP:~/rentohub/

# Back to EC2
ssh -i rentohub-key.pem ubuntu@YOUR_EC2_IP
cd ~/rentohub
npm run build
pm2 start npm --name "rentohub" -- start
```

### Step 4: Setup Domain (5 min)
```bash
1. AWS Console → Route 53 → Create hosted zone
2. Add A record pointing to EC2 IP
3. Update nameservers at your registrar
4. Get SSL certificate with Certbot
5. Configure Nginx
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Internet Users                  │
│     (visits rentohub.anir.co.in)                │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Route 53 DNS   │
        │   rentohub.anir.co.in    │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │   AWS CloudFront (CDN)      │
        │   (optional for speed)      │
        └────────┬───────────────────┘
                 │
        ┌────────▼────────────────────┐
        │  Nginx Reverse Proxy        │
        │  (SSL/TLS termination)      │
        │  (Port 80 → 443)            │
        └────────┬───────────────────┘
                 │
        ┌────────▼────────────────────┐
        │  Next.js Application        │
        │  (PM2 managed)              │
        │  (Port 3000)                │
        └────────┬───────────────────┘
                 │
        ┌────────▼────────────────────┐
        │  AWS RDS PostgreSQL         │
        │  (rentohub database)        │
        │  (Port 5432)                │
        └─────────────────────────────┘

File uploads:
Next.js App → AWS S3 (rentohub-uploads bucket)
```

---

## 🔐 Security Best Practices

✅ **We've configured:**
- HTTPS/TLS encryption
- Security headers in Nginx
- Non-root container user
- Environment variable separation

📋 **Additional steps to consider:**
- [ ] Enable AWS WAF
- [ ] Configure VPC security groups properly
- [ ] Use IAM roles instead of access keys
- [ ] Enable CloudTrail logging
- [ ] Set up monitoring (CloudWatch)
- [ ] Enable database backups
- [ ] Use Systems Manager Parameter Store for secrets

---

## 💰 Monthly Cost (After Free Tier)

| Service | Quantity | Cost |
|---------|----------|------|
| EC2 t2.micro | 1 | $9.50 |
| RDS db.t3.micro | 1 | $12.50 |
| Route 53 | 1 zone | $0.50 |
| S3 storage | ~10 GB | $0.23 |
| Data transfer | ~50 GB | $4.50 |
| **Total** | | **~$27/month** |

**Free tier available for 12 months for new AWS accounts!**

---

## 🆘 Troubleshooting Common Issues

### "Connection refused" to database
```bash
# Verify security groups
# RDS must allow inbound port 5432 from EC2 security group
# EC2 must allow outbound port 5432

# Test connection
psql -h your-rds-endpoint -U anirban -d rentohub
```

### Application crashes on startup
```bash
# Check logs
pm2 logs rentohub

# Verify environment variables
cat .env.production

# Try building again
npm run build
```

### Domain not resolving
```bash
# Verify nameservers
nslookup rentohub.anir.co.in

# Can take 48 hours to propagate
# Check Route 53 records are correct
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Manually renew
sudo certbot renew

# Verify Nginx config
sudo nginx -t
```

---

## 📚 Documentation Files

1. **AWS_QUICK_START.md** - Start here! 30-minute guide
2. **AWS_DEPLOYMENT_GUIDE.md** - Comprehensive detailed guide
3. **nginx/rentohub.anir.co.in.conf** - Production Nginx configuration
4. **Dockerfile** - Container configuration
5. **scripts/deploy-ec2.sh** - Automated EC2 setup
6. **scripts/setup-environment.sh** - Environment variable helper

---

## ✨ Next Steps After Deployment

### Immediate (Day 1)
- [ ] Test all features on rentohub.anir.co.in
- [ ] Test user registration and login
- [ ] Test file uploads to S3
- [ ] Test payments with Stripe
- [ ] Check application performance

### Short-term (Week 1)
- [ ] Set up monitoring (CloudWatch, Sentry)
- [ ] Configure automated backups
- [ ] Set up SSL renewal automation
- [ ] Test mobile responsiveness

### Medium-term (Month 1)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure CloudFront CDN
- [ ] Enable database backups to S3
- [ ] Set up analytics

### Long-term (Ongoing)
- [ ] Monitor costs
- [ ] Plan scaling strategy
- [ ] Add auto-scaling groups
- [ ] Implement load balancing

---

## 🎓 Learning Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Nginx Reverse Proxy Setup](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Let's Encrypt SSL](https://letsencrypt.org/docs/)

---

## 📞 Support & Help

If you encounter issues:

1. **Check logs first:**
   ```bash
   pm2 logs rentohub
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verify configuration:**
   ```bash
   cat .env.production
   sudo nginx -t
   ```

3. **Test connectivity:**
   ```bash
   curl localhost:3000
   psql -h RDS_ENDPOINT -U anirban -d rentohub
   ```

4. **Check AWS services:**
   - AWS Console → RDS → Database status
   - AWS Console → EC2 → Instance status
   - AWS Console → Route 53 → Records

---

## ✅ Deployment Ready!

Your application is ready to go live! 

📌 **Bookmark these files:**
- AWS_QUICK_START.md - Your go-to deployment guide
- AWS_DEPLOYMENT_GUIDE.md - Detailed reference
- nginx/rentohub.anir.co.in.conf - Production configuration

**Good luck! 🚀 Your website will be live soon!**

For questions, refer to the detailed guides or AWS documentation.
