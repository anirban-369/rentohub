# Quick Start Instructions

## Prerequisites Check
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database ready
- [ ] Stripe account created
- [ ] AWS S3 or Supabase Storage ready
- [ ] Mapbox API key obtained

## 5-Minute Setup

### Step 1: Install Dependencies (Already Done! ✓)
```bash
npm install
```

### Step 2: Environment Variables
```bash
# Copy the template
cp .env.example .env

# Edit .env and add your credentials
nano .env  # or use any text editor
```

**Minimum required to start:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/rentohub"
JWT_SECRET="your-random-secret-at-least-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) View your database
npx prisma studio
```

### Step 4: Create Admin User
```bash
# First, run the app and register a user
npm run dev

# Then run this SQL in Prisma Studio or your database:
# UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Step 5: Start Development
```bash
npm run dev
```

Open http://localhost:3000

---

## What You Can Test Right Now

✅ **Homepage** - http://localhost:3000
✅ **Register** - http://localhost:3000/register
✅ **Login** - http://localhost:3000/login
✅ **Browse** - http://localhost:3000/browse
✅ **Dashboard** - http://localhost:3000/dashboard (after login)

---

## Quick Test Checklist

1. **Register a new user**
   - Go to /register
   - Fill form and submit
   - Should redirect to /dashboard

2. **Login**
   - Go to /login
   - Enter credentials
   - Should redirect to /dashboard

3. **View Dashboard**
   - See user stats
   - See KYC status banner

4. **Browse (Empty Initially)**
   - Go to /browse
   - See search/filter interface
   - No listings yet (need to create them)

---

## Local Database Tools

### Prisma Studio (Recommended)
```bash
npx prisma studio
```
Opens a GUI at http://localhost:5555 to view/edit database

### psql (Command Line)
```bash
psql postgresql://user:pass@localhost:5432/rentohub
```

---

## Common Issues & Solutions

### ❌ Database Connection Failed
**Solution**: 
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running: `brew services start postgresql` (Mac)
- Test connection: `psql "your-database-url"`

### ❌ Prisma Client Not Found
**Solution**:
```bash
npx prisma generate
```

### ❌ Module Not Found Errors
**Solution**:
```bash
rm -rf node_modules
npm install
```

### ❌ Port 3000 Already in Use
**Solution**:
```bash
lsof -ti:3000 | xargs kill -9
# or
npm run dev -- -p 3001
```

---

## Development Workflow

### 1. Make Database Changes
```bash
# Edit prisma/schema.prisma
# Then run:
npx prisma migrate dev --name your_change_name
```

### 2. View Real-Time Logs
```bash
npm run dev
# Check terminal for errors
```

### 3. Test API Endpoints
Use Postman, Insomnia, or curl:
```bash
curl http://localhost:3000/api/auth/session
```

---

## Next Steps After Setup

1. **Add Stripe Credentials** (for payment testing)
   - Get test keys from Stripe Dashboard
   - Add to .env
   - Test payments with test card: 4242 4242 4242 4242

2. **Add AWS S3 Credentials** (for image uploads)
   - Create S3 bucket
   - Get access keys
   - Add to .env

3. **Add Mapbox Token** (for maps)
   - Get token from Mapbox
   - Add to .env as NEXT_PUBLIC_MAPBOX_TOKEN

4. **Build Missing Pages** (see PROJECT_SUMMARY.md)
   - Start with listing detail page
   - Then listing creation form
   - Then booking flow

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create migration
npx prisma migrate reset # Reset database (DEV ONLY!)
npx prisma generate      # Generate Prisma Client

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check (if configured)

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
```

---

## Project Status

✅ **Backend**: 90% Complete
⚠️ **Frontend**: 30% Complete  
✅ **Database**: 100% Complete
✅ **Documentation**: 100% Complete

**Ready to build the remaining UI! 🚀**

---

## Support

- Read `README.md` for detailed documentation
- Read `DEPLOYMENT.md` for deployment guide
- Read `PROJECT_SUMMARY.md` for what's built vs what's needed
- Check `src/app/actions/` for all available server functions

**Happy coding! 💻**
