// Session validator - detects server restarts and logs out users
import { supabase } from '../supabaseClient'
import { logger } from './logger.js'
import { SESSION } from '../config/constants.js'

const SESSION_KEY = SESSION.SESSION_STORAGE_KEY
let validationInterval = null

/**
 * Validates if the current server session matches the stored one
 * If server restarted, the session ID will be different
 */
export async function validateServerSession(isBackgroundCheck = false) {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Not logged in, no need to validate
      return true
    }

    // Get current server session ID
    const response = await fetch('/api/server-session')
    if (!response.ok) {
      // Server might be down or restarting
      if (isBackgroundCheck) {
        console.warn('Server unreachable during background check. Will retry...')
        return true // Don't logout immediately on network error during background check
      }
      console.error('Failed to fetch server session')
      return true // Don't logout on network error
    }

    const { sessionId: currentSessionId } = await response.json()
    
    // Get stored session ID from previous visit
    const storedSessionId = localStorage.getItem(SESSION_KEY)
    
    if (!storedSessionId) {
      // First time or after clear - store current session
      localStorage.setItem(SESSION_KEY, currentSessionId)
      logger.log('🔐 Server session stored:', currentSessionId)
      return true
    }
    
    // Compare session IDs
    if (storedSessionId !== currentSessionId) {
      // Server restarted! Session IDs don't match
      logger.warn('🔄 Server restart detected. Logging out...')
      logger.log('Stored:', storedSessionId)
      logger.log('Current:', currentSessionId)
      
      // Stop periodic validation
      stopPeriodicValidation()
      
      // Update to new session ID
      localStorage.setItem(SESSION_KEY, currentSessionId)
      
      // Logout user
      await supabase.auth.signOut()
      
      // Clear all local storage except the new session ID
      const newSessionId = localStorage.getItem(SESSION_KEY)
      localStorage.clear()
      localStorage.setItem(SESSION_KEY, newSessionId)
      
      // Show alert before redirect
      alert('Server has been restarted. You will be logged out for security.')
      
      // Redirect to login
      window.location.href = '/login'
      return false
    }
    
    // Session is valid
    return true
    
  } catch (error) {
    logger.error('Session validation error:', error)
    // Don't logout on errors - could be network issue
    return true
  }
}

/**
 * Start periodic session validation (checks every 10 seconds)
 * This detects server restarts even without page refresh
 */
export function startPeriodicValidation() {
  // Clear any existing interval
  stopPeriodicValidation()
  
  logger.info('🔄 Started periodic server session validation')
  
  // Check at configured interval
  validationInterval = setInterval(async () => {
    const isValid = await validateServerSession(true)
    if (!isValid) {
      // User was logged out, stop checking
      stopPeriodicValidation()
    }
  }, SESSION.VALIDATION_INTERVAL_MS)
}

/**
 * Stop periodic session validation
 */
export function stopPeriodicValidation() {
  if (validationInterval) {
    clearInterval(validationInterval)
    validationInterval = null
    logger.log('⏹️ Stopped periodic session validation')
  }
}

/**
 * Clear stored server session (call on logout)
 */
export function clearServerSession() {
  stopPeriodicValidation()
  localStorage.removeItem(SESSION_KEY)
}
