import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users to create
const TEST_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@echoverse.test',
    password: 'Admin@123456',
    full_name: 'Admin User',
    role: 'admin',
    department_id: 1,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'agent@echoverse.test',
    password: 'Agent@123456',
    full_name: 'Support Agent',
    role: 'agent',
    department_id: 1,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=agent'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'teacher1@echoverse.test',
    password: 'Teacher@123456',
    full_name: 'John Teacher',
    role: 'teacher',
    department_id: 2,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'teacher2@echoverse.test',
    password: 'Teacher@123456',
    full_name: 'Sarah Teacher',
    role: 'teacher',
    department_id: 2,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'user@echoverse.test',
    password: 'User@123456',
    full_name: 'Regular User',
    role: 'user',
    department_id: 3,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  }
];

// Sample tickets with various statuses
const SAMPLE_TICKETS = [
  {
    id: '8b7a1d58-7c48-4c2e-9f76-aaaaaaaaaaaa',
    title: 'Printer not working in Room C12',
    description: 'The printer in classroom C12 is jammed and showing error code E-051. Students cannot print their assignments.',
    status: 'in_progress',
    priority: 'high',
    created_by: '33333333-3333-3333-3333-333333333333',
    assigned_to: '22222222-2222-2222-2222-222222222222',
    department_id: 2,
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T10:15:00Z'
  },
  {
    id: '9c8b2e69-8d59-5d3f-0e87-bbbbbbbbbbbb',
    title: 'Projector display issue',
    description: 'The projector in Room A05 shows a blue tint on the screen. Already tried different cables.',
    status: 'open',
    priority: 'normal',
    created_by: '44444444-4444-4444-4444-444444444444',
    assigned_to: null,
    department_id: 2,
    created_at: '2025-01-16T14:20:00Z',
    updated_at: '2025-01-16T14:20:00Z'
  },
  {
    id: 'ad9c3f70-9e60-4e40-8f98-cccccccccccc',
    title: 'Cannot access student portal',
    description: 'Getting "Access Denied" error when trying to log into the student portal. Already reset password twice.',
    status: 'resolved',
    priority: 'urgent',
    created_by: '55555555-5555-5555-5555-555555555555',
    assigned_to: '22222222-2222-2222-2222-222222222222',
    department_id: 2,
    created_at: '2025-01-14T11:00:00Z',
    updated_at: '2025-01-15T16:30:00Z'
  },
  {
    id: 'be0d4081-0f71-4f50-8009-dddddddddddd',
    title: 'Wi-Fi keeps disconnecting in Building B',
    description: 'Students and staff experiencing frequent Wi-Fi disconnections in Building B, especially on the 3rd floor.',
    status: 'open',
    priority: 'high',
    created_by: '33333333-3333-3333-3333-333333333333',
    assigned_to: '22222222-2222-2222-2222-222222222222',
    department_id: 2,
    created_at: '2025-01-16T08:45:00Z',
    updated_at: '2025-01-16T09:00:00Z'
  },
  {
    id: 'cf1e5092-1082-4060-8010-eeeeeeeeeeee',
    title: 'Request new software license',
    description: 'Need to install Adobe Creative Suite for the new Design class starting next week. Require 30 licenses.',
    status: 'open',
    priority: 'normal',
    created_by: '44444444-4444-4444-4444-444444444444',
    assigned_to: null,
    department_id: 2,
    created_at: '2025-01-17T10:00:00Z',
    updated_at: '2025-01-17T10:00:00Z'
  }
];

// Sample ticket messages
const SAMPLE_MESSAGES = [
  {
    id: 'f9d9c8b7-1a2b-4c3d-8e9f-bbbbbbbbbbbb',
    ticket_id: '8b7a1d58-7c48-4c2e-9f76-aaaaaaaaaaaa',
    sender: '33333333-3333-3333-3333-333333333333',
    body: 'I already tried restarting the printer but it still shows the error.',
    attachments: [],
    created_at: '2025-01-15T09:45:00Z'
  },
  {
    id: 'a0e0d9c8-2b3c-4d4e-9f00-cccccccccccc',
    ticket_id: '8b7a1d58-7c48-4c2e-9f76-aaaaaaaaaaaa',
    sender: '22222222-2222-2222-2222-222222222222',
    body: 'Thanks for reporting. I will check the printer shortly. This error usually indicates a paper jam in the rear tray.',
    attachments: [],
    created_at: '2025-01-15T10:15:00Z'
  },
  {
    id: 'b1f1e0d9-3c4d-4e5f-8010-dddddddddddd',
    ticket_id: 'ad9c3f70-9e60-4e40-8f98-cccccccccccc',
    sender: '55555555-5555-5555-5555-555555555555',
    body: 'This is urgent, I need to submit my assignment by 5 PM today!',
    attachments: [],
    created_at: '2025-01-14T11:30:00Z'
  },
  {
    id: 'c2f2f1e0-4d5e-4f60-8020-eeeeeeeeeeee',
    ticket_id: 'ad9c3f70-9e60-4e40-8f98-cccccccccccc',
    sender: '22222222-2222-2222-2222-222222222222',
    body: 'I have reset your permissions. Please try logging in again and let me know if it works.',
    attachments: [],
    created_at: '2025-01-14T14:00:00Z'
  },
  {
    id: 'd3a3f2f1-5e6f-4070-8030-ffffffffffff',
    ticket_id: 'ad9c3f70-9e60-4e40-8f98-cccccccccccc',
    sender: '55555555-5555-5555-5555-555555555555',
    body: 'Perfect! It works now. Thank you so much!',
    attachments: [],
    created_at: '2025-01-14T15:30:00Z'
  },
  {
    id: 'e4b4a3f2-6f70-4080-8040-aaaaaaaaabbb',
    ticket_id: 'be0d4081-0f71-4f50-8009-dddddddddddd',
    sender: '22222222-2222-2222-2222-222222222222',
    body: 'I have logged this with our network team. They will investigate the access points in Building B.',
    attachments: [],
    created_at: '2025-01-16T09:00:00Z'
  }
];

