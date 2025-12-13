# Authentication Flow Test

## Server Status
- ✅ Dev Server Running on: http://localhost:3000
- ✅ Database Connected: PostgreSQL 15
- ✅ Existing Users: 4

## Database Users
- anirban.vgu@gmail.com - Anirban Kumar
- anirbank72@gmail.com - Anirban Kumar
- example@test.com - Anirban Kumar
- examples@test.com - Dr. Mahesh Jangid

## Fixed Issues
1. ✅ Register page now uses hard refresh (window.location.href)
2. ✅ Login page already uses hard refresh
3. ✅ Navbar fetches session with proper cache headers
4. ✅ Navbar listens for window focus events
5. ✅ Session API returns proper cache control headers
6. ✅ Removed unused redirect import from auth.ts

## Test Steps

### Test 1: Login with Existing User
1. Go to http://localhost:3000/login
2. Enter email: `anirban.vgu@gmail.com`
3. Enter password: (try any password first, should say "Invalid email or password")
4. Check console (F12) for logs starting with 🔐

**Expected Result**: Error message shown

### Test 2: Register New User
1. Go to http://localhost:3000/register
2. Fill in form:
   - Name: Test User
   - Email: testuser@example.com
   - Phone: Optional
   - Password: Test123456
3. Click Sign Up
4. Check console for ✅ Registration successful

**Expected Result**: 
- Should show "Creating Account..." while loading
- After ~800ms, should redirect to /dashboard
- Navbar should show "Test User" (not Login button)
- Console should show ✅ Registration successful

### Test 3: Logout
1. From dashboard, click Logout button
2. Should redirect to /login
3. Navbar should show Login/Sign Up buttons

**Expected Result**: Successful logout and redirect

### Test 4: Session Persistence
1. Login successfully
2. Refresh page (F5)
3. Navbar should still show username

**Expected Result**: Session persists

### Test 5: Protected Routes
1. Logout
2. Try to access http://localhost:3000/dashboard
3. Should redirect to /login

**Expected Result**: Protected route prevents access

## Debug Commands

### Check Database
```bash
/opt/homebrew/opt/postgresql@15/bin/psql -U anirban_369 -d rentohub -c "SELECT id, email, name FROM \"User\";"
```

### Check Cookie
Open DevTools (F12) → Application → Cookies → localhost:3000 → Look for `auth-token`

### Check Console Logs
Open DevTools → Console → Look for emoji logs (🔐 ✅ ❌ etc.)

### Check Network
Open DevTools → Network → Look for POST to /api/auth/session and /api/auth/logout

## Browser Console Should Show
- 📝 Registration attempt for: [email]
- 🔐 Hashing password...
- 💾 Creating user in database...
- ✅ User created: [id]
- ✅ Registration successful

OR

- 🔐 Login attempt for: [email]
- 🔍 Querying user from database...
- ✅ User found: [email]
- 🔑 Verifying password...
- 🎫 Generating token...
- 🍪 Setting auth cookie...
- ✅ Login successful for: [email]
