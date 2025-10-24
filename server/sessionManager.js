// Server session manager - tracks server restarts
// Generates a unique session ID when server starts

let serverSessionId = null

export function initializeServerSession() {
  // Generate unique session ID on server start
  serverSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
  console.log('🔐 Server session initialized:', serverSessionId)
  return serverSessionId
}

export function getServerSessionId() {
  if (!serverSessionId) {
    serverSessionId = initializeServerSession()
  }
  return serverSessionId
}
