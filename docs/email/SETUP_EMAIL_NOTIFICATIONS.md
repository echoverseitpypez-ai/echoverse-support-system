# Setup Email Notifications - Complete Guide

## 🎯 Overview

This guide will help you set up email notifications for your ticket support system using your existing Gmail SMTP configuration.

---

## ✅ Step 1: Install Dependencies

Run this command to install the nodemailer package:

```bash
npm install
```

This will install `nodemailer@^6.9.7` which is now added to your `package.json`.

---

## ✅ Step 2: Configure Environment Variables

### Option A: Update `.env.server.local`

Add these lines to your `.env.server.local` file:

```env
# Email Configuration
EMAIL_ENABLED=true

# Gmail SMTP
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true

# Your Gmail Credentials
MAIL_USERNAME=echoverseitpypez@gmail.com
MAIL_PASSWORD=pscuxxaukjwotpcd

# Sender Information
MAIL_FROM_EMAIL=echoverseitpypez@gmail.com
MAIL_FROM_NAME=Echoverse Support

# Admin Emails (comma-separated)
ADMIN_EMAILS=echoverseitpypez@gmail.com,jajamabuhay3@gmail.com

# Notification Settings
NOTIFY_ON_TICKET_CREATED=true
NOTIFY_ON_TICKET_ASSIGNED=true
NOTIFY_ON_TICKET_UPDATED=true
NOTIFY_ON_TICKET_RESOLVED=true
NOTIFY_ON_NEW_COMMENT=true

# App URL (for email links)
APP_URL=http://localhost:3000
```

### Option B: Use the Example File

I've created `.env.email.example` with all the settings. You can copy the values from there.

---

## ✅ Step 3: Test Email Configuration

### Create a Test Script

Create `server/test-email.js`:

```javascript
import { sendTestEmail } from './services/emailService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.server.local' });

console.log('🧪 Testing email configuration...');
console.log('Sending test email to:', process.env.ADMIN_EMAILS?.split(',')[0]);

sendTestEmail(process.env.ADMIN_EMAILS?.split(',')[0] || 'test@example.com')
  .then(result => {
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('\nCheck your inbox at:', process.env.ADMIN_EMAILS?.split(',')[0]);
    } else {
      console.error('❌ Failed to send test email:', result.error || result.message);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

### Run the Test

```bash
node server/test-email.js
```

### Expected Output:

```
✅ Email transporter configured successfully
🧪 Testing email configuration...
Sending test email to: echoverseitpypez@gmail.com
✅ Email sent successfully: <message-id@gmail.com>
✅ Test email sent successfully!
Message ID: <message-id>

Check your inbox at: echoverseitpypez@gmail.com
```

---

## ✅ Step 4: Integrate with Ticket Creation

### Update Your Ticket Creation Route

In your server file where tickets are created, add:

```javascript
import { notifyTicketCreated } from './services/emailService.js';

// After creating a ticket in the database
const { data: ticket, error } = await supabase
  .from('tickets')
  .insert(ticketData)
  .select()
  .single();

if (ticket) {
  // Get creator profile
  const { data: creator } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', ticket.created_by)
    .single();
  
  // Send email notification
  await notifyTicketCreated(ticket, creator);
}
```

---

## 📧 Email Templates Included

### 1. **Ticket Created** 
- Sent to: Creator & Admins
- Includes: Ticket details, priority badge, description
- Has "View Ticket" button

### 2. **Ticket Assigned**
- Sent to: Assignee & Creator
- Includes: Ticket details, assignee info
- Notifies the agent they have a new ticket

### 3. **Ticket Updated**
- Sent to: Creator
- Includes: Old status → New status
- Shows who made the update

### 4. **Ticket Resolved**
- Sent to: Creator
- Includes: Resolution details, who resolved it
- Celebratory 🎉 emoji

---

## 🎨 Email Template Preview

### Ticket Created Email

```
╔════════════════════════════════════════╗
║     🎫 New Support Ticket              ║
║  A new ticket has been created         ║
╚════════════════════════════════════════╝

