# Enable Supabase Realtime

## ✅ Quick Check

**Refresh the page and check console:**

You should see:
```
Setting up real-time subscription...
Subscription status: SUBSCRIBED
```

If you see `SUBSCRIBED` ✅ - Realtime is working!

---

## 🔧 Enable Realtime in Supabase

### Step 1: Go to Database Settings

1. Open your **Supabase Dashboard**
2. Click **Database** (left sidebar)
3. Click **Replication** tab

### Step 2: Enable Realtime for Table

1. Find `team_messages` in the list
2. Toggle the switch to **ON** (green)
3. Save changes

---

## 🎯 How It Works Now

### Optimistic Updates
- ✅ Your messages appear **instantly** (no waiting)
- ✅ Input clears immediately
- ✅ Smooth user experience

### Real-Time Sync
- ✅ Others' messages appear automatically
- ✅ No refresh needed
- ✅ Live updates

---

## 🧪 Test It

### Test 1: Send Message
1. Type message
2. Press Send
3. Message appears **instantly** ✅

### Test 2: Real-Time (Two Users)
1. Open in two browsers (or incognito)
2. Login as different users
3. Send message from User 1
4. User 2 sees it **automatically** ✅

---

## 📊 Console Logs

**When sending:**
```
Sending message: {user_id: "...", message: "hello"}
Message sent successfully: {...}
```

**When receiving (real-time):**
```
✅ New message received via real-time: {...}
Adding message to state: {...}
```

**Subscription:**
```
Setting up real-time subscription...
Subscription status: SUBSCRIBED
```

---

## ✅ Done!

Your chat now updates in real-time without refresh!
