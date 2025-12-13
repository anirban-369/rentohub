# 🚀 RentoHub - Complete Setup to Production Guide

## ❓ QUESTION 1: STEPS TO MAKE WEBSITE FULLY FUNCTIONAL

Follow these steps **in order** to make RentoHub fully functional and error-free:

---

## 📋 STEP 1: PREREQUISITES (REQUIRED)

Before starting, ensure you have:

- ✅ Node.js 18+ installed: `node --version`
- ✅ npm or yarn: `npm --version`
- ✅ PostgreSQL installed and running
- ✅ Git (for version control)
- ✅ A code editor (VS Code recommended)

---

## 🔧 STEP 2: LOCAL ENVIRONMENT SETUP

### 2.1 Create Environment File

```bash
# Navigate to project directory
cd /Users/anir/Downloads/rentohub-new

# Copy example to actual env file
cp .env.example .env.local
```

### 2.2 Fill in Environment Variables

Edit `.env.local` with your credentials:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/rentohub"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars-xxxxxx"

# Stripe (Get from stripe.com/developers)
STRIPE_SECRET_KEY="sk_test_51234567890..."
STRIPE_PUBLISHABLE_KEY="pk_test_51234567890..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51234567890..."

# Mapbox (Get from mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# AWS S3 (Get from AWS Console)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="us-east-1"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional for dev)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

## 📦 STEP 3: DATABASE SETUP

### 3.1 Create PostgreSQL Database

```bash
# Start PostgreSQL
# On Mac: brew services start postgresql
# Or use: psql

# Create database
createdb rentohub

# Or via psql:
psql
CREATE DATABASE rentohub;
\q
```

### 3.2 Run Prisma Migrations

```bash
# Install dependencies first (next step)
# Then run migrations:
npx prisma migrate deploy

# OR for development (creates/updates schema):
npx prisma db push

# Verify schema was created:
npx prisma studio  # Opens visual database browser
```

---

## 📥 STEP 4: INSTALL DEPENDENCIES

```bash
# Install all npm packages
npm install

# This installs all 538 packages including:
# - Next.js, React, TypeScript
# - Stripe, Mapbox, AWS SDK
# - Prisma, bcrypt, JWT
# - And all other dependencies
```

**Expected output**: "added 538 packages"

---

## ✅ STEP 5: VERIFY DATABASE MODELS

```bash
# Check that all 12 models are created:
npx prisma studio

# Should see:
# - User
# - KYC
# - Listing
# - Booking
# - DeliveryJob
# - Review
# - Dispute
# - Notification
# - StripeLog
# - And more...
```

---

## 👤 STEP 6: CREATE FIRST ADMIN USER

### 6.1 Start Dev Server (First Time)

```bash
# Run dev server
npm run dev

# Server runs on http://localhost:3000
```

### 6.2 Register First User

1. Go to: `http://localhost:3000/register`
2. Create account with:
   - Email: `admin@rentohub.com`
   - Password: `Admin123456`
   - Name: `Admin User`
   - Phone: (optional)
3. Click Register

### 6.3 Make User an Admin (SQL)

```bash
# Open new terminal
psql rentohub

# Make user admin:
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@rentohub.com';

# Verify:
SELECT id, email, role FROM "User";
\q
```

---

## 🔑 STEP 7: CREATE STRIPE TEST KEYS

### 7.1 Get Stripe Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
3. Update `.env.local`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### 7.2 Create Webhook Secret

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add an endpoint"
3. URL: `http://localhost:3000/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook secret to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_test_..."
   ```

---

## 🗺️ STEP 8: GET MAPBOX TOKEN

### 8.1 Create Mapbox Account

1. Go to: https://account.mapbox.com/auth/signup
2. Sign up with email
3. Go to: https://account.mapbox.com/tokens/
4. Copy your **default public token**
5. Update `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."
   ```

---

## 🪣 STEP 9: SETUP AWS S3 (for file uploads)

### 9.1 Create S3 Bucket

1. Go to: https://console.aws.amazon.com/s3
2. Click "Create bucket"
3. Bucket name: `rentohub-uploads-[your-name]`
4. Region: `us-east-1`
5. Leave other settings default
6. Click "Create"

### 9.2 Create IAM User with S3 Access

1. Go to: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. Name: `rentohub-app`
4. Skip console password
5. Click "Next" → "Create policy"
6. Select "S3" → "All S3 actions"
7. Resources → "Specific" → "bucket" → Add your bucket name
8. Click "Create policy"
9. Attach policy to user
10. Go to "Security credentials"
11. Create "Access key"
12. Copy keys to `.env.local`:
    ```
    AWS_ACCESS_KEY_ID="AKIA..."
    AWS_SECRET_ACCESS_KEY="..."
    AWS_BUCKET_NAME="rentohub-uploads-[your-name]"
    AWS_REGION="us-east-1"
    ```

