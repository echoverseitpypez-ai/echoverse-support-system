# Team Chat Debugging Guide

## 🔍 Debugging the "Unknown" Issue

### Step 1: Restart Server
```bash
npm run dev
```

### Step 2: Open Team Chat & Check Console

1. **Go to Team Chat page** (`/team-chat`)
2. **Open Browser Console** (Press F12)
3. **Look for these logs:**

#### ✅ Success Messages:
```
Loading profile for user: [user-id]
Profile loaded successfully: {id: "...", full_name: "...", role: "..."}
```

#### ❌ Error Messages:
```
Error getting auth user: [error]
No authenticated user found
Error loading profile: [error]
No profile found for user: [user-id]
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "No authenticated user found"
**Cause:** User is not logged in  
**Fix:** 
1. Go to `/login`
2. Login with your credentials
3. Go back to `/team-chat`

---

### Issue 2: "Error loading profile"
**Cause:** Profile doesn't exist in database  
**Fix:** Check Supabase profiles table
```sql
-- Run in Supabase SQL Editor
SELECT id, full_name, role FROM profiles WHERE id = 'YOUR_USER_ID';
```

---

### Issue 3: "Unknown User" in Chat
**Cause:** Chat member data not loading  
**Fix:** 
1. Make sure you clicked "New Chat"
2. Selected a team member from the list
3. Check console for errors

---

### Issue 4: Page stuck on "Loading your profile..."
**Cause:** 
- Supabase connection issue
- Profile doesn't exist
- RLS policies blocking access

**Fix:**
1. Check `.env` file has correct Supabase credentials
2. Verify profile exists:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```
3. Check RLS policies allow SELECT on profiles table

---

## ✅ Verification Steps

### 1. Check if you're logged in
```javascript
// In browser console:
const { data } = await supabase.auth.getUser()
console.log('Current user:', data.user)
```

### 2. Check if profile exists
```javascript
// In browser console:
const { data } = await supabase.from('profiles').select('*').eq('id', 'YOUR_USER_ID').single()
console.log('Profile:', data)
```

### 3. Check team members loading
```javascript
// In browser console:
const { data } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin', 'agent'])
console.log('Team members:', data)
```

---

## 🚀 Expected Flow

### Correct Loading Sequence:
1. Page loads → Shows "Loading chats..."
2. Fetches auth user → Console: "Loading profile for user: [id]"
3. Fetches profile → Console: "Profile loaded successfully"
4. Shows Team Chat interface with your name
5. Click "New Chat" → Shows team members list
6. Select member → Opens chat
7. Type and send message → Success!

---

## 📊 What Each Console Message Means

| Message | Meaning | Action |
|---------|---------|--------|
| `Loading profile for user: [id]` | Auth user found, fetching profile | ✅ Good |
| `Profile loaded successfully` | Profile fetched from database | ✅ Good |
| `Error getting auth user` | Not logged in | ❌ Login required |
| `No profile found for user` | Profile missing from database | ❌ Check Supabase |
| `Error loading profile: permission denied` | RLS policy issue | ❌ Check policies |

---

## 🔧 Quick Fixes

### Fix 1: Ensure profile exists
```sql
-- Run in Supabase SQL Editor
-- Replace with your actual user ID
INSERT INTO profiles (id, full_name, role)
VALUES ('YOUR_USER_ID', 'Your Name', 'admin')
ON CONFLICT (id) DO UPDATE 
SET full_name = 'Your Name', role = 'admin';
```

### Fix 2: Check RLS policies
```sql
-- Verify profiles table allows SELECT
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
```

### Fix 3: Reset and test
1. Logout → Login again
2. Clear browser cache (Ctrl+Shift+Delete)
3. Go to Team Chat
4. Check console logs

---

## 💡 Tips

- Always check browser console first
- Console logs will tell you exactly what's wrong
- "Unknown User" = member data not loaded
- "Loading your profile..." = currentUser is null
- Empty chat list = No chats created yet

---

## ✅ Success Indicators

You know it's working when:
- ✅ No "Unknown" text
- ✅ Your name shows in sidebar/header
- ✅ Team members list populates when clicking "New Chat"
- ✅ Can select member and open chat
- ✅ Messages send successfully

---

**If still stuck, share the console error messages and I'll help debug further!** 🔍
