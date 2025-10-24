import { createClient } from '@supabase/supabase-js'

// Support both Vite and Create React App environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.REACT_APP_SUPABASE_URL

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                   import.meta.env.REACT_APP_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export async function getSessionToken() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}
