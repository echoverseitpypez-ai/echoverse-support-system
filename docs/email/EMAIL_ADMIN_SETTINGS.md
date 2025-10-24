# Email Settings - Admin Dashboard Feature

## ✅ What's New

You can now manage email notifications directly from the **Admin Dashboard** without editing environment files!

### Features Added:

1. **Master Email Toggle** - Enable/disable all email notifications with one click
2. **Admin Email Management** - Add/remove admin email addresses through the UI
3. **Notification Controls** - Toggle specific notification types:
   - Ticket Created
   - Ticket Assigned  
   - Ticket Updated
   - Ticket Resolved
4. **Sender Name Configuration** - Customize the "From" name in emails
5. **Test Email Function** - Send test emails to verify configuration

---

## 🚀 How to Use

### Step 1: Access Email Settings

1. Log in as an **Admin**
2. Navigate to **Settings** from the sidebar
3. Scroll to the **Email Notification Settings** section

### Step 2: Configure SMTP (First Time Only)

Before using email notifications, configure SMTP in your `.env.server.local`:

```env
# Email Configuration
EMAIL_ENABLED=true

# Gmail SMTP Settings
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Sender Email
MAIL_FROM_EMAIL=your-email@gmail.com
```

**Note:** Use Gmail App Passwords instead of your regular password.  
Generate one at: https://myaccount.google.com/apppasswords

### Step 3: Enable Email Notifications

1. In the Settings page, check the **Email Notifications Enabled** toggle
2. Click **Save Settings**

### Step 4: Add Admin Emails

1. Enter an email address in the input field
2. Click **Add Email**
3. Repeat for each admin who should receive notifications
4. Click **Save Settings**

### Step 5: Configure Notification Types

1. Check/uncheck the notification types you want:
   - ✅ **Ticket Created** - Admins receive alerts for new tickets
   - ✅ **Ticket Assigned** - Assignees are notified
   - ✅ **Ticket Updated** - Creators get status change updates
   - ✅ **Ticket Resolved** - Creators receive resolution confirmation
2. Click **Save Settings**

### Step 6: Test Your Configuration

1. Enter a test email address
2. Click **Send Test Email**
3. Check the inbox for the test notification

---

## 📁 Files Changed/Added

### Backend:
- **`server/routes/settings.js`** - Added 3 new routes:
  - `GET /api/settings/email` - Fetch email settings
  - `PUT /api/settings/email` - Update email settings
  - `POST /api/settings/email/test` - Send test email

- **`server/services/emailService.js`** - Updated to read from database instead of only environment variables

### Frontend:
- **`src/components/EmailSettings.jsx`** - New component for email settings management
- **`src/pages/Settings.jsx`** - Integrated EmailSettings component

### Database:
- **`db/email_settings_defaults.sql`** - Migration to initialize default settings

---

## 🔧 Technical Details

### How Settings Are Stored

Email settings are stored in the `settings` table:

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

Example data:
```
| key                         | value                                    |
|-----------------------------|------------------------------------------|
| email_enabled               | "true"                                   |
| admin_emails                | ["admin1@example.com","admin2@..."]      |
| notify_on_ticket_created    | "true"                                   |
| notify_on_ticket_assigned   | "true"                                   |
| notify_on_ticket_updated    | "false"                                  |
| notify_on_ticket_resolved   | "true"                                   |
| mail_from_name              | "Echoverse Support"                      |
```

### Settings Priority

The system uses this priority order:

1. **Database Settings** (highest priority) - Set through UI
2. **Environment Variables** (fallback) - Set in `.env.server.local`
3. **Default Values** (last resort) - Hardcoded defaults

This means:
- UI settings override environment variables
- If no database settings exist, environment variables are used
- If neither exists, safe defaults are used

### API Endpoints

#### GET `/api/settings/email`
Fetches current email settings (Admin only)

**Response:**
```json
{
  "email_enabled": true,
  "admin_emails": ["admin@example.com"],
  "notify_on_ticket_created": true,
  "notify_on_ticket_assigned": true,
  "notify_on_ticket_updated": true,
  "notify_on_ticket_resolved": true,
  "mail_from_name": "Echoverse Support"
}
```