/**
 * Create test users in auth.users
 */
async function createTestUsers() {
  console.log('\n👤 Creating test users...');
  
  for (const user of TEST_USERS) {
    // Check if user with this email already exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === user.email);
    
    if (existingUser) {
      console.log(`⏭️  User ${user.email} already exists with ID: ${existingUser.id}`);
      
      // Ensure profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: existingUser.id,
          full_name: user.full_name,
          role: user.role,
          department_id: user.department_id,
          avatar_url: user.avatar_url,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.error(`   ⚠️  Profile error:`, profileError.message);
      } else {
        console.log(`   ✅ Profile ensured for ${user.full_name}`);
      }
      continue;
    }
    
    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name
      }
    });
    
    if (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    } else {
      console.log(`✅ Created user: ${user.email} (ID: ${data.user.id})`);
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: user.full_name,
          role: user.role,
          department_id: user.department_id,
          avatar_url: user.avatar_url,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        });
      
      if (profileError) {
        console.error(`   ⚠️  Profile error:`, profileError.message);
      } else {
        console.log(`   ✅ Profile created for ${user.full_name}`);
      }
    }
  }
  
  // Get all profiles to use for seeding
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  console.log('\n📋 Available profiles for seeding:');
  profiles?.forEach(p => console.log(`   - ${p.id} | ${p.full_name} | ${p.role}`));
  
  return profiles;
}

/**
 * Seed tickets
 */
async function seedTickets() {
  console.log('\n🎫 Seeding tickets...');
  
  for (const ticket of SAMPLE_TICKETS) {
    const { error } = await supabase
      .from('tickets')
      .upsert(ticket, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error seeding ticket "${ticket.title}":`, error.message);
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
  
  for (const message of SAMPLE_MESSAGES) {
    const { error } = await supabase
      .from('ticket_messages')
      .upsert(message, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Error seeding message:`, error.message);
    } else {
      console.log(`✅ Seeded message for ticket ${message.ticket_id.substring(0, 8)}...`);
    }
  }
}

/**
 * Main seed function
 */
async function seedFullData() {
  console.log('🌱 Starting FULL data seeding with test users...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log('\n⚠️  This will create/ensure test users with following credentials:');
  TEST_USERS.forEach(u => console.log(`   - ${u.email} / ${u.password} (${u.role})`));
  
  try {
    const profiles = await createTestUsers();
    
    // Map roles to actual user IDs
    const adminUser = profiles?.find(p => p.role === 'admin');
    const agentUser = profiles?.find(p => p.role === 'agent');
    const teacherUser = profiles?.find(p => p.role === 'teacher');
    const normalUser = profiles?.find(p => p.role === 'user');
    
    if (!adminUser || !agentUser || !teacherUser) {
      console.warn('\n⚠️  Warning: Not all required user roles found. Using existing profiles for seeding.');
    }
    
    // Update ALL tickets and messages with actual user IDs
    if (agentUser && teacherUser && normalUser) {
      // Update tickets
      SAMPLE_TICKETS[0].created_by = teacherUser.id;
      SAMPLE_TICKETS[0].assigned_to = agentUser.id;
      SAMPLE_TICKETS[1].created_by = teacherUser.id;  // Projector
      SAMPLE_TICKETS[2].created_by = normalUser.id;   // Student portal
      SAMPLE_TICKETS[2].assigned_to = agentUser.id;
      SAMPLE_TICKETS[3].created_by = teacherUser.id;  // Wi-Fi
      SAMPLE_TICKETS[3].assigned_to = agentUser.id;
      SAMPLE_TICKETS[4].created_by = teacherUser.id;  // Software license
      
      // Update messages
      SAMPLE_MESSAGES[0].sender = teacherUser.id;
      SAMPLE_MESSAGES[1].sender = agentUser.id;
      SAMPLE_MESSAGES[2].sender = normalUser.id;
      SAMPLE_MESSAGES[3].sender = agentUser.id;
      SAMPLE_MESSAGES[4].sender = normalUser.id;
      SAMPLE_MESSAGES[5].sender = agentUser.id;
    }
    
    await seedTickets();
    await seedTicketMessages();
    
    console.log('\n✨ Full data seeding completed successfully!');
    console.log('\n📝 Test Login Credentials:');
    console.log('   Admin:  admin@echoverse.test / Admin@123456');
    console.log('   Agent:  agent@echoverse.test / Agent@123456');
    console.log('   Teacher: teacher1@echoverse.test / Teacher@123456');
    console.log('   User:   user@echoverse.test / User@123456');
    
    console.log('\n📊 Final Database State:');
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
    const { count: messageCount } = await supabase.from('ticket_messages').select('*', { count: 'exact', head: true });
    console.log(`   - Tickets: ${ticketCount}`);
    console.log(`   - Messages: ${messageCount}`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  
  if (modulePath === scriptPath) {
    seedFullData().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}

export { seedFullData };
