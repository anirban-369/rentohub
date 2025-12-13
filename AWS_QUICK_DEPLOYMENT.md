# 🚀 RentoHub to AWS Deployment - START HERE

Welcome! This guide will help you deploy your RentoHub application to `rentohub.rentohub.anir.co.in` using AWS.

## 📋 What You'll Have After Deployment

✅ Your website live at `https://rentohub.anir.co.in`  
✅ HTTPS/SSL certificate (free with Let's Encrypt)  
✅ PostgreSQL database in AWS RDS  
✅ Application running 24/7  
✅ Custom domain with professional setup  
✅ S3 storage for file uploads  

---

## ⏱️ Time Required

- **Quick Path (EC2):** 45 minutes - $25-40/month
- **Managed Path (App Runner):** 20 minutes - $30-50/month
- **Docker Path:** 1 hour - $25-40/month

**First year FREE with AWS Free Tier!**

---

## 📚 Documentation Files (Read in Order)

### 1. **🟢 START HERE: AWS_QUICK_START.md**
   - 5-step quick deployment guide
   - 30-minute path to live website
   - Best for beginners
   - **Read this first!**

### 2. **📖 AWS_DEPLOYMENT_GUIDE.md**
   - Comprehensive detailed guide
   - Step-by-step AWS setup
   - Troubleshooting section
   - In-depth explanations

### 3. **✨ DEPLOYMENT_SUMMARY.md**
   - Architecture overview
   - Cost breakdown
   - Next steps after deployment
   - Learning resources

### 4. **📋 Configuration Files**
   - `Dockerfile` - Container setup
   - `nginx/rentohub.anir.co.in.conf` - Web server config
   - `.env.production` - Environment variables template

### 5. **🛠️ Scripts**
   - `scripts/deploy-ec2.sh` - Automated EC2 setup
   - `scripts/deploy-full-automation.sh` - Complete automation
   - `scripts/setup-environment.sh` - Environment variable helper

---

## 🎯 Quick Reference

### What You Need Before Starting

**AWS Account:**
- ✅ Created and verified
- ✅ Access keys ready

**Domain:**
- ✅ `rentohub.anir.co.in` ready to update nameservers

**Credentials:**
- ✅ Stripe keys (optional, for payments)
- ✅ AWS S3 access (you have this already)

---

## 🚀 30-Minute Quick Start

### Step 1: Set Up AWS Services (10 min)
```bash
1. Create RDS PostgreSQL database
2. Launch EC2 Ubuntu instance
3. Create Route 53 hosted zone
4. Note all endpoints and IPs
```

### Step 2: Deploy Application (15 min)
```bash
# SSH to EC2
ssh -i key.pem ubuntu@YOUR_EC2_IP

# Run deployment
bash deploy-full-automation.sh
```

### Step 3: Configure Domain (5 min)
```bash
1. Update nameservers at your registrar
2. Get SSL certificate (automated)
3. Verify at https://rentohub.anir.co.in
```

---

## 📂 Project Structure

```
rentohub-new/
├── 📄 AWS_QUICK_START.md              ← Read this first!
├── 📄 AWS_DEPLOYMENT_GUIDE.md         ← Detailed guide
├── 📄 DEPLOYMENT_SUMMARY.md           ← Overview & checklist
├── 📄 AWS_QUICK_DEPLOYMENT.md         ← This file
│
├── Dockerfile                          # Container config
├── .dockerignore                       # Docker build ignore
├── .env.production                     # Environment template
│
├── nginx/
│   └── rentohub.anir.co.in.conf                # Production Nginx config
│
└── scripts/
    ├── deploy-ec2.sh                  # Basic EC2 setup
    ├── deploy-full-automation.sh      # Complete automation
    └── setup-environment.sh           # Env variable helper
```

---

## 🎓 Learning Path

**If you're new to AWS:**
1. Read `AWS_QUICK_START.md` (5 min)
2. Create AWS account
3. Follow the step-by-step guide
4. Deploy your application

**If you're experienced with AWS:**
1. Review `Dockerfile` and Nginx config
2. Use `deploy-full-automation.sh`
3. Refer to `AWS_DEPLOYMENT_GUIDE.md` for specifics

**If you want managed solution:**
1. See AWS App Runner option in `AWS_DEPLOYMENT_GUIDE.md`
2. No server management needed
3. Auto-scaling included

---

## ✅ Deployment Checklist

### Before You Start
- [ ] AWS account created
- [ ] EC2 key pair created and downloaded
- [ ] Domain registrar access ready
- [ ] Stripe keys ready (optional)

### During Deployment
- [ ] RDS database created
- [ ] EC2 instance launched
- [ ] Route 53 zone created
- [ ] .env.production filled with values
- [ ] Application deployed
- [ ] SSL certificate obtained

### After Deployment
- [ ] Domain nameservers updated
- [ ] SSL working (green lock visible)
- [ ] Application responding
- [ ] Database connections working
- [ ] File uploads to S3 working

---

## 💡 Pro Tips

1. **Security:** Never commit `.env.production` to Git!
2. **Backups:** Enable RDS automated backups
3. **Monitoring:** Set up CloudWatch alarms
4. **Updates:** Use GitHub Actions for CI/CD
5. **Scaling:** Use Auto Scaling groups for high traffic

---

## 🆘 Common Questions

**Q: How much will it cost?**  
A: Free for 1 year (free tier), then ~$25-40/month

**Q: Can I use a different domain later?**  
A: Yes! Update nameservers and Route 53 records

**Q: Is HTTPS required?**  
A: Not for deployment, but highly recommended (free with Let's Encrypt)

**Q: Can I scale later?**  
A: Yes! Start small and add more resources as needed

**Q: How do I update my application?**  
A: `git pull → npm run build → pm2 restart`

---

## 📞 Support Resources

| Issue | Solution |
|-------|----------|
| Application won't start | Check: `pm2 logs rentohub` |
| Can't connect to database | Verify: security groups, RDS credentials |
| Domain not working | Check: nameservers, Route 53 records |
| SSL certificate issues | Run: `sudo certbot certificates` |
| Nginx errors | Test: `sudo nginx -t` |

---

## 🎯 Next Steps

### Right Now
1. ✅ You're reading this
2. → Open `AWS_QUICK_START.md`
3. → Follow the 5-step guide
4. → Deploy your app

### After Deployment
1. Test website on `https://rentohub.anir.co.in`
2. Test user registration
3. Test file uploads
4. Test payments (if using Stripe)
5. Set up monitoring

### Within a Week
1. Set up automated CI/CD
2. Configure backups
3. Set up monitoring/alerts
4. Optimize performance

---

## 📊 Architecture at a Glance

```
                    Your Users
                        ↓
                    Route 53 DNS
                    (rentohub.anir.co.in)
                        ↓
                  Nginx + SSL/TLS
                   (Port 80/443)
                        ↓
                  Next.js App
                  (Port 3000)
                        ↓
                  AWS RDS Database
                   (PostgreSQL)
                        ↓
                  AWS S3 Storage
                (File uploads)
```

---

## 🚀 Ready to Deploy?

**Next Step:** Open `AWS_QUICK_START.md` and follow the 30-minute guide!

### Quick Command Cheat Sheet

```bash
# View application status
pm2 status

# View application logs
pm2 logs rentohub

# Restart application
pm2 restart rentohub

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate
sudo certbot certificates

# Test database connection
psql -h YOUR_RDS_ENDPOINT -U anirban -d rentohub

# View processes on port 3000
lsof -iTCP:3000

# Rebuild and restart
cd ~/rentohub && npm run build && pm2 restart rentohub
```

---

## 📖 Full Documentation Index

1. **AWS_QUICK_START.md** - 30-min quick deployment guide ⭐
2. **AWS_DEPLOYMENT_GUIDE.md** - Complete technical guide
3. **DEPLOYMENT_SUMMARY.md** - Architecture & overview
4. **Dockerfile** - Container configuration
5. **nginx/rentohub.anir.co.in.conf** - Web server config
6. **.env.production** - Environment variables
7. **scripts/deploy-full-automation.sh** - One-command deployment

---

## ✨ Good Luck! 🎉

Your journey to deploying RentoHub starts now!

**Questions?** Check the troubleshooting section in `AWS_DEPLOYMENT_GUIDE.md`

**Ready?** → Open `AWS_QUICK_START.md` and let's go! 🚀
