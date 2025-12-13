# RentoHub - 100% Setup Requirements for Production Launch

## Status: ✅ APPLICATION READY - CONFIGURATION NEEDED

The application code is **100% complete and production-ready**. You need to configure the following services and credentials:

---

## 1. DATABASE SETUP ⚠️ CRITICAL

### PostgreSQL Configuration
```bash
# Create PostgreSQL database (local or cloud)
# Examples:
# - Local: PostgreSQL 14+
# - Cloud: AWS RDS, Supabase, Railway, Render
```

**Required Details:**
- [ ] PostgreSQL Host (e.g., `localhost` or `db.example.com`)
- [ ] Database Name (e.g., `rentohub`)
- [ ] Database Username (e.g., `postgres`)
- [ ] Database Password (secure password)
- [ ] Database Port (default: `5432`)

**Connection String Format:**
```
postgresql://username:password@host:port/database_name
```

**Setup Steps:**
```bash
# 1. Create .env file
cp .env.example .env

# 2. Add DATABASE_URL
DATABASE_URL="postgresql://username:password@localhost:5432/rentohub"

# 3. Run migrations
npx prisma migrate deploy

# 4. Create admin user (after running app once)
# See ADMIN_SETUP section below
```

---

## 2. AUTHENTICATION & JWT ✅ (Partially Ready)

### JWT Secret
```env
JWT_SECRET="generate-a-random-secure-key-min-32-characters"
```

**How to generate:**
```bash
# macOS/Linux
openssl rand -base64 32

# or use Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Status:** ✅ Bcrypt configured, ready to use

---

## 3. PAYMENT PROCESSING - STRIPE ⚠️ CRITICAL

### Stripe Account Setup
1. Go to https://stripe.com
2. Create a business account
3. Get API keys from Dashboard → Developers → API Keys

**Required Credentials:**
```env
STRIPE_SECRET_KEY="sk_test_..." or "sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..." or "pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." or "pk_live_..."
```

**Webhook Setup:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Status:** ⚠️ Escrow payment system ready, needs credentials

---

## 4. FILE STORAGE - AWS S3 ⚠️ CRITICAL

### AWS S3 Setup
1. Go to https://aws.amazon.com
2. Create AWS Account or sign in
3. Navigate to S3 service
4. Create a new bucket (e.g., `rentohub-uploads`)

**Required Credentials:**
```env
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="us-east-1" # or your region
```

**How to get credentials:**
1. AWS Console → IAM → Users → Add User
2. Enable "Access key - Programmatic access"
3. Attach policy: `AmazonS3FullAccess`
4. Copy Access Key ID and Secret Access Key

**Bucket Configuration:**
- Enable CORS for your app domain
- Set public access if needed for image serving
- Enable versioning (recommended)

**Status:** ⚠️ Image upload system ready, needs credentials

---

## 5. MAPS & GEOLOCATION - LEAFLET + OPENSTREETMAP ✅ READY

### Leaflet with OpenStreetMap
- **No API key required** - uses free OpenStreetMap tiles
- Interactive location picker for listings
- Real-time delivery tracking map
- Address geocoding via Nominatim API (free)

**Configuration:**
- ✅ Maps work out of the box
- ✅ No setup or credentials needed
- ✅ 100% free and open-source

**Features:**
- Location selection for rental listings
- Live agent tracking for deliveries
- Reverse geocoding for addresses

**Status:** ✅ Fully configured and ready to use

---

## 6. APP CONFIGURATION ✅ Ready

```env
# Your production domain
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# For local development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 7. EMAIL NOTIFICATIONS (OPTIONAL)

If you want password reset emails and notifications:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com
2. Enable 2-Step Verification
3. Go to App passwords
4. Select Mail and Windows Computer
5. Copy the generated password

**Status:** ⚠️ Optional, currently logs to console

---

## 8. ADMIN USER SETUP ⚠️ REQUIRED

After database is set up:

```bash
# Start dev server
npm run dev

# Register as a normal user first at http://localhost:3000/register

# Then manually make yourself admin via database:
npx prisma studio

# Find your user and change role from "USER" to "ADMIN"
# Click on role dropdown and select ADMIN, save
```

