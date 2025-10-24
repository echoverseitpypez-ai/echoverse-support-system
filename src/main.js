import { supabase } from './supabaseClient'

const envEl = document.getElementById('env')
const statusEl = document.getElementById('status')
const btn = document.getElementById('ping')

function showEnv() {
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
  envEl.textContent = `URL=${hasUrl ? 'set' : 'missing'}, KEY=${hasKey ? 'set' : 'missing'}`
}

async function ping() {
  statusEl.className = ''
  statusEl.textContent = 'Pinging…'
  try {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Call an auth endpoint to verify API reachability
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    statusEl.textContent = `OK: got auth settings (providers: ${Object.keys(data.external || {}).length})`
    statusEl.className = 'ok'
  } catch (err) {
    console.error(err)
    statusEl.textContent = `Error: ${err.message}`
    statusEl.className = 'err'
  }
}

btn.addEventListener('click', ping)
showEnv()
