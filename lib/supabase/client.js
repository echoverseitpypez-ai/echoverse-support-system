import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}

// Create a single instance for browser use
export const supabase = createClient()

// Helper function to get session token (for backward compatibility)
export async function getSessionToken() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}