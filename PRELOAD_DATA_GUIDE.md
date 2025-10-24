# 🚀 Preload Data System

Complete guide to preloading your Echoverse Support System with test data to avoid delays when Render wakes up.

---

## 🎯 Purpose

When deploying on Render's free tier, the server sleeps after 15 minutes of inactivity. The **preload data system** populates your database with realistic test data so users see content immediately, even during the ~30 second wake-up period.

---

## ⚡ Quick Start

```bash
# Full seed with test users + tickets + messages (RECOMMENDED)
npm run db:seed:full

# Basic seed (settings only)
npm run db:seed
```

---

## 📦 What Gets Preloaded

### With `npm run db:seed:full`:

1. **5 Test Users** with login credentials
2. **5 Sample Tickets** (open, in_progress, resolved)
3. **6 Ticket Messages** (realistic conversations)
4. **All Settings** (app configuration)

### With `npm run db:seed`:

- Settings only (basic configuration)

---

## 👥 Test User Credentials

After running `npm run db:seed:full`, you can login with:

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| **Admin** | admin@echoverse.test | Admin@123456 | Full system access |
| **Agent** | agent@echoverse.test | Agent@123456 | Handle tickets |
| **Teacher** | teacher1@echoverse.test | Teacher@123456 | Create tickets |
| **Teacher** | teacher2@echoverse.test | Teacher@123456 | Create tickets |
| **User** | user@echoverse.test | User@123456 | Standard user |

---

## 📋 Sample Data Includes

### Tickets:
1. **Printer not working** (In Progress) - Hardware issue
2. **Projector display issue** (Open) - Display problem
3. **Cannot access student portal** (Resolved) - Access issue
4. **Wi-Fi disconnecting** (Open) - Network issue
5. **Request software license** (Open) - Software request

### Messages:
- Realistic back-and-forth conversations
- Different users (teachers, agents, students)
- Various timestamps showing activity flow

---

## 🔧 Setup Instructions

### 1. Get Service Role Key

**Required for seeding to work!**

1. Go to: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **`service_role`** key (NOT anon key!)

### 2. Update `.env.local`

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

**⚠️ SECURITY NOTE:**
- Keep this key secret!
- Never commit to Git (already protected by `.gitignore`)
- Gives full admin access to your database

### 3. Run Full Seed

```bash
npm run db:seed:full
```

**Expected output:**
```
🌱 Starting FULL data seeding with test users...
👤 Creating test users...
✅ Created user: admin@echoverse.test (ID: ce550ab9-...)
✅ Profile created for Admin User
...
🎫 Seeding tickets...
✅ Seeded ticket: Printer not working in Room C12
...
💬 Seeding ticket messages...
✅ Seeded message for ticket 8b7a1d58...
...
✨ Full data seeding completed successfully!

📝 Test Login Credentials:
   Admin:  admin@echoverse.test / Admin@123456
   ...
```

---

## 🔄 Re-Running Seeds

**Safe to run multiple times!**

The scripts use `upsert` operations:
- ✅ Updates existing records
- ✅ Creates new records if missing
- ✅ No duplicate data
- ✅ Idempotent (same result every time)

---

## 🚀 Deployment Workflow

### For Development:

```bash
# 1. Run full seed locally
npm run db:seed:full

# 2. Test your app
npm run dev

# 3. Login with test accounts
# admin@echoverse.test / Admin@123456
```

### For Production (Render):

1. **Deploy backend to Render**
2. **Add environment variables** in Render dashboard:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (All other Supabase variables)

3. **Run seed on Render** (one-time):
   - Go to Render Dashboard → Your service
   - Click **Shell** tab
   - Run: `npm run db:seed:full`

4. **OR run locally** (points to production DB):
   - Your local script will seed production Supabase
   - No need to run on Render

---

## 💡 Why This Helps with Render Sleep

### The Problem:
- Render free tier sleeps after 15 minutes
- First request takes ~30 seconds to wake up
- Empty database = users see nothing during wake-up

### The Solution:
- Preloaded data in Supabase (always awake)
- Users see tickets/messages immediately
- Backend wakes up in background
- No perceived delay for users

### Architecture:
```
┌─────────────┐
│  User Visit │
└──────┬──────┘
       │
       ↓
┌─────────────┐     ❌ Render sleeping
│  Frontend   │────────→ (30s wake up)
│  (Vercel)   │
└──────┬──────┘
       │ ✅ Direct connection
       ↓
┌─────────────┐
│  Supabase   │  ← Already has data!
│  (Database) │     Users see content immediately
└─────────────┘
```

---

## 📊 Data Volume

Perfect for free tiers:

