import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { requireRole } from '../auth.js'
import { sendTestEmail } from '../services/emailService.js'

const router = Router()

router.get('/', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  const { data, error } = await supabaseAdmin.from('settings').select('*')
  if (error) return res.status(400).json({ error: error.message })
  res.json(Object.fromEntries((data || []).map(r => [r.key, r.value])))
})

router.put('/', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  const entries = Object.entries(req.body || {})
  const upserts = entries.map(([key, value]) => ({ key, value }))
  const { error } = await supabaseAdmin.from('settings').upsert(upserts)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

// Get email settings
router.get('/email', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .or('key.eq.email_enabled,key.eq.admin_emails,key.eq.notify_on_ticket_created,key.eq.notify_on_ticket_assigned,key.eq.notify_on_ticket_updated,key.eq.notify_on_ticket_resolved,key.eq.mail_from_name')
    
    if (error) throw error
    
    const settings = {
      email_enabled: false,
      admin_emails: [],
      notify_on_ticket_created: true,
      notify_on_ticket_assigned: true,
      notify_on_ticket_updated: true,
      notify_on_ticket_resolved: true,
      mail_from_name: 'Echoverse Support'
    }
    
    // Parse settings from database
    data?.forEach(row => {
      if (row.key === 'email_enabled') {
        settings.email_enabled = row.value === 'true'
      } else if (row.key === 'admin_emails') {
        try {
          settings.admin_emails = JSON.parse(row.value)
        } catch {
          settings.admin_emails = row.value ? row.value.split(',').map(e => e.trim()) : []
        }
      } else if (row.key.startsWith('notify_on_')) {
        settings[row.key] = row.value === 'true'
      } else {
        settings[row.key] = row.value
      }
    })
    
    res.json(settings)
  } catch (error) {
    console.error('Error fetching email settings:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update email settings
router.put('/email', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  
  try {
    const { 
      email_enabled, 
      admin_emails, 
      notify_on_ticket_created,
      notify_on_ticket_assigned,
      notify_on_ticket_updated,
      notify_on_ticket_resolved,
      mail_from_name
    } = req.body
    
    const upserts = [
      { key: 'email_enabled', value: String(email_enabled) },
      { key: 'admin_emails', value: JSON.stringify(admin_emails || []) },
      { key: 'notify_on_ticket_created', value: String(notify_on_ticket_created) },
      { key: 'notify_on_ticket_assigned', value: String(notify_on_ticket_assigned) },
      { key: 'notify_on_ticket_updated', value: String(notify_on_ticket_updated) },
      { key: 'notify_on_ticket_resolved', value: String(notify_on_ticket_resolved) },
      { key: 'mail_from_name', value: mail_from_name || 'Echoverse Support' }
    ]
    
    const { error } = await supabaseAdmin.from('settings').upsert(upserts)
    if (error) throw error
    
    res.json({ success: true, message: 'Email settings updated successfully' })
  } catch (error) {
    console.error('Error updating email settings:', error)
    res.status(500).json({ error: error.message })
  }
})

// Test email configuration
router.post('/email/test', async (req, res) => {
  if (!requireRole(req.profile, ['admin'])) return res.status(403).json({ error: 'Forbidden' })
  
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email address required' })
    
    const result = await sendTestEmail(email)
    
    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully!', messageId: result.messageId })
    } else {
      res.status(500).json({ success: false, error: result.error || result.message })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
