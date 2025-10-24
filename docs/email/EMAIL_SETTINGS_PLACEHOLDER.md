# Email Settings - Placeholder Implementation

## ✅ What Was Added

I've added a **Email Settings** section in the Admin Dashboard's Management view that shows a placeholder UI for future email notification features.

---

## 📍 Location

**Path:** Admin Dashboard → Management Tab → Scroll down to "Email Settings"

**File:** `src/pages/EnhancedAdminDashboard.jsx` (lines 2011-2084)

---

## 🎨 UI Components

### 1. **Header with "Coming Soon" Badge**
- Title: 📧 Email Settings
- Orange badge indicating future feature
- Subtitle: "Configure SMTP & templates in a future step"

### 2. **Main Content Area**
- Large mailbox icon (📬)
- Title: "Email Notifications"
- Description explaining the feature
- Three disabled placeholder buttons:
  - 🔧 Configure SMTP
  - 📝 Email Templates
  - 📊 Email Logs

### 3. **Info Banner**
- Blue info box with lightbulb icon
- Explains what will be included in future update:
  - Automated ticket notifications
  - Custom templates
  - SMTP configuration

---

## 🔮 Future Implementation Plan

### **Phase 1: SMTP Configuration**

#### Database Schema
```sql
CREATE TABLE email_settings (
  id SERIAL PRIMARY KEY,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL, -- Encrypted
  smtp_from_email TEXT NOT NULL,
  smtp_from_name TEXT NOT NULL,
  smtp_use_tls BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Features to Add
1. ✅ SMTP server configuration form
2. ✅ Test email functionality
3. ✅ Encrypted password storage
4. ✅ Connection validation

---

### **Phase 2: Email Templates**

#### Database Schema
```sql
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML content
  template_type TEXT NOT NULL, -- ticket_created, ticket_assigned, etc.
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Template Types
- `ticket_created` - New ticket notification
- `ticket_assigned` - Ticket assignment notification
- `ticket_updated` - Status change notification
- `ticket_resolved` - Resolution notification
- `ticket_comment` - New comment notification

#### Template Variables
```javascript
{
  ticketId: "#TK-123456",
  ticketTitle: "Issue Title",
  ticketDescription: "Issue description...",
  ticketPriority: "high",
  ticketStatus: "open",
  creatorName: "John Doe",
  creatorEmail: "john@example.com",
  assigneeName: "Agent Smith",
  assigneeEmail: "agent@example.com",
  ticketUrl: "https://support.example.com/tickets/123",
  createdAt: "2025-10-21 10:00:00"
}
```

---

### **Phase 3: Email Notifications System**

#### Auto-Send Rules
```javascript
const emailTriggers = {
  onTicketCreated: {
    sendTo: ['creator', 'admins'],
    template: 'ticket_created'
  },
  onTicketAssigned: {
    sendTo: ['assignee', 'creator'],
    template: 'ticket_assigned'
  },
  onTicketUpdated: {
    sendTo: ['creator', 'assignee'],
    template: 'ticket_updated'
  },
  onTicketResolved: {
    sendTo: ['creator'],
    template: 'ticket_resolved'
  },
  onNewComment: {
    sendTo: ['creator', 'assignee'],
    template: 'ticket_comment'
  }
}
```

#### Email Queue System
```sql
CREATE TABLE email_queue (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id INTEGER REFERENCES email_templates(id),
  ticket_id UUID REFERENCES tickets(id),
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

---

### **Phase 4: Email Logs & Analytics**

#### Track Email Activity
```sql
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id INTEGER REFERENCES email_templates(id),
  ticket_id UUID REFERENCES tickets(id),
  status TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);