---

## 🔄 STEP 10: START DEVELOPMENT SERVER

```bash
# Terminal 1: Development server
npm run dev

# Server runs at: http://localhost:3000
```

**Verify no errors in console**

---

## ✨ STEP 11: TEST COMPLETE FLOW

### 11.1 Create Test Lender (with KYC)

1. **Register**: Go to http://localhost:3000/register
   - Email: `lender@test.com`
   - Password: `Test123456`
   - Name: `Test Lender`

2. **Submit KYC**: Go to http://localhost:3000/dashboard/kyc
   - Upload dummy ID image
   - Upload dummy address proof image
   - Click "Submit KYC"

3. **Admin Approves**: 
   - Login as admin: `admin@rentohub.com`
   - Go to http://localhost:3000/admin/kyc
   - Click "Approve"

4. **Create Listing**:
   - Logout, login as lender
   - Go to http://localhost:3000/dashboard/listings/create
   - Fill form:
     - Title: "Mountain Bike"
     - Description: "Great condition"
     - Category: "Sports"
     - Condition: "Good"
     - Price/Day: 25
     - Deposit: 50
     - Add location: (pick any place on map)
   - Upload images
   - Click "Create Listing"

### 11.2 Book as Renter

1. **Register new user**:
   - Email: `renter@test.com`
   - Password: `Test123456`

2. **Browse listings**: Go to http://localhost:3000/browse
   - Should see the "Mountain Bike" listing

3. **Book item**:
   - Click listing → "Book Now"
   - Select dates
   - See cost breakdown
   - Click "Proceed to Payment"

4. **Make test payment**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Click "Pay"

5. **Accept booking as lender**:
   - Login as lender
   - Go to http://localhost:3000/dashboard/bookings
   - Click "Accept Booking"
   - See delivery job created

### 11.3 Test Delivery Tracking

1. **Assign delivery agent**:
   - Login as admin
   - Go to http://localhost:3000/admin/delivery-assignments
   - Select unassigned delivery
   - Assign to a user

2. **Track delivery**:
   - Login as renter
   - Go to booking detail
   - See live map with delivery tracking

---

## 🐛 STEP 12: FIX ANY ERRORS

### Common Errors & Solutions

**Error: "Database connection failed"**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Fix connection string in .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/rentohub"
```

**Error: "Missing environment variables"**
```bash
# Check .env.local has all required keys
cat .env.local

# Restart dev server after updating .env.local
npm run dev
```

**Error: "Prisma schema out of sync"**
```bash
npx prisma generate
npx prisma db push
npm run dev
```

**Error: "JWT errors / Can't login"**
```bash
# Clear browser cookies and try again
# Or change JWT_SECRET in .env.local and try again
```

**Error: "Stripe errors"**
```bash
# Verify webhook is configured:
# https://dashboard.stripe.com/test/webhooks
# 
# Check webhook secret matches .env.local
# 
# Test webhook: Use Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🏗️ STEP 13: BUILD FOR PRODUCTION

```bash
# Build application
npm run build

# Start production server
npm start

# App runs on http://localhost:3000
```

**Verify build completes successfully** (no errors)

---

## 🚀 STEP 14: DEPLOY TO PRODUCTION

### Option A: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to GitHub repo
# - Select framework: Next.js
# - Set environment variables (paste from .env.local)
# - Deploy
```

### Option B: Deploy to AWS

1. Create EC2 instance (Node.js)
2. Clone repo
3. Install dependencies
4. Set environment variables
5. Build: `npm run build`
6. Start: `npm start`

### Option C: Deploy to Railway/Render

1. Connect GitHub repo
2. Set environment variables
3. Database: Connect PostgreSQL
4. Deploy automatically

---

## ✅ PRODUCTION CHECKLIST

Before going live:

- ✅ All environment variables set correctly
- ✅ Database is PostgreSQL (not SQLite)
- ✅ Stripe keys are LIVE keys (not test)
- ✅ Mapbox token is valid
- ✅ AWS S3 bucket configured
- ✅ SSL/HTTPS enabled
- ✅ Admin user created
- ✅ Test payment successful
- ✅ Email notifications working
- ✅ Error monitoring setup (Sentry optional)
- ✅ Backup strategy in place
- ✅ Rate limiting enabled

---

---

## ❓ QUESTION 2: HOW ADMIN ACCESSES ADMIN PANEL

### **ADMIN LOGIN FLOW**

#### Step 1: Register as User
```
Go to: http://localhost:3000/register
Email: admin@rentohub.com
Password: Admin123456
Name: Admin User
Phone: (optional)
```

#### Step 2: Promote User to Admin (Database)

```bash
# Open PostgreSQL terminal
psql rentohub

