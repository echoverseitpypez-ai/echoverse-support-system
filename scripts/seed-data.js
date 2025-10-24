import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse CSV file into array of objects
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length < 2) {
    return [];
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index].trim();
      
      // Convert empty strings to null
      if (value === '') {
        value = null;
      }
      // Convert numeric strings to numbers for id fields
      else if (header.includes('id') && header !== 'id' && !isNaN(value)) {
        value = parseInt(value, 10);
      }
      // Parse ISO date strings
      else if (value && (header.includes('_at') || header.includes('date'))) {
        value = value; // Keep as string, Supabase will handle conversion
      }
      
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
}

/**
 * Seed departments
 */
async function seedDepartments() {
  console.log('\n📦 Seeding departments...');
  
  const csvPath = path.join(__dirname, '../db/csv/departments.csv');
  const departments = parseCSV(csvPath);
  
  if (departments.length === 0) {
    console.log('⚠️  No department data found');
    return;
  }
  
  for (const dept of departments) {
    const { error } = await supabase
      .from('departments')
      .upsert(dept, { onConflict: 'name' });
    
    if (error) {
      console.error(`❌ Error seeding department ${dept.name}:`, error.message);
    } else {
      console.log(`✅ Seeded department: ${dept.name}`);
    }
  }
}

/**
 * Seed profiles (requires users to exist in auth.users first)
 * Note: In production, profiles are auto-created via trigger on user signup
 */
async function seedProfiles() {
  console.log('\n👥 Seeding profiles...');
  
  const csvPath = path.join(__dirname, '../db/csv/profiles.csv');
  const profiles = parseCSV(csvPath);
  
  if (profiles.length === 0) {
    console.log('⚠️  No profile data found');
    return;
  }
  
  for (const profile of profiles) {
    // Check if user exists in auth.users
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id)
      .single();
    
    if (existingProfile) {
      console.log(`⏭️  Profile ${profile.full_name} already exists, skipping...`);
      continue;
    }
    
    // Note: This will only work if the user already exists in auth.users
    // or if using service role key with proper permissions
    const { error } = await supabase
      .from('profiles')
      .insert(profile);
    
    if (error) {
      console.error(`❌ Error seeding profile ${profile.full_name}:`, error.message);
      console.log('💡 Tip: Profiles are typically created via user signup. Ensure users exist in auth.users first.');
    } else {
      console.log(`✅ Seeded profile: ${profile.full_name}`);
    }
  }
}

/**
 * Seed tickets
 */
async function seedTickets() {
  console.log('\n🎫 Seeding tickets...');
  
  const csvPath = path.join(__dirname, '../db/csv/tickets.csv');
  const tickets = parseCSV(csvPath);
  
  if (tickets.length === 0) {
    console.log('⚠️  No ticket data found');
    return;
  }
  
  for (const ticket of tickets) {
    const { error } = await supabase
      .from('tickets')
      .upsert(ticket, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error seeding ticket ${ticket.title}:`, error.message);
    } else {
      console.log(`✅ Seeded ticket: ${ticket.title}`);
    }
  }
}

/**
 * Seed ticket messages
 */
async function seedTicketMessages() {
  console.log('\n💬 Seeding ticket messages...');
  
  const csvPath = path.join(__dirname, '../db/csv/ticket_messages.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  No ticket messages file found');
    return;
  }
  
  const messages = parseCSV(csvPath);
  
  if (messages.length === 0) {
    console.log('⚠️  No ticket message data found');
    return;
  }
  
  for (const message of messages) {
    // Parse attachments if it's a JSON string
    if (message.attachments && typeof message.attachments === 'string') {
      try {
        message.attachments = JSON.parse(message.attachments);
      } catch (e) {
        message.attachments = [];
      }
    }
    
    const { error } = await supabase
      .from('ticket_messages')
      .upsert(message, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error seeding message:`, error.message);
    } else {
      console.log(`✅ Seeded ticket message`);
    }
  }
}

/**
 * Seed settings
 */
async function seedSettings() {
  console.log('\n⚙️  Seeding settings...');
  
  const csvPath = path.join(__dirname, '../db/csv/settings.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  No settings file found');
    return;
  }
  
  const settings = parseCSV(csvPath);
  
  if (settings.length === 0) {
    console.log('⚠️  No settings data found');
    return;
  }
  
  for (const setting of settings) {
    const { error } = await supabase
      .from('settings')
      .upsert(setting, { onConflict: 'key' });
    
    if (error) {
      console.error(`❌ Error seeding setting ${setting.key}:`, error.message);
    } else {
      console.log(`✅ Seeded setting: ${setting.key}`);
    }
  }
}

/**
 * Main seed function
 */
async function seedAll() {
  console.log('🌱 Starting data seeding...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  try {
    // Seed in correct order (respecting foreign key constraints)
    await seedDepartments();
    await seedProfiles();
    await seedSettings();
    await seedTickets();
    await seedTicketMessages();
    
    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  
  if (modulePath === scriptPath) {
    seedAll().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}

export { seedAll, seedDepartments, seedProfiles, seedTickets, seedTicketMessages, seedSettings };
