import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = ['departments', 'profiles', 'tickets', 'ticket_messages', 'settings', 'team_chats', 'chat_messages'];

async function checkTables() {
  console.log('📊 Checking database tables...\n');
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: Does not exist or no access`);
    } else {
      console.log(`✅ ${table}: ${count} records`);
    }
  }
}

checkTables();
