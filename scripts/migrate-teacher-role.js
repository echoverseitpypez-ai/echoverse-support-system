#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: 'config/.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- REACT_APP_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔄 Applying teacher role migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'add-teacher-role.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    })
    
    if (error) {
      // If rpc doesn't work, try direct execution
      const { error: directError } = await supabase
        .from('profiles')
        .select('role')
        .limit(1) // Test query first
        
      if (directError) {
        console.error('❌ Database connection failed:', directError.message)
        process.exit(1)
      }
      
      // Try executing the SQL in parts since rpc might not be available
      console.log('📝 Manual migration required. Please run the following SQL in your Supabase SQL Editor:')
      console.log('\n' + '='.repeat(80))
      console.log(migrationSQL)
      console.log('='.repeat(80) + '\n')
      
      console.log('📋 Or copy and paste from: database/add-teacher-role.sql')
    } else {
      console.log('✅ Migration completed successfully!')
      console.log('✅ Teacher role has been added to the database constraint')
      console.log('✅ You can now create teacher accounts!')
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    
    // Show manual instructions
    console.log('\n📝 To fix this manually:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Open the SQL Editor')
    console.log('3. Run the contents of: database/add-teacher-role.sql')
    console.log('\nThis will update the role constraint to allow "teacher" role.')
  }
}

runMigration()