- **Users:** 5 test accounts (~5KB)
- **Tickets:** 5 samples (~10KB)
- **Messages:** 6 messages (~5KB)
- **Settings:** 11 settings (~2KB)

**Total:** ~22KB of preloaded data

---

## 🛠️ Customizing Seed Data

### Add More Tickets:

Edit `scripts/seed-full-data.js`:

```javascript
const SAMPLE_TICKETS = [
  // Add your ticket here
  {
    id: 'your-uuid-here',
    title: 'Your ticket title',
    description: 'Description here',
    status: 'open',  // open, in_progress, resolved, closed
    priority: 'normal',  // low, normal, high, urgent
    created_by: 'teacher-user-id',
    assigned_to: 'agent-user-id',
    department_id: 2,
    created_at: '2025-01-17T10:00:00Z',
    updated_at: '2025-01-17T10:00:00Z'
  }
];
```

### Add More Users:

```javascript
const TEST_USERS = [
  {
    id: 'your-uuid',  // optional, will auto-generate
    email: 'newuser@echoverse.test',
    password: 'Password@123',
    full_name: 'New User Name',
    role: 'user',  // admin, agent, teacher, user
    department_id: 1,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newuser'
  }
];
```

---

## 🧪 Testing

### Verify Seed Data:

```bash
# Check what's in database
node scripts/check-db-data.js
```

**Output shows:**
- Departments count
- Settings count
- Profiles count
- Tickets count

### Test Login:

1. Start app: `npm run dev`
2. Go to: http://localhost:5173
3. Login with: `agent@echoverse.test` / `Agent@123456`
4. You should see the 5 preloaded tickets!

---

## 🐛 Troubleshooting

### Error: "Invalid API key"

**Solution:** You're using `VITE_SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`.

Update `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: "violates foreign key constraint"

**Solution:** Users don't exist in `auth.users` table.

`npm run db:seed:full` will create them automatically!

### Error: "No profiles found"

**Solution:** Run the full seed, not basic seed:
```bash
npm run db:seed:full
```

### Seed runs but no output

**Solution:** The script entry point wasn't working. This has been fixed in the latest version.

---

## 📝 NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:seed:full` | **Full seed** - users, tickets, messages (recommended) |
| `npm run db:seed` | **Basic seed** - settings only |
| `node scripts/check-db-data.js` | **Check** what's currently in database |
| `node scripts/list-tables.js` | **List** all tables and record counts |

---

## 🎓 Best Practices

### Development:
1. ✅ Use `npm run db:seed:full` to get started
2. ✅ Test with preloaded accounts
3. ✅ Create real users via signup form
4. ✅ Mix test and real data

### Staging:
1. ✅ Run full seed on staging database
2. ✅ Test all user roles
3. ✅ Verify ticket workflows
4. ✅ Check real-time features

### Production:
1. ⚠️  Consider security implications
2. ⚠️  Use strong passwords if keeping test accounts
3. ✅ Delete test accounts after initial demo
4. ✅ Populate with real data from your organization

---

## 🔒 Security Considerations

### Test Accounts in Production:

**Option 1: Delete after demo**
```javascript
// Run in Supabase SQL Editor
DELETE FROM auth.users WHERE email LIKE '%@echoverse.test';
```

**Option 2: Change passwords**
- Use Supabase dashboard to reset passwords
- Use complex, unique passwords
- Limit permissions if keeping

**Option 3: Disable test accounts**
- Remove from `profiles` table
- Keep in `auth.users` but ban them

### Service Role Key:

- ✅ Only in `.env.local` (gitignored)
- ✅ Only on secure servers (Render, not Vercel)
- ✅ Never in frontend code
- ✅ Never committed to Git

---

## 📊 Performance Impact

**Database Size:**
- Minimal impact (~22KB)
- Well within free tier limits

**Query Performance:**
- No noticeable impact
- Indexes already in place
- Supabase handles efficiently

**Benefits:**
- ✅ Instant content on first visit
- ✅ No "empty state" during Render wake-up
- ✅ Better demo experience
- ✅ Faster development testing

---

## 🎉 Success Indicators

After running `npm run db:seed:full`:

✅ **Console shows:**
- ✅ Created user: admin@echoverse.test
- ✅ Seeded ticket: Printer not working
- ✅ Seeded message for ticket...
- ✅ Final Database State: Tickets: 6, Messages: 6

✅ **App shows:**
- Can login with test accounts
- See 5+ tickets on dashboard
- Messages appear in ticket details
- Different ticket statuses visible

---

## 📞 Need Help?

Check:
1. `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
2. Supabase project is active
3. RLS policies allow service role operations
4. Run `node scripts/check-db-data.js` to verify

---

**Last Updated:** January 17, 2025
**Version:** 2.0.0
