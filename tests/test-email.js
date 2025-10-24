import { sendTestEmail } from '../server/services/emailService.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'config/.env.server.local' });

console.log('🧪 Testing email configuration...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Email Service:', process.env.EMAIL_ENABLED === 'true' ? '✅ Enabled' : '❌ Disabled');
console.log('SMTP Server:', process.env.MAIL_SERVER || 'Not configured');
console.log('SMTP Port:', process.env.MAIL_PORT || 'Not configured');
console.log('From Email:', process.env.MAIL_FROM_EMAIL || 'Not configured');
console.log('Admin Emails:', process.env.ADMIN_EMAILS || 'Not configured');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const testEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() || 'test@example.com';

console.log(`📧 Sending test email to: ${testEmail}`);
console.log('⏳ Please wait...');
console.log('');

sendTestEmail(testEmail)
  .then(result => {
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Message ID:', result.messageId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📬 Check your inbox at:', testEmail);
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Check spam folder if not in inbox');
      console.log('   - Email subject: "🎫 New Ticket Created: Test Ticket"');
      console.log('   - Sender:', process.env.MAIL_FROM_EMAIL);
      console.log('');
      console.log('✨ Email notifications are working!');
    } else {
      console.error('❌ Failed to send test email');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', result.error || result.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check config/.env.server.local has correct EMAIL_ENABLED=true');
      console.log('   2. Verify MAIL_USERNAME and MAIL_PASSWORD are correct');
      console.log('   3. Make sure you\'re using Gmail App Password, not regular password');
      console.log('   4. Enable 2-Step Verification on your Google Account');
      console.log('   5. Generate new App Password at: https://myaccount.google.com/apppasswords');
      console.log('');
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error occurred while sending test email');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  });
