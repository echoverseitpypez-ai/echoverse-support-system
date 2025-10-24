/**
 * Centralized logging utility
 * Respects environment - only logs in development
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info('ℹ️', ...args)
    }
  },
  
  warn: (...args) => {
    console.warn('⚠️', ...args)
  },
  
  error: (...args) => {
    console.error('❌', ...args)
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('🐛', ...args)
    }
  },
  
  success: (...args) => {
    if (isDevelopment) {
      console.log('✅', ...args)
    }
  }
}

// Server-side logger (for Node.js)
export const serverLogger = {
  log: (...args) => console.log(...args),
  info: (...args) => console.info('ℹ️', ...args),
  warn: (...args) => console.warn('⚠️', ...args),
  error: (...args) => console.error('❌', ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('🐛', ...args)
    }
  },
  success: (...args) => console.log('✅', ...args)
}
