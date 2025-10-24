import 'dotenv/config'
import { supabase } from '../src/supabaseClient.js'

const username = 'admin'
const password = 'admin123'
const email = `${username}@echoverse.local`

console.log('Testing login with:', { email, password })

try {
  // Test authentication
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) {
    console.error('Auth error:', error.message)
    process.exit(1)
  }
  
  console.log('Login successful:', {
    userId: data.user.id,
    email: data.user.email
  })
  
  // Test profile fetch
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
  
  if (profileError) {
    console.error('Profile fetch error:', profileError.message)
    process.exit(1)
  }
  
  const profile = profiles?.[0]
  console.log('Profile result:', { profiles, profile })
  
  if (profile?.role === 'admin' || profile?.role === 'agent') {
    console.log('✅ User is admin/agent')
  } else {
    console.log('❌ User is not admin/agent, role:', profile?.role)
  }
  
  // Sign out
  await supabase.auth.signOut()
  console.log('Signed out')
  
} catch (err) {
  console.error('Unexpected error:', err)
}