**Alternative - Direct Database Update:**
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

**Admin Access:** http://localhost:3000/admin

---

## 9. DELIVERY AGENTS (OPTIONAL)

Assign delivery agents for the delivery tracking system:

```sql
UPDATE "User" SET role = 'DELIVERY_AGENT' WHERE email = 'delivery-agent@example.com';
```

---

## COMPLETE .env TEMPLATE

```env
# ========== CRITICAL ==========

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/rentohub"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-random-secure-key-here"

# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# AWS S3 File Upload
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="us-east-1"

# Mapbox Maps & Geolocation
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ========== OPTIONAL ==========

# Email Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

## DEPLOYMENT STEPS

### 1. Local Development
```bash
# Copy .env.example to .env
cp .env.example .env

# Fill in all credentials (at minimum: DATABASE_URL, JWT_SECRET, STRIPE_*, AWS_*, MAPBOX_TOKEN)

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Start dev server
npm run dev

# Visit http://localhost:3000
```

### 2. Production Deployment

**Option A: Using Vercel (Recommended for Next.js)**
```bash
# Push code to GitHub
git push origin main

# Deploy on Vercel:
# 1. Go to vercel.com
# 2. Connect GitHub repo
# 3. Add environment variables
# 4. Deploy
```

**Option B: Using Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Option C: Traditional VPS (AWS EC2, DigitalOcean, etc.)**
```bash
# SSH into server
ssh user@server.com

# Clone repo and set up
git clone <repo>
cd rentohub-new
npm install
npx prisma migrate deploy
npm run build

# Start with PM2 or similar
pm2 start "npm start"
```

---

## VERIFICATION CHECKLIST

### Before Launch ✅
- [ ] Database connected and migrations run
- [ ] JWT_SECRET generated and set
- [ ] Stripe API keys configured and webhook set up
- [ ] AWS S3 bucket created and credentials set
- [ ] Mapbox token configured
- [ ] Admin user created
- [ ] App URL configured
- [ ] Email (if needed) configured
- [ ] Test payment flow with Stripe test cards
- [ ] Test file upload to S3
- [ ] Test map display on listing page
- [ ] Test GPS tracking (delivery flow)
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`

---

## WHAT'S ALREADY IMPLEMENTED ✅

- ✅ User authentication (login/register)
- ✅ JWT token management
- ✅ Password reset flow
- ✅ KYC verification system
- ✅ Listing creation with images
- ✅ Real-time map display
- ✅ Booking system
- ✅ Payment escrow with Stripe
- ✅ Delivery tracking
- ✅ Admin dashboard
- ✅ Dispute resolution
- ✅ Reviews & ratings
- ✅ Notifications
- ✅ Responsive UI
- ✅ TypeScript full coverage
- ✅ Production build ready

---

## TROUBLESHOOTING

### Database Connection Error
```
Error: P1000 - Can't reach database server
```
**Solution:** Check DATABASE_URL format and PostgreSQL is running

### Stripe Keys Invalid
```
Error: Invalid API key provided
```
**Solution:** Ensure you're using test keys for development, live keys for production

### AWS Credentials Error
```
Error: The security token included in the request is invalid
```
**Solution:** Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct

### Mapbox Token Error
```
Error: Unauthorized - invalid token
```
**Solution:** Regenerate token in Mapbox Dashboard, ensure it has Maps & Geocoding permissions

---

## ESTIMATED TIME

- Database setup: 5-10 minutes
- Stripe setup: 5-10 minutes
- AWS S3 setup: 5-10 minutes
- Mapbox setup: 2-3 minutes
- Admin user creation: 1 minute
- **Total: ~20-35 minutes to production ready**

---

## SUPPORT & DOCUMENTATION

- Prisma Docs: https://www.prisma.io/docs/
- Stripe Docs: https://stripe.com/docs
- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- Mapbox Docs: https://docs.mapbox.com/
- Next.js Docs: https://nextjs.org/docs

---

**Questions? All code is typed and documented. Check src/lib/ for integration examples.**