```

#### Analytics Dashboard
- Total emails sent
- Delivery rate
- Open rate
- Click rate
- Bounce rate
- Failed emails

---

## 🛠️ Implementation Steps (When Ready)

### Step 1: Install Dependencies
```bash
npm install nodemailer
```

### Step 2: Create Email Service
```javascript
// server/services/emailService.js
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html, templateId, ticketId }) {
  // Get SMTP settings from database
  const settings = await getEmailSettings();
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_use_tls,
    auth: {
      user: settings.smtp_user,
      pass: decryptPassword(settings.smtp_password)
    }
  });
  
  // Send email
  const info = await transporter.sendMail({
    from: `"${settings.smtp_from_name}" <${settings.smtp_from_email}>`,
    to,
    subject,
    html
  });
  
  // Log to database
  await logEmail({ to, subject, templateId, ticketId, status: 'sent' });
  
  return info;
}
```

### Step 3: Create API Endpoints
```javascript
// server/routes/email.js
app.post('/api/email/settings', async (req, res) => {
  // Save SMTP settings
});

app.get('/api/email/settings', async (req, res) => {
  // Get SMTP settings
});

app.post('/api/email/test', async (req, res) => {
  // Send test email
});

app.get('/api/email/templates', async (req, res) => {
  // Get all templates
});

app.post('/api/email/templates', async (req, res) => {
  // Create/update template
});

app.get('/api/email/logs', async (req, res) => {
  // Get email logs
});
```

### Step 4: Integrate with Ticket Events
```javascript
// When ticket is created
await sendEmail({
  to: ticket.creator.email,
  subject: `Ticket Created: ${ticket.title}`,
  templateId: 'ticket_created',
  ticketId: ticket.id,
  html: renderTemplate('ticket_created', ticket)
});
```

### Step 5: Build UI Components
```jsx
// Configure SMTP Modal
<SMTPConfigModal 
  isOpen={showSMTPModal}
  onClose={() => setShowSMTPModal(false)}
  onSave={handleSaveSMTP}
/>

// Email Templates Editor
<EmailTemplateEditor
  templates={emailTemplates}
  onSave={handleSaveTemplate}
/>

// Email Logs Viewer
<EmailLogsTable
  logs={emailLogs}
  onRefresh={loadEmailLogs}
/>
```

---

## 📧 Example Email Template

### Ticket Created Notification
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #4f46e5; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ticket Created</h1>
  </div>
  <div class="content">
    <p>Hello {{creatorName}},</p>
    <p>Your support ticket has been created successfully.</p>
    
    <h3>Ticket Details:</h3>
    <ul>
      <li><strong>ID:</strong> {{ticketId}}</li>
      <li><strong>Title:</strong> {{ticketTitle}}</li>
      <li><strong>Priority:</strong> {{ticketPriority}}</li>
      <li><strong>Status:</strong> {{ticketStatus}}</li>
    </ul>
    
    <p>{{ticketDescription}}</p>
    
    <p>
      <a href="{{ticketUrl}}" class="button">View Ticket</a>
    </p>
    
    <p>Best regards,<br>Support Team</p>
  </div>
</body>
</html>
```

---

## 🎯 Current Status

**Status:** ✅ UI Placeholder Added  
**Date:** October 21, 2025  
**Next Steps:** Implement actual SMTP configuration and email sending functionality

### What's Available Now:
- ✅ Placeholder UI in Management section
- ✅ "Coming Soon" badge
- ✅ Disabled buttons showing future features
- ✅ Info banner explaining upcoming functionality

### What's Coming Next:
- ⏳ SMTP configuration form
- ⏳ Email template editor
- ⏳ Email sending service
- ⏳ Email logs and analytics

---

## 💡 Notes

- Email settings will be per-system (not per-user)
- Passwords should be encrypted before storage
- Test email feature is crucial before going live
- Consider using email services like SendGrid, Mailgun, or AWS SES for better deliverability
- Implement rate limiting to prevent spam
- Add unsubscribe functionality for compliance

---

**This is a placeholder implementation to show the UI design. Actual email functionality will be implemented in a future update.**
