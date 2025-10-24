import { getSessionToken } from '../supabaseClient.js'

const base = '/api'

export async function api(path, options = {}) {
  const token = await getSessionToken()
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  
  // Get response text first
  const text = await res.text()
  
  // Try to parse as JSON
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (e) {
    console.error('Failed to parse JSON response:', text)
    throw new Error('Invalid JSON response from server')
  }
  
  // Check if response is OK
  if (!res.ok) {
    const errorMessage = data.error || data.message || `HTTP ${res.status}`
    throw new Error(errorMessage)
  }
  
  return data
}
