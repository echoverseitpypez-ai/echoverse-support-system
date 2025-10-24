import rateLimit from 'express-rate-limit'

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
})

// Create ticket rate limiting
export const createTicketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 ticket creations per minute
  message: {
    error: 'Too many tickets created, please wait before creating another.'
  },
})

// Input sanitization
export function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  next()
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeObject({ temp: item }).temp : item)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// Audit logging middleware
export function auditLog(action) {
  return (req, res, next) => {
    const originalSend = res.send
    
    res.send = function(data) {
      // Log the action
      console.log(`[AUDIT] ${new Date().toISOString()} - User: ${req.user?.id || 'anonymous'}, Action: ${action}, IP: ${req.ip}, Status: ${res.statusCode}`)
      
      // Call the original send
      originalSend.call(this, data)
    }
    
    next()
  }
}