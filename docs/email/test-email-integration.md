# Email Integration Test Checklist

## Before Testing

- [ ] Run `db/fix_profiles_email.sql` in Supabase
- [ ] Run `db/email_settings_defaults.sql` in Supabase
- [ ] Verify `.env.server.local` has all SMTP settings
- [ ] Restart backend server (`npm run dev:server`)

## Database Check

Run this in Supabase SQL Editor to verify:

```sql
-- 1. Check if profiles have email
SELECT id, full_name, email, role FROM public.profiles LIMIT 5;

-- 2. Check email settings exist
SELECT * FROM public.settings WHERE key LIKE '%email%' OR key LIKE '%notify%';

-- 3. Expected output from settings:
-- email_enabled: 'true' or 'false'
-- admin_emails: '["admin@example.com"]'
-- notify_on_ticket_created: 'true'
-- etc.
```

## Admin UI Check

1. **Go to Settings Page**
   - [ ] Email settings section visible
   - [ ] Can toggle "Enable Email Notifications"
   - [ ] Can add/remove admin emails
   - [ ] Can toggle notification types

2. **Save Settings**
   - [ ] Click "Save Settings"
   - [ ] See success message: "✅ Settings saved successfully!"

3. **Send Test Email**
   - [ ] Enter your email in test field
   - [ ] Click "Send Test Email"
   - [ ] Should see: "✅ Test email sent successfully!"
   - [ ] Check inbox (also spam folder)

## Backend Console Check

When backend starts, you should see:
```
✅ Email transporter configured successfully
```

Or if disabled:
```
📧 Email notifications are disabled
```

## Create Test Ticket

1. **Create a ticket**
   - [ ] Submit a new ticket through the UI
   
2. **Check backend console** for:
   ```
   ✅ Email notification sent for ticket: TK-XXXXXX
   ✅ Email sent successfully: <message-id>
   ```

3. **Check email inbox**
   - [ ] Admin receives "New Ticket Created" email
   - [ ] Creator receives confirmation email
   - [ ] Email has ticket details
   - [ ] "View Ticket" button works

## Common Issues

### "Email service not configured"
**Cause:** SMTP not set up in `.env.server.local`  
**Fix:** Add all MAIL_* variables and restart server

### "Failed to send email: Invalid login"
**Cause:** Wrong Gmail password or not using App Password  
**Fix:** Use App Password from https://myaccount.google.com/apppasswords

### No email received but no errors
**Cause:** Email notifications disabled in database  
**Fix:** Enable in Settings UI or run `email_settings_defaults.sql`

### "Cannot read property 'email' of null"
**Cause:** Profiles table doesn't have email column  
**Fix:** Run `fix_profiles_email.sql`

### Emails in spam folder
**Fix:** 
- Ask recipient to whitelist sender
- Add sender to contacts
- Use professional email service (SendGrid, etc.) in production

## Troubleshooting Commands

### Check if email is in profiles:
```sql
SELECT COUNT(*) FROM public.profiles WHERE email IS NOT NULL;
-- Should match total users
```

### Check email settings:
```sql
SELECT * FROM public.settings WHERE key = 'email_enabled';
-- Should return 'true' if enabled
```

### Manually enable email:
```sql
UPDATE public.settings SET value = 'true' WHERE key = 'email_enabled';
```

### Check backend logs:
Look for these emoji indicators:
- ✅ = Success
- ❌ = Error
- 📧 = Info about email

## Success Criteria

All checked = Emails working! 🎉

- [ ] Test email received
- [ ] Ticket creation email received by admin
- [ ] Ticket creation email received by creator
- [ ] No errors in backend console
- [ ] Settings save successfully in UI
