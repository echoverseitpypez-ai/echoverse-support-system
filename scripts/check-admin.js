import 'dotenv/config'
import { supabaseAdmin } from '../server/supabase.js'

const email = 'admin@echoverse.local'

console.log('Checking admin user...')

// Check if user exists in auth.users
const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
if (listError) {
  console.error('Error listing users:', listError.message)
  process.exit(1)
}

const adminUser = users.users.find(u => u.email === email)
if (!adminUser) {
  console.error('Admin user not found in auth.users')
  process.exit(1)
}

console.log('Admin user found:', {
  id: adminUser.id,
  email: adminUser.email,
  created_at: adminUser.created_at
})

// Check profile
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('id', adminUser.id)
  .single()

if (profileError) {
  console.error('Error fetching profile:', profileError.message)
  process.exit(1)
}

console.log('Admin profile:', profile)

if (profile.role !== 'admin') {
  console.log('Updating role to admin...')
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', adminUser.id)
  
  if (updateError) {
    console.error('Error updating role:', updateError.message)
    process.exit(1)
  }
  
  console.log('Role updated to admin successfully!')
} else {
  console.log('User is already admin')
}