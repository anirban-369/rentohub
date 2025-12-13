# 🚀 RentoHub - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Stripe account (test mode)
- Mapbox account
- AWS S3 bucket (optional for development)

## 1. Environment Setup

Create `.env.local` file in the root directory:

```bash
# Copy from example
cp .env.local.example .env.local
```

Update the following values:

```bash
# Database (use local PostgreSQL or cloud provider like Supabase)
DATABASE_URL="postgresql://username:password@localhost:5432/rentohub"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-generated-secret-here"

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Get after setting up webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# AWS S3 (for production) or use mock in development
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="rentohub-uploads"

# Mapbox (get free token from https://account.mapbox.com/)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 2. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Create Admin User (Manual)

Since there's no admin signup, create an admin user directly in the database:

### Option 1: Using Prisma Studio
```bash
npx prisma studio
```
1. Go to `User` model
2. Create a new user with `role: ADMIN`
3. Use a strong password (it will be hashed on first login attempt)

### Option 2: Using SQL
```sql
-- First, generate a bcrypt hash for your password
-- You can use: https://bcrypt-generator.com/

INSERT INTO "User" (
  id, 
  email, 
  password, 
  "firstName", 
  "lastName", 
  role, 
  "kycStatus"
) VALUES (
  gen_random_uuid(),
  'admin@rentohub.com',
  '$2a$10$YourBcryptHashHere', -- Replace with actual bcrypt hash
  'Admin',
  'User',
  'ADMIN',
  'APPROVED'
);
```

## 6. Test User Flows

### As a Regular User:

1. **Register**
   - Go to `/register`
   - Create account with email/password

2. **Complete KYC** (Required to create listings)
   - Go to `/dashboard/kyc`
   - Upload ID proof and address proof images
   - Wait for admin approval (or approve yourself as admin)

3. **Create Listing**
   - Go to `/dashboard/listings/create`
   - Fill in listing details
   - Upload photos (at least 3)
   - Select location on map
   - Submit

4. **Browse & Book**
   - Go to `/browse`
   - Find an item
   - Select dates
   - Make booking request
   - Complete payment

### As an Admin:

1. **Login as Admin**
   - Use the admin account created above
   - Go to `/login`

2. **Access Admin Panel**
   - Go to `/admin`
   - View analytics dashboard

3. **Approve KYC**
   - Go to `/admin/kyc`
   - Review submitted documents
   - Approve or reject

4. **Monitor Activity**
   - `/admin/users` - View all users
   - `/admin/listings` - View all listings
   - `/admin/bookings` - View all bookings
   - `/admin/disputes` - Resolve disputes

## 7. Stripe Webhook Setup (For Local Testing)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret shown and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 8. Mapbox Setup

1. Sign up at [https://account.mapbox.com/](https://account.mapbox.com/)
2. Create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
3. Copy the token and add to `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npx prisma generate
```

### Issue: "Database connection failed"
**Solution:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Test connection: `psql "postgresql://username:password@localhost:5432/rentohub"`

### Issue: "Stripe publishable key not found"
**Solution:**
- Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
- Restart dev server after adding environment variables

### Issue: "Map not loading"
**Solution:**
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is correct
- Check browser console for errors
- Ensure token has correct permissions

### Issue: "Image upload fails"
**Solution:**
- For development, you can mock the S3 upload
- Or set up actual AWS S3 bucket with CORS configuration
- Check AWS credentials are correct

## Project Structure

```
rentohub-new/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── actions/          # Server actions
│   │   ├── api/              # API routes
│   │   ├── admin/            # Admin pages
│   │   ├── dashboard/        # User dashboard pages
│   │   ├── listings/         # Listing pages
│   │   └── bookings/         # Booking pages
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   └── middleware.ts         # Route protection
├── .env.local.example        # Environment template
└── package.json
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
npx prisma db pull   # Pull schema from database
```

## Default Ports

- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5432

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` to a strong random value
2. Use production Stripe keys (starts with `pk_live_` and `sk_live_`)
3. Enable HTTPS/SSL
4. Set proper CORS policies
5. Use environment-specific database
6. Enable rate limiting
7. Add monitoring and logging
8. Regular security audits

## Support

For issues or questions:
1. Check the documentation in `/docs` folder
2. Review `FRONTEND_COMPLETE.md` for implementation details
3. Check `PROJECT_SUMMARY.md` for architecture overview

## Next Steps

1. ✅ Complete environment setup
2. ✅ Create admin user
3. ✅ Test all user flows
4. ✅ Configure webhooks
5. ✅ Deploy to Vercel/production

---

**Ready to build! 🚀** Start the dev server and visit http://localhost:3000
