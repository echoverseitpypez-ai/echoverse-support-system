import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to config directory (two levels up from scripts/setup/)
const envFilePath = path.join(__dirname, '..', '..', 'config', '.env.server.local');

const emailConfig = `
# === Email Notifications Configuration ===
# Added automatically by setup-email-config.js
EMAIL_ENABLED=true

# Gmail SMTP Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true

# Gmail Credentials
MAIL_USERNAME=echoverseitpypez@gmail.com
MAIL_PASSWORD=pscuxxaukjwotpcd

# Sender Information
MAIL_FROM_EMAIL=echoverseitpypez@gmail.com
MAIL_FROM_NAME=Echoverse Support

# Admin Email Recipients (comma-separated)
ADMIN_EMAILS=echoverseitpypez@gmail.com,jajamabuhay3@gmail.com

# Email Notifications Settings
NOTIFY_ON_TICKET_CREATED=true
NOTIFY_ON_TICKET_ASSIGNED=true
NOTIFY_ON_TICKET_UPDATED=true
NOTIFY_ON_TICKET_RESOLVED=true
NOTIFY_ON_NEW_COMMENT=true

# App URL (for email links)
APP_URL=http://localhost:3000
`;

console.log('🔧 Setting up email configuration...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  // Check if file exists
  if (!fs.existsSync(envFilePath)) {
    console.log('❌ .env.server.local file not found');
    console.log('Creating new .env.server.local file...');
    fs.writeFileSync(envFilePath, emailConfig.trim());
    console.log('✅ Created .env.server.local with email configuration');
  } else {
    // Read existing file
    let existingContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Check if email config already exists
    if (existingContent.includes('EMAIL_ENABLED')) {
      console.log('⚠️  Email configuration already exists in .env.server.local');
      console.log('');
      console.log('Current email settings:');
      const lines = existingContent.split('\n');
      lines.forEach(line => {
        if (line.includes('EMAIL_') || line.includes('MAIL_') || line.includes('NOTIFY_') || line.includes('ADMIN_EMAILS')) {
          console.log('  ', line);
        }
      });
      console.log('');
      console.log('💡 Tip: If emails are not working, verify these settings are correct');
    } else {
      // Append email config
      console.log('📝 Adding email configuration to existing .env.server.local...');
      
      // Add a blank line if file doesn't end with newline
      if (!existingContent.endsWith('\n')) {
        existingContent += '\n';
      }
      
      existingContent += emailConfig;
      fs.writeFileSync(envFilePath, existingContent);
      console.log('✅ Email configuration added successfully!');
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📧 Email Configuration:');
  console.log('  ✅ EMAIL_ENABLED=true');
  console.log('  ✅ MAIL_SERVER=smtp.gmail.com');
  console.log('  ✅ MAIL_USERNAME=echoverseitpypez@gmail.com');
  console.log('  ✅ ADMIN_EMAILS=echoverseitpypez@gmail.com,jajamabuhay3@gmail.com');
  console.log('');
  console.log('🎯 Next Step: Test your email configuration');
  console.log('   Run: node tests/test-email.js');
  console.log('');
  console.log('✨ Setup complete!');
  
} catch (error) {
  console.error('❌ Error setting up email configuration:', error.message);
  console.error('');
  console.error('🔧 Manual Setup Instructions:');
  console.error('   1. Open .env.server.local in your editor');
  console.error('   2. Add the following lines:');
  console.error('');
  console.error(emailConfig);
  process.exit(1);
}
