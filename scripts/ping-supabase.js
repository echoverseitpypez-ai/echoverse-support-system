import fs from 'node:fs'
import dotenv from 'dotenv'

const envPath = fs.existsSync('config/.env.local') ? 'config/.env.local' : '.env'
dotenv.config({ path: envPath })

const url = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase URL or anon key in env file.')
  process.exit(1)
}

const target = `${url}/auth/v1/settings`
const res = await fetch(target, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
if (!res.ok) {
  console.error('Ping failed:', res.status, await res.text())
  process.exit(1)
}
const data = await res.json()
console.log('OK: providers =', Object.keys(data.external || {}).length)
