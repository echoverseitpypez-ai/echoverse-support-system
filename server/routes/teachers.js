import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import crypto from 'crypto'

const router = Router()

function slugify(input) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Public: Teacher self-signup without email exposure
// POST /auth/teachers/signup
router.post('/signup', async (req, res) => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server not configured for signups' })
    }
    const { name, password, department_id } = req.body || {}
    if (!name || !password) return res.status(400).json({ error: 'name and password required' })

    const base = slugify(name)
    let email = `${base || 'teacher'}@echoverse.local`

    // Try to create user; if email collision, add a short suffix
    let created
    let lastErr
    for (let i = 0; i < 3; i++) {
      const attemptEmail = i === 0 ? email : `${base || 'teacher'}-${crypto.randomInt(1000,9999)}@echoverse.local`
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: attemptEmail,
        password,
        email_confirm: true,
        user_metadata: { username: base, display_name: name }
      })
      if (!error) {
        created = data
        email = attemptEmail
        break
      }
      lastErr = error
    }
    if (!created) return res.status(400).json({ error: lastErr?.message || 'Failed to create user' })

    const uid = created.user.id
    const { data: profile, error: upErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: uid, full_name: name, role: 'teacher', department_id }, { onConflict: 'id' })
      .select('*')
      .single()
    if (upErr) return res.status(400).json({ error: upErr.message })

    // Return login hint (internal email), but do not display it in UI
    res.status(201).json({ ok: true, user_id: uid, login_email: email, profile })
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) })
  }
})

export default router