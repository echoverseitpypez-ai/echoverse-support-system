# Real-Time Updates Not Working? - Troubleshooting Guide

## 🚨 Quick Fix Steps

### Step 1: Enable Realtime in Supabase (MOST IMPORTANT!)

**This is required for real-time updates to work!**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the SQL script: `db/enable_tickets_realtime.sql`
4. Or manually run:

```sql
-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Also enable for profiles table (to get user names)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

### Step 2: Check Connection Status

Look at the **top right corner** of the admin dashboard:
- 🟢 **"Live"** = Connected and working ✅
- 🟡 **"Connecting..."** = Still connecting...wait a few seconds
- 🔴 **"Disconnected"** = Connection failed ❌

### Step 3: Check Browser Console

Open your browser's developer console (F12) and look for:

✅ **Success messages:**
```
🔌 Setting up real-time subscription for tickets...
📡 Real-time subscription status: SUBSCRIBED
✅ Successfully subscribed to tickets real-time updates!
```

❌ **Error messages:**
```
❌ Failed to subscribe to tickets real-time updates
⏱️ Subscription timed out
```

### Step 4: Test the Connection

1. Open admin dashboard in one browser tab
2. Open another tab and go to `/tickets/new`
3. Create a test ticket
4. Switch back to admin dashboard
5. **Within 1-2 seconds** you should see in console:
   ```
   🎉 Ticket change detected! {eventType: 'INSERT', ...}
   ```

---

## 🔍 Detailed Diagnostics

### Check 1: Verify Realtime is Enabled

Run this in Supabase SQL Editor:

```sql
-- Check if tickets table is in realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('tickets', 'profiles');
```

**Expected result:** Should show 2 rows (tickets and profiles)  
**If empty:** Run the `enable_tickets_realtime.sql` script

### Check 2: Verify Your .env File

Make sure these variables are set correctly in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Check 3: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. You should see a WebSocket connection to Supabase
5. Status should be "101 Switching Protocols" (green)

### Check 4: Verify Supabase Project is Running

- Go to your Supabase dashboard
- Check if project is paused (free tier projects pause after inactivity)
- If paused, click "Restore" to wake it up

---

## 🐛 Common Issues & Solutions

### Issue 1: "CHANNEL_ERROR" in Console

**Cause:** Realtime not enabled for tickets table  
**Solution:** Run `enable_tickets_realtime.sql` in Supabase SQL Editor

### Issue 2: Status Stuck on "Connecting..."

**Cause:** Firewall or network blocking WebSocket connections  
**Solution:** 
- Check if you're behind a corporate firewall
- Try a different network
- Check browser extensions (ad blockers can block WebSockets)

### Issue 3: Connection Works but No Activities Show

**Cause:** Profiles table realtime not enabled  
**Solution:** Run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

### Issue 4: "403 Forbidden" or "401 Unauthorized"

**Cause:** Invalid Supabase credentials or expired session  
**Solution:**
- Check your `.env` file for correct credentials
- Try logging out and back in
- Verify your Supabase anon key is correct

### Issue 5: Works Locally But Not in Production

**Cause:** Environment variables not set in production  
**Solution:**
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting platform
- Rebuild and redeploy your app

---

## 🧪 Testing Checklist

Run through this checklist to verify everything works:

- [ ] Realtime enabled for tickets table in Supabase
- [ ] Realtime enabled for profiles table in Supabase
- [ ] .env file has correct Supabase credentials
- [ ] Admin dashboard shows 🟢 "Live" status
- [ ] Console shows "Successfully subscribed to tickets real-time updates!"
- [ ] Creating a ticket triggers "Ticket change detected!" in console
- [ ] Live Activity feed updates within 1-2 seconds
- [ ] Recent Tickets section refreshes automatically

---

## 📊 What to Check in Browser Console

### Good Signs (Everything Working) ✅

```
🔌 Setting up real-time subscription for tickets...
📡 Real-time subscription status: SUBSCRIBED
✅ Successfully subscribed to tickets real-time updates!
```

Then when you create a ticket:
```
🎉 Ticket change detected! {
  eventType: "INSERT",
  new: { id: 123, title: "Test", ... },
  ...
}
```

### Bad Signs (Something Wrong) ❌

```
❌ Failed to subscribe to tickets real-time updates
```
or
```
⏱️ Subscription timed out
```
or
```
CHANNEL_ERROR
```

---

## 🆘 Still Not Working?

### Last Resort Steps:

1. **Restart Everything:**
   - Stop your development server
   - Clear browser cache (Ctrl+Shift+Delete)
   - Restart dev server: `npm run dev`
   - Hard refresh browser: Ctrl+Shift+R

2. **Verify Supabase Configuration:**
   ```sql
   -- Check if realtime is enabled globally
   SHOW wal_level;  -- Should be 'logical'
   ```

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard
   - Navigate to Logs → Realtime
   - Look for any error messages

4. **Test with Supabase Studio:**
   - Go to Supabase Dashboard
   - Navigate to Table Editor → tickets
   - Insert a new row manually
   - Check if it appears in your app's Live Activity

---

## 💡 Pro Tips

1. **Keep Console Open:** Always have browser console open when testing real-time features
2. **Check Status Indicator:** The 🟢/🟡/🔴 indicator shows connection status at a glance
3. **Timeout is Normal:** It may take 2-3 seconds to establish connection on first load
4. **Multiple Tabs:** Real-time works across multiple browser tabs!

---

## 📝 Helpful SQL Queries

### Check what tables have realtime enabled:
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Enable realtime for a table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table_name;
```

### Disable realtime for a table (if needed):
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE public.your_table_name;
```

---

## 🎯 Expected Behavior When Working

1. Open admin dashboard → See 🟡 "Connecting..."
2. After 1-2 seconds → See 🟢 "Live • 0 activities"
3. Create a ticket → Console shows "Ticket change detected!"
4. Live Activity updates → Shows "User X created ticket #TK-000123"
5. Recent Tickets refreshes → New ticket appears at top

---

**Need more help?** Check the console logs and look for specific error messages. The emoji indicators (🔌📡✅❌) make it easy to track what's happening!