# Run this SQL:
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@rentohub.com';

# Exit
\q
```

#### Step 3: Login to Admin Panel

1. Go to: http://localhost:3000/login
2. Email: `admin@rentohub.com`
3. Password: `Admin123456`
4. Click "Login"
5. Redirected to dashboard
6. Click on admin section OR go directly to: http://localhost:3000/admin

---

### **ADMIN PANEL PAGES**

Once logged in as admin, access these pages:

| Page | URL | Function |
|------|-----|----------|
| Dashboard | `/admin` | Analytics & overview |
| Users | `/admin/users` | Manage all users |
| KYC Review | `/admin/kyc` | Approve/reject KYC |
| Listings | `/admin/listings` | Manage listings |
| Listings Approval | `/admin/listings-approval` | Approve new listings |
| Bookings | `/admin/bookings` | Monitor bookings |
| Delivery Assignment | `/admin/delivery-assignments` | Assign delivery agents |
| Disputes | `/admin/disputes` | Resolve disputes |
| Payments | `/admin/payments` | View payment logs |

---

### **ADMIN CAPABILITIES**

**Users Management**:
- View all users
- See KYC status
- See user roles
- View join dates

**KYC Approval**:
- See pending KYC submissions
- View uploaded documents
- Approve or reject
- Add rejection reason
- Automatic notification to user

**Listing Approval**:
- View submitted listings
- See listing details
- Approve for public listing
- Reject with reason

**Delivery Assignment**:
- View unassigned deliveries
- See available delivery agents
- Assign agent with one click
- Auto-notify agent

**Bookings Monitoring**:
- View all bookings
- Track booking status
- See renter & lender info
- Monitor revenue

**Dispute Resolution**:
- View open disputes
- Review evidence/photos
- Adjust deposit refund
- Add resolution notes
- Close dispute

**Analytics Dashboard**:
- Total users
- Total listings
- Total bookings
- Active bookings
- Pending KYCs
- Open disputes
- Platform revenue

---

### **ADMIN AUTHORIZATION PROTECTION**

The middleware automatically:

1. **Checks JWT token** - Must be logged in
2. **Verifies role** - Must have `role = 'ADMIN'`
3. **Redirects non-admins** - Redirects to `/dashboard`
4. **Protects endpoints** - All admin actions require admin role

```typescript
// From middleware.ts
if (isAdminPath && user.role !== 'ADMIN') {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  return NextResponse.redirect(url)
}
```

---

### **CREATING ADDITIONAL ADMINS**

To create more admin users:

```bash
# Method 1: SQL
psql rentohub
UPDATE "User" SET role = 'ADMIN' WHERE email = 'new-admin@email.com';

# Method 2: API call (if endpoint available)
POST /api/admin/promote-user
Body: { userId: "...", role: "ADMIN" }
```

---

### **RESETTING ADMIN PASSWORD**

If admin password is lost:

```bash
# SQL to reset
psql rentohub

# Hash a new password first (use bcrypt online tool)
# Or use: openssl rand -base64 32

UPDATE "User" 
SET password = '[bcrypt-hashed-password]' 
WHERE email = 'admin@rentohub.com';
```

---

## 📞 TROUBLESHOOTING

**Admin can't access admin panel?**
```bash
# Check role is ADMIN
psql rentohub
SELECT email, role FROM "User" WHERE email = 'admin@rentohub.com';

# If role is USER, update it:
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@rentohub.com';
```

**Redirected to dashboard when visiting /admin?**
```bash
# Clear browser cookies
# Or open in private window
# Or check JWT_SECRET is same as when user logged in
```

**Can see admin but pages are empty?**
```bash
# Check database has data
psql rentohub
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Listing";

# Reload page
```

---

## ✨ SUMMARY

### To make website fully functional:

1. ✅ Setup `.env.local` with all keys
2. ✅ Create PostgreSQL database
3. ✅ Run `npm install`
4. ✅ Run `npx prisma db push`
5. ✅ Register first user and make admin
6. ✅ Get Stripe/Mapbox/AWS credentials
7. ✅ Start dev server: `npm run dev`
8. ✅ Test complete flow
9. ✅ Build: `npm run build`
10. ✅ Deploy to production

### To access admin panel:

1. ✅ Register or login as admin user
2. ✅ User must have `role = 'ADMIN'`
3. ✅ Go to `/admin` or click admin link
4. ✅ Access 9 admin management pages
5. ✅ Middleware protects all routes

---

**All steps are straightforward and fully documented. Follow in order and you'll have a fully functional RentoHub platform!**
