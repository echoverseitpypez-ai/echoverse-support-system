# Test: Automatic Logout on Server Restart

## 🎯 What This Tests

Verifies that users are **automatically logged out** when the server restarts, **even without refreshing the page**.

---

## 🧪 Test Steps

### Test 1: Automatic Logout (WITHOUT Refresh)

1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Login to the app**
   - Open browser: `http://localhost:3000`
   - Login as any user (admin, teacher, etc.)
   - Navigate around (tickets, dashboard, etc.)

3. **Keep the browser tab open** (DO NOT REFRESH)

4. **Watch the browser console**
   - Open DevTools (F12)
   - Go to Console tab
   - You should see:
   ```
   🔄 Started periodic server session validation (every 10 seconds)
   ```

5. **Restart the server**
   - Go to your terminal
   - Press `Ctrl+C` to stop
   - Run `npm run dev` again
   - Server will show new session:
   ```
   🔐 Server session initialized: session-1729XXXXXX-XXXXX
   ```

6. **Wait up to 10 seconds** (don't do anything in the browser)

7. **Observe automatic logout**
   - Browser console will show:
   ```
   🔄 Server restart detected. Logging out...
   Stored: session-1729XXXXXX-AAAAA
   Current: session-1729XXXXXX-BBBBB
   ⏹️ Stopped periodic session validation
   ```
   - Alert popup: "Server has been restarted. You will be logged out for security."
   - Automatically redirected to `/login`

---

## ✅ Expected Results

| Action | Expected Result | Status |
|--------|----------------|--------|
| Login successful | User sees dashboard | ✅ |
| Console shows periodic check | "Started periodic server session validation" | ✅ |
| Server restarts | New session ID generated | ✅ |
| Wait 10 seconds | Session mismatch detected | ✅ |
| Auto logout | Alert shown + redirect to login | ✅ |
| User is logged out | Cannot access protected pages | ✅ |

---

## 🔍 Detailed Behavior

### Timing:
- **Check interval**: Every 10 seconds
- **Detection time**: 0-10 seconds after restart
- **Logout time**: Immediate after detection

### What Happens Behind the Scenes:

```
Second 0:  User logged in, periodic check running
Second 10: Check 1 - Server OK, session matches
Second 20: Check 2 - Server OK, session matches
Second 25: 🔴 SERVER RESTARTS
Second 30: Check 3 - Server unreachable (still starting)
          → Logs warning, continues checking
Second 40: Check 4 - Server back online
          → Session ID mismatch detected!
          → 🔴 AUTO LOGOUT
          → Alert + Redirect to login
```

---

## 🐛 Troubleshooting

### Issue: Not logging out after restart
**Check:**
- Open browser console - do you see "Started periodic server session validation"?
- Is the server actually restarting with a new session ID?
- Check for JavaScript errors in console

**Fix:**
- Ensure `startPeriodicValidation()` is being called
- Check that `/api/server-session` endpoint is working

### Issue: Logs out too quickly
**Adjust interval:**
In `src/utils/sessionValidator.js`:
```javascript
}, 30000) // Change from 10000 to 30000 (30 seconds)
```

### Issue: Alert is annoying
**Remove alert:**
In `src/utils/sessionValidator.js`, comment out:
```javascript
// alert('Server has been restarted. You will be logged out for security.')
```

---

## 📊 Console Messages Reference

### Normal Operation:
```
🔐 Server session stored: session-1729512345-abc123
🔄 Started periodic server session validation (every 10 seconds)
```

### Server Unreachable (temporary):
```
⚠️ Server unreachable during background check. Will retry...
```

### Server Restart Detected:
```
🔄 Server restart detected. Logging out...
Stored: session-1729512345-abc123
Current: session-1729567890-xyz789
⏹️ Stopped periodic session validation
```

### Manual Logout:
```
⏹️ Stopped periodic session validation
```

---

## 🎛️ Configuration

### Change Check Interval:
Edit `src/utils/sessionValidator.js`:
```javascript
export function startPeriodicValidation() {
  // Change 10000 to your desired milliseconds
  validationInterval = setInterval(async () => {
    // ...
  }, 10000) // 10 seconds (10000ms)
}
```

**Recommended intervals:**
- **10 seconds** (default) - Fast detection, more API calls
- **30 seconds** - Balanced
- **60 seconds** - Slower detection, fewer API calls

---

## 🔒 Security Benefits

✅ **No stale sessions** after server updates
✅ **Immediate logout** on server restart
✅ **No user action required**
✅ **Works even with tab in background**
✅ **Prevents unauthorized access** after maintenance

---

## 💡 Additional Tests

### Test 2: Multiple Users
1. Login User A on Browser 1
2. Login User B on Browser 2
3. Restart server
4. Both users auto logout within 10 seconds ✅

### Test 3: Background Tab
1. Login and keep tab in background
2. Restart server
3. Tab still detects and logs out ✅

### Test 4: Network Error
1. Login
2. Disconnect internet
3. Should see warnings but NOT logout
4. Reconnect internet
5. Continues checking normally ✅

---

## 🎯 Success Criteria

- ✅ Users automatically logged out on server restart
- ✅ No page refresh needed
- ✅ Detection within 10 seconds
- ✅ Clear user feedback (alert)
- ✅ Network errors don't cause false logouts
- ✅ Works for all user roles
- ✅ Works in background tabs

---

## 📝 Notes

- The periodic check only runs when user is logged in
- Check stops automatically on logout
- If server is down, it waits patiently and retries
- Session ID is stored in localStorage
- Works across browser tabs (all tabs get logged out)

---

**Status:** ✅ Feature Working
**Last Updated:** Oct 21, 2025
