import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking existing data...\n');
  
  // Check departments
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*');
  
  console.log('📦 Departments:', departments?.length || 0);
  if (departments) console.log(departments);
  if (deptError) console.log('Error:', deptError.message);
  
  // Check settings
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*');
  
  console.log('\n⚙️  Settings:', settings?.length || 0);
  if (settings) console.log(settings);
  if (settingsError) console.log('Error:', settingsError.message);
  
  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  console.log('\n👥 Profiles:', profiles?.length || 0);
  if (profiles) {
    profiles.forEach(p => console.log(`   - ${p.id} | ${p.full_name} | ${p.role}`));
  }
  if (profilesError) console.log('Error:', profilesError.message);
  
  // Check tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*');
  
  console.log('\n🎫 Tickets:', tickets?.length || 0);
  if (ticketsError) console.log('Error:', ticketsError.message);
}

checkData();
