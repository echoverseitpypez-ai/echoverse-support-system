import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../supabase.js';

dotenv.config({ path: 'config/.env.server.local' });

// Email transporter configuration
let transporter = null;
let cachedSettings = null;

// Get email settings from database
async function getEmailSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .or('key.eq.email_enabled,key.eq.admin_emails,key.eq.notify_on_ticket_created,key.eq.notify_on_ticket_assigned,key.eq.notify_on_ticket_updated,key.eq.notify_on_ticket_resolved,key.eq.mail_from_name')
    
    if (error) throw error
    
    const settings = {
      email_enabled: process.env.EMAIL_ENABLED === 'true',
      admin_emails: process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [],
      notify_on_ticket_created: process.env.NOTIFY_ON_TICKET_CREATED === 'true',
      notify_on_ticket_assigned: process.env.NOTIFY_ON_TICKET_ASSIGNED === 'true',
      notify_on_ticket_updated: process.env.NOTIFY_ON_TICKET_UPDATED === 'true',
      notify_on_ticket_resolved: process.env.NOTIFY_ON_TICKET_RESOLVED === 'true',
      mail_from_name: process.env.MAIL_FROM_NAME || 'Echoverse Support'
    }
    
    // Override with database settings
    data?.forEach(row => {
      if (row.key === 'email_enabled') {
        settings.email_enabled = row.value === 'true'
      } else if (row.key === 'admin_emails') {
        try {
          settings.admin_emails = JSON.parse(row.value)
        } catch {
          settings.admin_emails = row.value ? row.value.split(',').map(e => e.trim()) : []
        }
      } else if (row.key.startsWith('notify_on_')) {
        settings[row.key] = row.value === 'true'
      } else {
        settings[row.key] = row.value
      }
    })
    
    cachedSettings = settings
    return settings
  } catch (error) {
    console.error('Error fetching email settings:', error)
    // Fallback to environment variables
    return {
      email_enabled: process.env.EMAIL_ENABLED === 'true',
      admin_emails: process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [],
      notify_on_ticket_created: process.env.NOTIFY_ON_TICKET_CREATED === 'true',
      notify_on_ticket_assigned: process.env.NOTIFY_ON_TICKET_ASSIGNED === 'true',
      notify_on_ticket_updated: process.env.NOTIFY_ON_TICKET_UPDATED === 'true',
      notify_on_ticket_resolved: process.env.NOTIFY_ON_TICKET_RESOLVED === 'true',
      mail_from_name: process.env.MAIL_FROM_NAME || 'Echoverse Support'
    }
  }
}

function createTransporter() {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email notifications are disabled');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_SERVER || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: false, // use TLS
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });

    console.log('✅ Email transporter configured successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to configure email transporter:', error);
    return null;
  }
}

// Initialize transporter
transporter = createTransporter();

