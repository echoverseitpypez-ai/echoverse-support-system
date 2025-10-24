import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import os from 'os'
import { authMiddleware } from './auth.js'
import { apiLimiter, authLimiter, sanitizeInput } from './middleware/security.js'
import { initializeWebSocket } from './websocket.js'
import { initializeServerSession, getServerSessionId } from './sessionManager.js'
import ticketsRouter from './routes/tickets.js'
import usersRouter from './routes/users.js'
import settingsRouter from './routes/settings.js'
import teachersRouter from './routes/teachers.js'
import analyticsRouter from './routes/analytics.js'
import attachmentsRouter from './routes/attachments.js'
import emailRouter from './routes/email.js'

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'
]

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ FATAL: Missing required environment variable: ${varName}`)
    console.error(`Please check your config/.env.server.local file`)
    process.exit(1)
  }
})

console.log('✅ All required environment variables loaded')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

// Initialize server session on startup
initializeServerSession()

// CORS configuration with production security
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : (process.env.NODE_ENV === 'production' 
        ? [] // Require explicit CORS in production
        : true), // Allow all origins in development for LAN access
  credentials: true
}

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.error('⚠️  WARNING: CORS_ORIGIN not set in production!')
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(sanitizeInput)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Server session endpoint (public - for restart detection)
app.get('/api/server-session', (_req, res) => {
  res.json({ sessionId: getServerSessionId() })
})

// Public teacher signup (with auth rate limiting)
app.use('/auth/teachers', authLimiter, teachersRouter)

// Authenticated API (with rate limiting)
app.use('/api', apiLimiter, authMiddleware)
app.use('/api/tickets', ticketsRouter)
app.use('/api/users', usersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/attachments', attachmentsRouter)
app.use('/api/email', emailRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Initialize WebSocket
initializeWebSocket(server)

// Get network IP
function getNetworkIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

server.listen(PORT, '0.0.0.0', () => {
  const networkIP = getNetworkIP()
  console.log(`API on http://localhost:${PORT}`)
  if (networkIP !== 'localhost') {
    console.log(`API Network: http://${networkIP}:${PORT}`)
  }
  console.log(`WebSocket server initialized`)
})
