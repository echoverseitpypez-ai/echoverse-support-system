import { Server as SocketIOServer } from 'socket.io'
import { supabaseAdmin } from './supabase.js'
import { getUserFromRequest, getProfile, requireRole } from './auth.js'

let io = null

export function initializeWebSocket(server) {
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ["http://localhost:3000"]
    
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      // Create a mock request object for getUserFromRequest
      const mockReq = {
        headers: { authorization: `Bearer ${token}` }
      }

      const user = await getUserFromRequest(mockReq)
      if (!user) {
        return next(new Error('Authentication error'))
      }

      const profile = await getProfile(user.id)
      socket.user = user
      socket.profile = profile

      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected via WebSocket`)

    // Join user-specific room
    socket.join(`user_${socket.user.id}`)

    // Join role-based rooms
    if (requireRole(socket.profile, ['admin', 'agent'])) {
      socket.join('staff')
      if (socket.profile.role === 'admin') {
        socket.join('admin')
      }
    }

    // Join department room if user has a department
    if (socket.profile.department_id) {
      socket.join(`department_${socket.profile.department_id}`)
    }

    // Handle joining ticket rooms
    socket.on('join_ticket', async (ticketId) => {
      try {
        // Verify user has access to this ticket
        const { data: ticket } = await supabaseAdmin
          .from('tickets')
          .select('created_by, assigned_to')
          .eq('id', ticketId)
          .single()

        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' })
          return
        }

        const hasAccess = requireRole(socket.profile, ['admin', 'agent']) ||
                         ticket.created_by === socket.user.id ||
                         ticket.assigned_to === socket.user.id

        if (hasAccess) {
          socket.join(`ticket_${ticketId}`)
          socket.emit('joined_ticket', { ticketId })
        } else {
          socket.emit('error', { message: 'Access denied' })
        }
      } catch (error) {
        console.error('Error joining ticket room:', error)
        socket.emit('error', { message: 'Failed to join ticket' })
      }
    })

    // Handle leaving ticket rooms
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`)
      socket.emit('left_ticket', { ticketId })
    })

    // Handle typing indicators
    socket.on('typing_start', ({ ticketId }) => {
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.profile.full_name,
        ticketId
      })
    })

    socket.on('typing_stop', ({ ticketId }) => {
      socket.to(`ticket_${ticketId}`).emit('user_stopped_typing', {
        userId: socket.user.id,
        ticketId
      })
    })

    // Handle user presence
    socket.on('update_presence', (status) => {
      socket.broadcast.emit('user_presence_updated', {
        userId: socket.user.id,
        status,
        timestamp: new Date().toISOString()
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected from WebSocket`)
      
      // Broadcast that user went offline
      socket.broadcast.emit('user_presence_updated', {
        userId: socket.user.id,
        status: 'offline',
        timestamp: new Date().toISOString()
      })
    })
  })

  return io
}

// Utility functions to emit events from REST endpoints

export function notifyTicketUpdate(ticketId, update, updatedBy) {
  if (!io) return

  io.to(`ticket_${ticketId}`).emit('ticket_updated', {
    ticketId,
    update,
    updatedBy,
    timestamp: new Date().toISOString()
  })
}

export function notifyNewMessage(ticketId, message, sender) {
  if (!io) return

  io.to(`ticket_${ticketId}`).emit('new_message', {
    ticketId,
    message,
    sender,
    timestamp: new Date().toISOString()
  })
}

export function notifyTicketAssigned(ticketId, assignedTo, assignedBy) {
  if (!io) return

  // Notify the assigned user
  io.to(`user_${assignedTo}`).emit('ticket_assigned', {
    ticketId,
    assignedBy,
    timestamp: new Date().toISOString()
  })

  // Notify ticket watchers
  io.to(`ticket_${ticketId}`).emit('ticket_updated', {
    ticketId,
    update: { assigned_to: assignedTo },
    updatedBy: assignedBy,
    timestamp: new Date().toISOString()
  })
}

export function notifyTicketCreated(ticket, createdBy) {
  if (!io) return

  // Notify staff about new ticket
  io.to('staff').emit('new_ticket', {
    ticket,
    createdBy,
    timestamp: new Date().toISOString()
  })

  // Notify department if ticket has one
  if (ticket.department_id) {
    io.to(`department_${ticket.department_id}`).emit('new_ticket', {
      ticket,
      createdBy,
      timestamp: new Date().toISOString()
    })
  }
}

export function notifyNewNotification(userId, notification) {
  if (!io) return

  io.to(`user_${userId}`).emit('new_notification', {
    notification,
    timestamp: new Date().toISOString()
  })
}

export function notifySLABreach(ticketId, ticket, breachType) {
  if (!io) return

  // Notify admins about SLA breach
  io.to('admin').emit('sla_breach', {
    ticketId,
    ticket,
    breachType, // 'response_time' or 'resolution_time'
    timestamp: new Date().toISOString()
  })

  // Notify assigned agent if any
  if (ticket.assigned_to) {
    io.to(`user_${ticket.assigned_to}`).emit('sla_breach', {
      ticketId,
      ticket,
      breachType,
      timestamp: new Date().toISOString()
    })
  }
}

export function notifyBulkUpdate(ticketIds, updates, updatedBy) {
  if (!io) return

  // Notify each ticket room
  ticketIds.forEach(ticketId => {
    io.to(`ticket_${ticketId}`).emit('ticket_updated', {
      ticketId,
      update: updates,
      updatedBy,
      isBulkUpdate: true,
      timestamp: new Date().toISOString()
    })
  })
}

export function notifyFileUploaded(ticketId, attachments, uploadedBy) {
  if (!io) return

  io.to(`ticket_${ticketId}`).emit('files_uploaded', {
    ticketId,
    attachments,
    uploadedBy,
    timestamp: new Date().toISOString()
  })
}

// Broadcast system announcements
export function broadcastSystemAnnouncement(message, type = 'info', targetRole = null) {
  if (!io) return

  const announcement = {
    message,
    type,
    timestamp: new Date().toISOString()
  }

  if (targetRole) {
    io.to(targetRole).emit('system_announcement', announcement)
  } else {
    io.emit('system_announcement', announcement)
  }
}

// Get online users count
export function getOnlineUsersCount() {
  if (!io) return 0
  return io.sockets.sockets.size
}

// Get users in a specific room
export function getUsersInRoom(roomName) {
  if (!io) return []
  const room = io.sockets.adapter.rooms.get(roomName)
  return room ? Array.from(room) : []
}