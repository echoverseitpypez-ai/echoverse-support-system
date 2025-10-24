import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { requireRole } from '../auth.js'

const router = Router()

function slugify(input) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/users (profiles)
router.get('/', async (req, res) => {
  if (!requireRole(req.profile, ['admin', 'agent'])) return res.status(403).json({ error: 'Forbidden' })
  const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Create user (admin only) - supports teacher, admin, agent roles
router.post('/', async (req, res) => {
  try {
    if (!requireRole(req.profile, ['admin'])) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server missing service role key' })
    }
    
    const { username, password, full_name, department_id, role } = req.body || {}
    
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' })
    }
    
    // Validate role
    const validRoles = ['teacher', 'admin', 'agent']
    const userRole = role && validRoles.includes(role) ? role : 'teacher'
    
    const safe = slugify(username)
    const email = `${safe || userRole}@echoverse.local`
    
    // Create auth user without email confirmation
    const { data: created, error: e1 } = await supabaseAdmin.auth.admin.createUser({ 
      email, 
      password, 
      email_confirm: true, 
      user_metadata: { 
        username: safe, 
        display_name: full_name || username,
        role: userRole 
      } 
    })
    
    if (e1) {
      console.error('Error creating auth user:', e1)
      return res.status(400).json({ error: e1.message || 'Failed to create auth user' })
    }
    
    if (!created || !created.user) {
      return res.status(500).json({ error: 'Failed to create user' })
    }
    
    const uid = created.user.id
    
    // Upsert profile with specified role
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: uid, 
        full_name: full_name || username, 
        role: userRole, 
        department_id 
      }, { onConflict: 'id' })
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating profile:', error)
      return res.status(400).json({ error: error.message || 'Failed to create profile' })
    }
    
    return res.status(201).json({ 
      success: true,
      user_id: uid, 
      profile: data 
    })
  } catch (error) {
    console.error('Unexpected error in user creation:', error)
    return res.status(500).json({ error: 'Internal server error: ' + error.message })
  }
})

// Update profile (admin only)
router.patch('/:id', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  const { data, error } = await supabaseAdmin.from('profiles').update(req.body).eq('id', req.params.id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server missing service role key' })
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

// Reset password (admin only)
router.post('/:id/password', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  const { password } = req.body || {}
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server missing service role key' })
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

export default router
