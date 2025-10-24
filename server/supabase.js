import { createClient } from '@supabase/supabase-js'

// Support multiple env var names and avoid crashing if service key is missing
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('Missing SUPABASE_URL (or VITE_/REACT_APP_ equivalent).')
if (!anon) throw new Error('Missing SUPABASE_ANON_KEY (or VITE_/REACT_APP_ equivalent).')

export const supabaseAnon = createClient(url, anon)
export const supabaseAdmin = service
  ? createClient(url, service, { auth: { persistSession: false } })
  : supabaseAnon
