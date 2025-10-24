import 'dotenv/config'
import { supabaseAdmin } from '../server/supabase.js'

const username = 'admin'
const password = 'admin123'
const email = `${username}@echoverse.local`

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in config/.env.server.local')
  process.exit(1)
}

const { data: created, error: e1 } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username }
})
let uid = created?.user?.id
if (e1 && !uid) {
  // User may already exist; look it up and continue
  const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  uid = list.data.users.find(u => u.email === email)?.id
  if (!uid) {
    console.error('Create user failed:', e1.message)
    process.exit(1)
  }
}

// Ensure profile exists and set role=admin
const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('id', uid).maybeSingle()
let e2 = null
const deptId = 1
if (!existing) {
  const { error } = await supabaseAdmin.from('profiles').insert({ id: uid, full_name: 'Admin', avatar_url: '', role: 'admin', department_id: deptId })
  e2 = error
} else {
  const { error } = await supabaseAdmin.from('profiles').update({ role: 'admin', full_name: 'Admin', avatar_url: '', department_id: deptId }).eq('id', uid)
  e2 = error
}
if (e2) {
  console.error('Profile upsert failed:', e2.message)
  process.exit(1)
}
console.log('Admin ready:', { username, password })
