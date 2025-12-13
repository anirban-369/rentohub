# ⚡ QUICK START CHECKLIST

## 🚀 MAKE WEBSITE FUNCTIONAL (14 STEPS)

### Phase 1: Setup (10 mins)
- [ ] `cp .env.example .env.local`
- [ ] Fill `.env.local` with values:
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET
  - [ ] STRIPE keys
  - [ ] MAPBOX token
  - [ ] AWS credentials

### Phase 2: Database (5 mins)
- [ ] Create PostgreSQL database: `createdb rentohub`
- [ ] Run: `npx prisma db push`
- [ ] Verify: `npx prisma studio`

### Phase 3: Dependencies (3 mins)
- [ ] Run: `npm install`
- [ ] Wait for completion (all 538 packages)

### Phase 4: Admin Setup (5 mins)
- [ ] Start server: `npm run dev`
- [ ] Register user at `/register`
- [ ] Promote to admin via SQL:
  ```bash
  psql rentohub
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@rentohub.com';
  ```

### Phase 5: Stripe Setup (5 mins)
- [ ] Get keys from: https://dashboard.stripe.com/test/apikeys
- [ ] Add webhook at: https://dashboard.stripe.com/test/webhooks
- [ ] URL: `http://localhost:3000/api/stripe/webhook`
- [ ] Copy webhook secret to `.env.local`

### Phase 6: Mapbox Setup (2 mins)
- [ ] Get token from: https://account.mapbox.com/tokens/
- [ ] Paste to `.env.local`

### Phase 7: AWS S3 Setup (10 mins)
- [ ] Create S3 bucket
- [ ] Create IAM user with S3 access
- [ ] Copy access key & secret to `.env.local`

### Phase 8: Testing (15 mins)
- [ ] Test registration flow
- [ ] Test KYC submission
- [ ] Test admin approval
- [ ] Test listing creation
- [ ] Test booking & payment
- [ ] Test delivery tracking

### Phase 9: Build (5 mins)
- [ ] Run: `npm run build`
- [ ] Verify no errors

### Phase 10: Deploy (varies)
- [ ] Choose platform (Vercel/Railway/AWS)
- [ ] Set environment variables
- [ ] Deploy
- [ ] Test live site

---

## 👨‍💼 ADMIN PANEL ACCESS (3 STEPS)

### Step 1: Create Admin User
```bash
# Register at /register
# Email: admin@rentohub.com
# Password: Admin123456

# Then run SQL:
psql rentohub
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@rentohub.com';
```

### Step 2: Login
```
Go to: http://localhost:3000/login
Email: admin@rentohub.com
Password: Admin123456
```

### Step 3: Access Admin Panel
```
URL: http://localhost:3000/admin
```

---

## 🔗 ADMIN PANEL PAGES

```
/admin                  - Dashboard & analytics
/admin/users            - User management
/admin/kyc              - KYC approval
/admin/listings         - Listings management
/admin/listings-approval - New listings to approve
/admin/bookings         - Bookings monitoring
/admin/delivery-assignments - Assign delivery agents
/admin/disputes         - Dispute resolution
```

---

## 🐛 COMMON FIXES

**Database connection error?**
```bash
psql -U postgres -c "SELECT 1"
# Check DATABASE_URL in .env.local
```

**Can't login?**
```bash
# Clear browser cookies OR use private window
```

**Build errors?**
```bash
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

**Webhook not working?**
```bash
# Use Stripe CLI for testing:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## ✅ VERIFICATION CHECKLIST

Before considering "fully functional":

- [ ] Can register user
- [ ] Can login
- [ ] Can access dashboard
- [ ] Can submit KYC
- [ ] Can approve KYC as admin
- [ ] Can create listing
- [ ] Can browse listings
- [ ] Can book item
- [ ] Can pay with Stripe (test card: 4242 4242 4242 4242)
- [ ] Can accept booking
- [ ] Can see delivery tracking on map
- [ ] Can complete booking
- [ ] Can leave review
- [ ] Can access admin panel
- [ ] Can see all admin pages
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

**Total Setup Time: ~60 minutes for full functionality** ✨
