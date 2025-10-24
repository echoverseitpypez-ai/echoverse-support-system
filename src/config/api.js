/**
 * API Configuration
 * Uses environment variables for production deployment
 */

// API Base URL - uses environment variable or falls back to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// WebSocket URL - uses environment variable or falls back to localhost
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// API Endpoints
export const API_ENDPOINTS = {
  TICKETS: `${API_BASE_URL}/api/tickets`,
  USERS: `${API_BASE_URL}/api/users`,
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
  ATTACHMENTS: `${API_BASE_URL}/api/attachments`,
  EMAIL: `${API_BASE_URL}/api/email`,
  SETTINGS: `${API_BASE_URL}/api/settings`,
  HEALTH: `${API_BASE_URL}/api/health`,
  SERVER_SESSION: `${API_BASE_URL}/api/server-session`,
}

// Development mode check
export const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

// Log configuration in development
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    WS_URL,
    SUPABASE_URL: SUPABASE_URL ? '✅ Set' : '❌ Not set',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
  })
}
