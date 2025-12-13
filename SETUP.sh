#!/bin/bash
# 🚀 RentoHub - Complete Setup Script
# Copy-paste commands to make your website fully functional

echo "🚀 RentoHub Setup Script"
echo "========================"

# ============================================
# STEP 1: Environment Setup
# ============================================
echo "📋 STEP 1: Setting up environment..."

# Copy env file
cp .env.example .env.local

echo "✅ Created .env.local"
echo "📝 Now edit .env.local with your credentials:"
echo "   - DATABASE_URL: postgresql://..."
echo "   - JWT_SECRET: your-secret-key"
echo "   - STRIPE_SECRET_KEY: sk_test_..."
echo "   - STRIPE_PUBLISHABLE_KEY: pk_test_..."
echo "   - STRIPE_WEBHOOK_SECRET: whsec_..."
echo "   - NEXT_PUBLIC_MAPBOX_TOKEN: pk.eyJ1..."
echo "   - AWS_ACCESS_KEY_ID: AKIA..."
echo "   - AWS_SECRET_ACCESS_KEY: ..."
echo ""
read -p "Press ENTER after updating .env.local..."

# ============================================
# STEP 2: Create PostgreSQL Database
# ============================================
echo "📦 STEP 2: Creating PostgreSQL database..."

# Create database
createdb rentohub 2>/dev/null || psql -U postgres -c "CREATE DATABASE rentohub;" 2>/dev/null || true

echo "✅ Database created (or already exists)"
echo ""

# ============================================
# STEP 3: Install Dependencies
# ============================================
echo "📥 STEP 3: Installing dependencies..."
npm install

echo "✅ Dependencies installed"
echo ""

# ============================================
# STEP 4: Setup Database Schema
# ============================================
echo "🗄️ STEP 4: Setting up database schema..."

npx prisma db push

echo "✅ Database schema created"
echo ""

# ============================================
# STEP 5: Create Admin User
# ============================================
echo "👨‍💼 STEP 5: Admin user setup..."
echo "Starting dev server to create first user..."
echo ""
echo "Follow these steps:"
echo "1. Go to http://localhost:3000/register"
echo "2. Register with:"
echo "   Email: admin@rentohub.com"
echo "   Password: Admin123456"
echo "   Name: Admin User"
echo "3. After registration, STOP the server (Ctrl+C)"
echo "4. Run the SQL command below to make user admin"
echo ""
echo "SQL Command (run in new terminal):"
echo "psql rentohub"
echo 'UPDATE "User" SET role = '"'"'ADMIN'"'"' WHERE email = '"'"'admin@rentohub.com'"'"';'
echo "\q"
echo ""
read -p "Press ENTER after setting up admin..."

# ============================================
# STEP 6: Start Development Server
# ============================================
echo "🚀 STEP 6: Starting development server..."
echo ""
echo "Run this command:"
echo "npm run dev"
echo ""
echo "Server will be at: http://localhost:3000"
echo ""

# ============================================
# STEP 7: Testing
# ============================================
echo "✅ TESTING CHECKLIST"
echo "===================="
echo ""
echo "Register a new user:"
echo "  - Go to http://localhost:3000/register"
echo "  - Email: renter@test.com"
echo "  - Password: Test123456"
echo "  - Click Register"
echo ""
echo "Login as admin:"
echo "  - Go to http://localhost:3000/login"
echo "  - Email: admin@rentohub.com"
echo "  - Password: Admin123456"
echo "  - Click Login"
echo ""
echo "Access admin panel:"
echo "  - Go to http://localhost:3000/admin"
echo "  - Should see dashboard with analytics"
echo ""
echo "Test complete flow:"
echo "  - Create listing at /dashboard/listings/create"
echo "  - Browse at /browse"
echo "  - Book at /listings/[id]"
echo "  - Pay (test card: 4242 4242 4242 4242)"
echo ""

# ============================================
# STEP 8: Build for Production
# ============================================
echo "🏗️ STEP 8: Building for production..."
echo ""
echo "Run this command:"
echo "npm run build"
echo ""
echo "Then start production server:"
echo "npm start"
echo ""

# ============================================
# STEP 9: Deployment
# ============================================
echo "🌐 STEP 9: Deployment options..."
echo ""
echo "Option A: Vercel (Recommended)"
echo "  npm i -g vercel"
echo "  vercel"
echo ""
echo "Option B: Railway"
echo "  Connect your GitHub repo"
echo "  Set environment variables"
echo "  Deploy"
echo ""
echo "Option C: AWS"
echo "  Create EC2 instance"
echo "  Clone repo and follow the same steps"
echo ""

echo "🎉 Setup complete!"
echo "========================"
