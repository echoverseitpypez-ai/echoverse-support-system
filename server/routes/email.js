import { Router } from 'express';
import { sendTestEmail } from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'config/.env.server.local' });

const router = Router();

// Get email settings (without sensitive info)
router.get('/settings', (req, res) => {
  try {
    const settings = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      configured: !!(process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD),
      smtp_server: process.env.MAIL_SERVER || 'Not configured',
      smtp_port: process.env.MAIL_PORT || 587,
      from_email: process.env.MAIL_FROM_EMAIL || 'Not configured',
      from_name: process.env.MAIL_FROM_NAME || 'Echoverse Support',
      admin_emails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : []
    };

    res.json(settings);
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({ error: 'Failed to get email settings' });
  }
});

// Send test email
router.post('/test', async (req, res) => {
  try {
    console.log('📧 Test email request received');
    
    const testEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() || 'test@example.com';
    
    console.log('Sending test email to:', testEmail);
    
    const result = await sendTestEmail(testEmail);
    
    if (result.success) {
      console.log('✅ Test email sent successfully');
      res.json({
        success: true,
        message: `Test email sent to ${testEmail}. Check your inbox!`,
        messageId: result.messageId
      });
    } else {
      console.error('❌ Test email failed:', result.message);
      res.status(500).json({
        success: false,
        error: result.message || result.error || 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
});

export default router;