Ticket ID: #TK-ABC123
Title: Computer Freezing
Priority: HIGH
Status: open
Created By: John Doe (john@example.com)
Created At: Oct 21, 2025 10:30 AM

Description:
My computer keeps freezing when I open multiple 
applications...

          [View Ticket Button]

This is an automated notification from 
Echoverse Support System
```

---

## 🔧 Customization Options

### Change Email Styling

Edit `server/services/emailService.js` and modify the HTML templates in the `emailTemplates` object.

### Add More Templates

```javascript
const emailTemplates = {
  // ... existing templates
  
  ticketComment: (data) => ({
    subject: `💬 New Comment on Ticket: ${data.ticketTitle}`,
    html: `
      <!-- Your custom HTML here -->
    `
  })
};
```

### Disable Specific Notifications

In `.env.server.local`:

```env
NOTIFY_ON_TICKET_CREATED=false  # Disable creation emails
NOTIFY_ON_TICKET_ASSIGNED=true  # Keep assignment emails
```

---

## 🐛 Troubleshooting

### Email Not Sending?

**Check 1: Gmail App Password**
- Make sure you're using an App Password, not your regular password
- Create one at: https://myaccount.google.com/apppasswords

**Check 2: Environment Variables**
```bash
# In server terminal, check if variables are loaded
echo $EMAIL_ENABLED
echo $MAIL_USERNAME
```

**Check 3: Enable Logging**
The email service logs everything to console:
- ✅ = Success
- ❌ = Error
- 📧 = Info

### "Invalid login" Error

This usually means:
1. App Password is incorrect
2. 2-Step Verification not enabled on Gmail
3. Gmail account locked/suspended

**Solution:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate new App Password
4. Update `MAIL_PASSWORD` in `.env.server.local`

### Emails Going to Spam

**Solutions:**
1. Add your domain to SPF record
2. Set up DKIM
3. Use a professional email service (SendGrid, Mailgun)
4. Ask recipients to whitelist your email

---

## 📊 Production Recommendations

### 1. Use Professional Email Service

For production, consider:
- **SendGrid** - Free tier: 100 emails/day
- **Mailgun** - Free tier: 5,000 emails/month  
- **AWS SES** - Very cheap, highly reliable

### 2. Add Email Queue

For high volume, implement a queue:
```bash
npm install bull redis
```

### 3. Track Email Analytics

Add to database:
```sql
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  to_email TEXT,
  subject TEXT,
  template TEXT,
  ticket_id UUID,
  status TEXT, -- sent, delivered, opened, bounced
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Rate Limiting

Add to prevent spam:
```javascript
// Max 10 emails per minute per user
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
```

---

## ✅ Verification Checklist

- [ ] `nodemailer` installed (`npm install`)
- [ ] `.env.server.local` updated with email config
- [ ] Test email script runs successfully
- [ ] Received test email in inbox
- [ ] Email templates look good (check HTML rendering)
- [ ] Ticket creation triggers email
- [ ] Admin receives email notifications
- [ ] Creator receives confirmation email
- [ ] Email links work (point to correct URL)

---

## 🚀 Next Steps

Once email is working:

1. **Add to Real-Time System**
   - Integrate with Supabase triggers
   - Send emails on ticket INSERT/UPDATE events

2. **Add Email Preferences**
   - Let users choose which emails they want
   - Add unsubscribe links

3. **Create Email Dashboard**
   - Show email stats in admin panel
   - Track delivery rates

4. **Add More Templates**
   - Comment notifications
   - Daily digest emails
   - Weekly reports

---

## 📝 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Test email configuration
node server/test-email.js

# 3. Start server with email enabled
npm run dev

# 4. Create a test ticket and check email
```

---

## 🎯 Current Status

- ✅ Email service created (`server/services/emailService.js`)
- ✅ 4 email templates ready (Created, Assigned, Updated, Resolved)
- ✅ Gmail SMTP configured with your credentials
- ✅ `nodemailer` added to `package.json`
- ✅ Environment variables documented
- ⏳ Waiting for: `npm install` + Test email

**Ready to send emails!** 🚀

---

**Support:** If you have issues, check the console logs - they show detailed error messages with 📧❌✅ emojis for easy identification.
