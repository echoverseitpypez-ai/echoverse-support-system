import { supabaseAdmin } from './supabase.js'

export async function getUserFromRequest(req) {
  const auth = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error) return null
  return data.user
}

export async function getProfile(userId) {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data
}

export function requireRole(profile, roles) {
  return profile && roles.includes(profile.role)
}

export async function authMiddleware(req, res, next) {
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const profile = await getProfile(user.id)
  req.user = user
  req.profile = profile
  next()
}
