/**
 * Deploy Class Schedule Schema to Supabase
 * 
 * This script deploys the class schedule database schema to your Supabase instance.
 * It reads the SQL file and executes it using the Supabase service role.
 * 
 * Usage:
 *   node scripts/deploy-class-schedule.js
 * 
 * Requirements:
 *   - SUPABASE_URL in environment
 *   - SUPABASE_SERVICE_ROLE_KEY in environment
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function deploySchema() {
  log('═══════════════════════════════════════════════════', 'cyan')
  log('  📚 Class Schedule Schema Deployment', 'cyan')
  log('═══════════════════════════════════════════════════', 'cyan')
  console.log()

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    log('❌ Error: SUPABASE_URL not found in environment', 'red')
    log('   Please add it to your .env file', 'yellow')
    process.exit(1)
  }

  if (!supabaseKey) {
    log('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment', 'red')
    log('   Please add it to your .env file', 'yellow')
    log('   You can find this in your Supabase project settings', 'yellow')
    process.exit(1)
  }

  log('✓ Environment variables loaded', 'green')
  log(`  URL: ${supabaseUrl}`, 'blue')
  console.log()

  // Read SQL file
  const sqlFilePath = path.join(__dirname, '../db/class_schedule_schema.sql')
  
  if (!fs.existsSync(sqlFilePath)) {
    log('❌ Error: Schema file not found', 'red')
    log(`   Expected location: ${sqlFilePath}`, 'yellow')
    process.exit(1)
  }

  log('✓ Schema file found', 'green')
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
  log(`  Size: ${(sqlContent.length / 1024).toFixed(2)} KB`, 'blue')
  console.log()

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  log('⏳ Deploying schema to Supabase...', 'yellow')
  console.log()

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      log('⚠️  RPC function not available, trying direct execution...', 'yellow')
      
      // Note: This requires the SQL to be split into individual statements
      // For production, you should execute this directly in Supabase SQL Editor
      throw new Error('Please execute the SQL file directly in Supabase SQL Editor.\n' +
                      'Steps:\n' +
                      '1. Go to your Supabase Dashboard\n' +
                      '2. Navigate to SQL Editor\n' +
                      '3. Create a new query\n' +
                      '4. Copy and paste the contents of db/class_schedule_schema.sql\n' +
                      '5. Click Run')
    }

    log('═══════════════════════════════════════════════════', 'green')
    log('  ✅ Schema Deployment Successful!', 'green')
    log('═══════════════════════════════════════════════════', 'green')
    console.log()
    
    log('📊 Created tables:', 'cyan')
    const tables = [
      'academic_terms',
      'subjects',
      'class_schedules',
      'class_enrollments',
      'class_sessions',
      'attendance_records',
      'class_announcements',
      'office_hours'
    ]
    tables.forEach(table => log(`  • ${table}`, 'blue'))
    console.log()

    log('🔒 Row Level Security (RLS) enabled on all tables', 'cyan')
    console.log()

    log('📚 Next steps:', 'cyan')
    log('  1. Review the created tables in Supabase Dashboard > Table Editor', 'blue')
    log('  2. Check docs/CLASS_SCHEDULE_SETUP.md for usage examples', 'blue')
    log('  3. Start creating academic terms and subjects', 'blue')
    log('  4. Build your class schedule UI', 'blue')
    console.log()

  } catch (err) {
    log('═══════════════════════════════════════════════════', 'red')
    log('  ❌ Deployment Failed', 'red')
    log('═══════════════════════════════════════════════════', 'red')
    console.log()
    log('Error details:', 'red')
    console.error(err)
    console.log()
    
    log('📝 Manual deployment instructions:', 'yellow')
    log('  1. Open your Supabase project dashboard', 'blue')
    log('  2. Go to SQL Editor (left sidebar)', 'blue')
    log('  3. Click "+ New query"', 'blue')
    log('  4. Copy the contents of db/class_schedule_schema.sql', 'blue')
    log('  5. Paste into the editor', 'blue')
    log('  6. Click "Run" or press Ctrl+Enter', 'blue')
    console.log()
    
    process.exit(1)
  }
}

// Run deployment
deploySchema().catch(err => {
  log('❌ Unexpected error:', 'red')
  console.error(err)
  process.exit(1)
})
