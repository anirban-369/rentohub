# Database Setup Instructions

## Issue: Permission Denied

Your PostgreSQL user (`anirban_369`) doesn't have permission to create objects in the public schema.

## Solution - Run these commands as PostgreSQL admin:

```sql
-- Connect as postgres superuser first:
-- psql -U postgres -d rentohub

-- Then grant all permissions:
GRANT ALL PRIVILEGES ON SCHEMA public TO anirban_369;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anirban_369;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anirban_369;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anirban_369;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anirban_369;
```

## Step-by-step:

### 1. Connect as Superuser (using psql)
```bash
psql -U postgres -d rentohub
```

### 2. Run the SQL commands above
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO anirban_369;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anirban_369;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anirban_369;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anirban_369;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anirban_369;
\q
```

### 3. Then run Prisma setup:
```bash
cd /Users/anir/Downloads/rentohub-new
npx prisma db push
```

## If You Get "password authentication failed":

The postgres user password might be required. Try:
```bash
psql -U postgres -h localhost -d rentohub
# Enter password when prompted
```

## Alternative: If You Don't Have Postgres Admin Access

Contact your database administrator to run the GRANT commands above.

---

**After permissions are fixed, run:**
```bash
npx prisma db push
npx prisma generate
npm run dev
```

And the application will be ready at `http://localhost:3000`
