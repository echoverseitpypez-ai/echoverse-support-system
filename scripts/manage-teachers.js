#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: 'config/.env.local' })

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- REACT_APP_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (or REACT_APP_SUPABASE_ANON_KEY)')
  console.log('\nCheck your config/.env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listTeachers() {
  console.log('📋 Listing all teacher accounts...\n')
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (profiles.length === 0) {
      console.log('❌ No teacher accounts found!')
      console.log('💡 Create one using the admin dashboard at /admin/users')
      return
    }
    
    console.log(`✅ Found ${profiles.length} teacher account(s):\n`)
    profiles.forEach((teacher, index) => {
      console.log(`${index + 1}. Teacher Account:`)
      console.log(`   📧 Email: ${teacher.id}@echoverse.dev (generated from ID)`)
      console.log(`   👤 Full Name: ${teacher.full_name || 'Not set'}`)
      console.log(`   🔑 Role: ${teacher.role}`)
      console.log(`   📅 Created: ${new Date(teacher.created_at).toLocaleDateString()}`)
      console.log(`   🆔 User ID: ${teacher.id.substring(0, 8)}...`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error fetching teachers:', error.message)
  }
}

async function listAllUsers() {
  console.log('👥 Listing all user accounts...\n')
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    if (profiles.length === 0) {
      console.log('❌ No user accounts found!')
      return
    }
    
    console.log(`✅ Found ${profiles.length} user account(s):\n`)
    profiles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} Account:`)
      console.log(`   👤 Full Name: ${user.full_name || 'Not set'}`)
      console.log(`   🔑 Role: ${user.role}`)
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log(`   🆔 User ID: ${user.id.substring(0, 8)}...`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error fetching users:', error.message)
  }
}

async function checkLoginFormat() {
  console.log('🔍 Login Format Information:\n')
  console.log('Based on your login system:')
  console.log('• Username gets converted to: username@echoverse.local')
  console.log('• But teacher accounts are created with: username@echoverse.dev')
  console.log('\n❗ This mismatch might be causing login issues!')
  console.log('\n💡 Solutions:')
  console.log('1. Create teachers with @echoverse.local emails')
  console.log('2. Or update login system to use @echoverse.dev')
  console.log('3. Or check what email format your teachers actually have')
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'teachers'
  
  console.log('🎓 Teacher Account Manager\n')
  console.log('=' .repeat(50) + '\n')
  
  switch (command) {
    case 'teachers':
      await listTeachers()
      break
    case 'all':
      await listAllUsers()
      break
    case 'format':
      await checkLoginFormat()
      break
    case 'help':
      console.log('Available commands:')
      console.log('• npm run manage:teachers          - List teacher accounts')
      console.log('• npm run manage:teachers all      - List all user accounts')
      console.log('• npm run manage:teachers format   - Check login format info')
      break
    default:
      await listTeachers()
      await checkLoginFormat()
  }
}

main().catch(console.error)