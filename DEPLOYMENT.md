# RentoHub - Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Neon, Supabase, or Railway recommended)
- Stripe account
- AWS S3 bucket or Supabase Storage
- Mapbox account

### Step 1: Prepare Your Database

#### Option A: Neon (Recommended - Free Tier Available)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use the "Session Pooler" connection string)

#### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string from the "Connect" tab

### Step 2: Set Up Stripe

1. Go to [stripe.com](https://stripe.com)
2. Create an account or login
3. Get your API keys:
   - Dashboard → Developers → API keys
   - Copy "Publishable key" and "Secret key"
4. Set up webhook:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copy the webhook signing secret

### Step 3: Set Up AWS S3 or Supabase Storage

#### Option A: AWS S3
1. Create an AWS account
2. Create an S3 bucket:
   ```
   - Name: rentohub-uploads-[unique-id]
   - Region: us-east-1 (or your preferred region)
   - Block all public access: OFF
   - Enable ACLs
   ```
3. Create IAM user:
   - Go to IAM → Users → Add user
   - Attach policy: `AmazonS3FullAccess`
   - Save Access Key ID and Secret Access Key
4. Configure CORS on the bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

#### Option B: Supabase Storage (Alternative)
1. In your Supabase project
2. Go to Storage
3. Create a new bucket: `rentohub-uploads`
4. Set bucket to public
5. Update `src/lib/storage.ts` to use Supabase client

### Step 4: Get Mapbox Token

1. Go to [mapbox.com](https://mapbox.com)
2. Create an account or login
3. Go to Account → Access tokens
4. Copy your default public token or create a new one

### Step 5: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - RentoHub"

# Create a repo on GitHub and push
git remote add origin https://github.com/yourusername/rentohub.git
git branch -M main
git push -u origin main
```

### Step 6: Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables (see below)
6. Click "Deploy"

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables
```

### Step 7: Configure Environment Variables in Vercel

Go to your project → Settings → Environment Variables

Add the following:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Stripe
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (same as above)

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=rentohub-uploads-xyz
AWS_REGION=us-east-1

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important**: Add these variables to:
- Production
- Preview (optional)
- Development (optional)

### Step 8: Run Database Migrations

After first deployment:

```bash
# Install dependencies locally if not done
npm install

# Set your DATABASE_URL in .env locally
DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Optional: Seed the database
npx prisma db seed
```

Alternatively, add a build script to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Step 9: Update Stripe Webhook URL

1. Go to Stripe Dashboard → Developers → Webhooks
2. Update your webhook endpoint URL:
   `https://your-domain.vercel.app/api/stripe/webhook`
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel with the new secret

### Step 10: Test Your Deployment

1. Visit your Vercel URL
2. Register a new account
3. Try logging in
4. Submit KYC (you'll need to approve it manually via database)
5. Create a test listing
6. Test the booking flow (use Stripe test cards)

## 🔧 Post-Deployment Configuration

### Create First Admin User

Run this SQL in your database:

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

### Approve First KYC

```sql
UPDATE "KYC"
SET status = 'APPROVED', "reviewedAt" = NOW()
WHERE "userId" = (
  SELECT id FROM "User" WHERE email = 'your-email@example.com'
);
```

### Test Stripe Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret and update your .env
```

## 📊 Monitoring & Maintenance

### Database Backups

**Neon**: Automatic backups
**Supabase**: Go to Database → Backups
**Railway**: Automatic daily backups

### Logs

View logs in:
- Vercel Dashboard → Your Project → Logs
- Stripe Dashboard → Developers → Events

### Performance Monitoring

Install Vercel Analytics:
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Vercel
2. Ensure all environment variables are set
3. Verify `DATABASE_URL` is correct
4. Run `npm run build` locally to test

### Database Connection Issues

1. Check connection string format
2. Ensure SSL mode is enabled: `?sslmode=require`
3. Verify database is accessible from Vercel's IP range
4. Check if database is not sleeping (free tier limitations)

### Stripe Webhook Not Working

1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` is set correctly
3. View webhook logs in Stripe Dashboard
4. Ensure endpoint is accessible (not behind auth)

### Images Not Uploading

1. Verify AWS credentials are correct
2. Check S3 bucket permissions (public read)
3. Verify CORS configuration on bucket
4. Check file size limits (increase if needed)

## 🔒 Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] `JWT_SECRET` is long and random (32+ characters)
- [ ] Using production Stripe keys (not test keys)
- [ ] Database has SSL enabled
- [ ] S3 bucket has appropriate permissions
- [ ] Webhook secrets are set correctly
- [ ] No sensitive data in git repository
- [ ] `.env` is in `.gitignore`

## 📈 Scaling Considerations

### Database

- Monitor connection pool size
- Add indexes for frequently queried fields
- Consider upgrading to paid tier for better performance

### Storage

- Implement CDN for images (Cloudflare, CloudFront)
- Compress images before upload
- Add image optimization

### API

- Implement rate limiting (use Vercel Edge Config)
- Add caching for frequently accessed data
- Use serverless functions strategically

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

### Recommended Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit
3. Push to GitHub: `git push origin feature/new-feature`
4. Vercel creates preview deployment
5. Test preview deployment
6. Merge to main when ready
7. Automatic production deployment

## 📱 Custom Domain Setup

1. Go to Vercel → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Stripe webhook URL

## 🎉 You're Live!

Your RentoHub is now deployed and ready to use. Monitor logs, gather user feedback, and iterate!

### Next Steps

- Set up custom domain
- Configure email notifications (add SMTP settings)
- Add analytics (Google Analytics, Mixpanel)
- Set up error tracking (Sentry)
- Create admin scripts for common tasks
- Document admin procedures
- Plan marketing strategy

### Support

If you encounter issues:
1. Check Vercel logs
2. Check database logs
3. Check Stripe dashboard
4. Review this guide
5. Consult Next.js documentation

---

**Happy Deploying! 🚀**