#### PUT `/api/settings/email`
Updates email settings (Admin only)

**Request Body:**
```json
{
  "email_enabled": true,
  "admin_emails": ["admin@example.com", "admin2@example.com"],
  "notify_on_ticket_created": true,
  "notify_on_ticket_assigned": true,
  "notify_on_ticket_updated": false,
  "notify_on_ticket_resolved": true,
  "mail_from_name": "Support Team"
}
```

#### POST `/api/settings/email/test`
Sends a test email (Admin only)

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

---

## 🐛 Troubleshooting

### "Email service not configured"

**Cause:** SMTP credentials not set in `.env.server.local`

**Solution:**
1. Add SMTP configuration to `.env.server.local`
2. Restart the backend server

### Test email not received

**Check:**
1. ✅ SMTP credentials are correct
2. ✅ `EMAIL_ENABLED=true` in environment
3. ✅ Email isn't in spam folder
4. ✅ Gmail App Password is used (not regular password)

### Settings not saving

**Check:**
1. ✅ You're logged in as admin
2. ✅ Database connection is working
3. ✅ Check browser console for errors
4. ✅ Backend logs for errors

### Notifications not sending

**Check:**
1. ✅ Email notifications are **enabled** in UI
2. ✅ Specific notification type is checked
3. ✅ Admin emails are added
4. ✅ Backend server is running
5. ✅ Check backend logs for email sending errors

---

## 🎨 UI Features

### Visual Indicators

- **Green border** = Email enabled
- **Red border** = Email disabled
- **Yellow warning** = No admin emails configured
- **Blue box** = Test email section

### Accessibility

- Checkbox labels are clickable
- Keyboard navigation supported
- Clear success/error messages
- Disabled states when email is off

---

## 🔒 Security

- **Admin-only access** - Only admins can view/modify email settings
- **Database RLS policies** - Settings table has Row Level Security
- **SMTP credentials** - Never exposed to frontend (stays in `.env.server.local`)
- **Input validation** - Email format validation before adding

---

## 📊 Default Behavior

If no settings are configured in database or environment:

```javascript
{
  email_enabled: false,          // Disabled by default
  admin_emails: [],              // No emails
  notify_on_ticket_created: true,    // All notification types
  notify_on_ticket_assigned: true,   // enabled by default
  notify_on_ticket_updated: true,    // when email is turned on
  notify_on_ticket_resolved: true,
  mail_from_name: 'Echoverse Support'
}
```

---

## 🚀 Quick Setup Checklist

- [ ] Configure SMTP in `.env.server.local`
- [ ] Run database migration: `db/email_settings_defaults.sql`
- [ ] Restart backend server
- [ ] Log in as admin
- [ ] Go to Settings page
- [ ] Enable email notifications
- [ ] Add admin email addresses
- [ ] Configure notification types
- [ ] Save settings
- [ ] Send test email to verify
- [ ] Create a test ticket to verify notifications

---

## 💡 Tips

1. **Start with test email** - Always send a test email before enabling notifications
2. **Add multiple admins** - Distribute notification load across team
3. **Selective notifications** - Disable noisy notifications (like "Updated") if too many
4. **Check spam folders** - Gmail may initially mark automated emails as spam
5. **Use App Passwords** - Never use your actual Gmail password

---

## 🔮 Future Enhancements

Planned features:
- Email templates customization through UI
- Individual user notification preferences
- Email scheduling (digest mode)
- Webhook integration
- SMS notifications
- Slack/Discord integration

---

## 📞 Support

If you encounter issues:
1. Check backend console logs
2. Verify SMTP credentials
3. Test with Gmail first (easiest to configure)
4. Check database settings table manually

**Common Error Messages:**
- "Authentication failed" → Wrong App Password
- "Connection timeout" → Wrong SMTP host/port
- "Settings saved successfully" → Everything working! ✅