// Email Templates
const emailTemplates = {
  ticketCreated: (data) => ({
    subject: `🎫 New Ticket Created: ${data.ticketTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5; }
          .label { font-weight: bold; color: #4f46e5; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .priority-high { color: #ef4444; font-weight: bold; }
          .priority-urgent { color: #dc2626; font-weight: bold; }
          .priority-normal { color: #f59e0b; font-weight: bold; }
          .priority-low { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Support Ticket</h1>
            <p>A new ticket has been created in the system</p>
          </div>
          <div class="content">
            <div class="ticket-info">
              <p><span class="label">Ticket ID:</span> ${data.ticketId}</p>
              <p><span class="label">Title:</span> ${data.ticketTitle}</p>
              <p><span class="label">Priority:</span> <span class="priority-${data.ticketPriority}">${data.ticketPriority.toUpperCase()}</span></p>
              <p><span class="label">Status:</span> ${data.ticketStatus}</p>
              <p><span class="label">Created By:</span> ${data.creatorName} (${data.creatorEmail})</p>
              <p><span class="label">Created At:</span> ${data.createdAt}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p><span class="label">Description:</span></p>
              <p>${data.ticketDescription}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from Echoverse Support System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  ticketAssigned: (data) => ({
    subject: `👤 Ticket Assigned: ${data.ticketTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .label { font-weight: bold; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 Ticket Assigned</h1>
            <p>A ticket has been assigned to you</p>
          </div>
          <div class="content">
            <p>Hi ${data.assigneeName},</p>
            <p>The following ticket has been assigned to you:</p>
            
            <div class="ticket-info">
              <p><span class="label">Ticket ID:</span> ${data.ticketId}</p>
              <p><span class="label">Title:</span> ${data.ticketTitle}</p>
              <p><span class="label">Priority:</span> ${data.ticketPriority.toUpperCase()}</p>
              <p><span class="label">Created By:</span> ${data.creatorName}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket</a>
            </div>
          </div>
          <div class="footer">
            <p>Echoverse Support System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  ticketUpdated: (data) => ({
    subject: `🔄 Ticket Updated: ${data.ticketTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .label { font-weight: bold; color: #f59e0b; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Ticket Updated</h1>
            <p>Status: ${data.oldStatus} → ${data.newStatus}</p>
          </div>
          <div class="content">
            <div class="ticket-info">
              <p><span class="label">Ticket ID:</span> ${data.ticketId}</p>
              <p><span class="label">Title:</span> ${data.ticketTitle}</p>
              <p><span class="label">Old Status:</span> ${data.oldStatus}</p>
              <p><span class="label">New Status:</span> ${data.newStatus}</p>
              <p><span class="label">Updated By:</span> ${data.updatedBy}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket</a>
            </div>
          </div>
          <div class="footer">
            <p>Echoverse Support System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  ticketResolved: (data) => ({
    subject: `✅ Ticket Resolved: ${data.ticketTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .label { font-weight: bold; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Ticket Resolved</h1>
            <div class="success-icon">🎉</div>
          </div>
          <div class="content">
            <p>Great news! Your ticket has been resolved.</p>
            
            <div class="ticket-info">
              <p><span class="label">Ticket ID:</span> ${data.ticketId}</p>
              <p><span class="label">Title:</span> ${data.ticketTitle}</p>
              <p><span class="label">Resolved By:</span> ${data.resolvedBy}</p>
              <p><span class="label">Resolved At:</span> ${data.resolvedAt}</p>
            </div>
            
            ${data.resolution ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><span class="label">Resolution:</span></p>
              <p>${data.resolution}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${data.ticketUrl}" class="button">View Ticket</a>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for using Echoverse Support System</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
export async function sendEmail({ to, template, data }) {
  if (!transporter) {
    console.log('📧 Email service not configured, skipping email');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const settings = await getEmailSettings();
    const emailContent = emailTemplates[template](data);
    
    const info = await transporter.sendMail({
      from: `"${settings.mail_from_name || 'Echoverse Support'}" <${process.env.MAIL_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

// Notification functions
export async function notifyTicketCreated(ticket, creator) {
  const settings = await getEmailSettings();
  if (!settings.email_enabled || !settings.notify_on_ticket_created) return;

  const data = {
    ticketId: `#TK-${ticket.id.slice(-6).toUpperCase()}`,
    ticketTitle: ticket.title,
    ticketDescription: ticket.description || 'No description provided',
    ticketPriority: ticket.priority,
    ticketStatus: ticket.status,
    creatorName: creator.full_name || creator.email,
    creatorEmail: creator.email,
    createdAt: new Date(ticket.created_at).toLocaleString(),
    ticketUrl: `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  };

  // Send to admins
  if (settings.admin_emails && settings.admin_emails.length > 0) {
    await sendEmail({
      to: settings.admin_emails,
      template: 'ticketCreated',
      data
    });
  }

  // Send to creator
  if (creator.email) {
    await sendEmail({
      to: creator.email,
      template: 'ticketCreated',
      data
    });
  }
}

export async function notifyTicketAssigned(ticket, assignee, creator) {
  const settings = await getEmailSettings();
  if (!settings.email_enabled || !settings.notify_on_ticket_assigned) return;

  const data = {
    ticketId: `#TK-${ticket.id.slice(-6).toUpperCase()}`,
    ticketTitle: ticket.title,
    ticketPriority: ticket.priority,
    assigneeName: assignee.full_name || assignee.email,
    creatorName: creator.full_name || creator.email,
    ticketUrl: `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  };

  // Send to assignee
  if (assignee.email) {
    await sendEmail({
      to: assignee.email,
      template: 'ticketAssigned',
      data
    });
  }

  // Send to creator
  if (creator.email && creator.email !== assignee.email) {
    await sendEmail({
      to: creator.email,
      template: 'ticketAssigned',
      data
    });
  }
}

export async function notifyTicketUpdated(ticket, oldStatus, updatedBy, creator) {
  const settings = await getEmailSettings();
  if (!settings.email_enabled || !settings.notify_on_ticket_updated) return;

  const data = {
    ticketId: `#TK-${ticket.id.slice(-6).toUpperCase()}`,
    ticketTitle: ticket.title,
    oldStatus: oldStatus,
    newStatus: ticket.status,
    updatedBy: updatedBy.full_name || updatedBy.email,
    ticketUrl: `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  };

  // Send to creator
  if (creator.email) {
    await sendEmail({
      to: creator.email,
      template: 'ticketUpdated',
      data
    });
  }
}

export async function notifyTicketResolved(ticket, resolvedBy, creator, resolution) {
  const settings = await getEmailSettings();
  if (!settings.email_enabled || !settings.notify_on_ticket_resolved) return;

  const data = {
    ticketId: `#TK-${ticket.id.slice(-6).toUpperCase()}`,
    ticketTitle: ticket.title,
    resolvedBy: resolvedBy.full_name || resolvedBy.email,
    resolvedAt: new Date().toLocaleString(),
    resolution: resolution || '',
    ticketUrl: `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  };

  // Send to creator
  if (creator.email) {
    await sendEmail({
      to: creator.email,
      template: 'ticketResolved',
      data
    });
  }
}

// Test email function
export async function sendTestEmail(toEmail) {
  return await sendEmail({
    to: toEmail,
    template: 'ticketCreated',
    data: {
      ticketId: '#TK-TEST01',
      ticketTitle: 'Test Ticket - Email Configuration',
      ticketDescription: 'This is a test email to verify your email configuration is working correctly.',
      ticketPriority: 'normal',
      ticketStatus: 'open',
      creatorName: 'Test User',
      creatorEmail: 'test@example.com',
      createdAt: new Date().toLocaleString(),
      ticketUrl: 'http://localhost:3000/tickets/test'
    }
  });
}
