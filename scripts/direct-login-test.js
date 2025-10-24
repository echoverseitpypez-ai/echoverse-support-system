import 'dotenv/config'
import { supabaseAdmin } from '../server/supabase.js'

// Test direct access to check what's happening
const email = 'admin@echoverse.local'

console.log('Testing direct login...')

// First check the user exists
const { data: listResult } = await supabaseAdmin.auth.admin.listUsers()
const adminUser = listResult.users.find(u => u.email === email)

if (!adminUser) {
  console.log('❌ Admin user not found')
  process.exit(1)
}

console.log('✅ Admin user exists:', adminUser.id)

// Check profile directly with admin client
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('id', adminUser.id)
  .single()

console.log('Profile query result:', { profile, error: profileError })

if (profile) {
  console.log('✅ Profile found:', {
    id: profile.id,
    role: profile.role,
    full_name: profile.full_name
  })
} else {
  console.log('❌ Profile not found or error:', profileError)
}

// Now test login with normal client
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY

const testClient = createClient(url, anon)

console.log('Testing auth login...')
const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
  email,
  password: 'admin123'
})

if (authError) {
  console.log('❌ Auth failed:', authError.message)
} else {
  console.log('✅ Auth successful:', authData.user.id)
  
  // Test profile fetch with regular client
  const { data: profileData, error: profileFetchError } = await testClient
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
  
  console.log('Profile fetch with regular client:', { 
    data: profileData, 
    error: profileFetchError,
    userId: authData.user.id 
  })
  
  await testClient.auth.signOut()
}