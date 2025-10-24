import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { requireRole } from '../auth.js'
import { validateBody, validateQuery, paginationSchema, ticketCreateSchema, ticketUpdateSchema, messageCreateSchema } from '../middleware/validation.js'
import { createTicketLimiter, auditLog } from '../middleware/security.js'
import { notifyTicketCreated, notifyTicketAssigned, notifyTicketUpdated, notifyTicketResolved } from '../services/emailService.js'
import fs from 'fs/promises'

const router = Router()

// Utility functions
async function generateTicketNumber() {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `TK-${timestamp}-${random}`
}

function calculateSLADate(priority) {
  const now = new Date()
  const slaHours = {
    'low': 72,
    'normal': 48,
    'high': 24,
    'urgent': 4
  }
  
  const hours = slaHours[priority] || 48
  return new Date(now.getTime() + (hours * 60 * 60 * 1000)).toISOString()
}

// GET /api/tickets - Enhanced with pagination, filtering, and search
router.get('/', validateQuery(paginationSchema), auditLog('view_tickets'), async (req, res) => {
  try {
    const user = req.user
    const profile = req.profile
    const { page, limit, search, sortBy, sortOrder } = req.validatedQuery
    
    let query = supabaseAdmin.from('tickets')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role),
        assignee:profiles!assigned_to(id, full_name, role),
        department:departments(id, name),
        ticket_messages(count)
      `, { count: 'exact' })
    
    // Role-based filtering
    if (!requireRole(profile, ['admin', 'agent'])) {
      query = query.or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
    }
    
    // Search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    // Filter by query parameters
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }
    if (req.query.priority) {
      query = query.eq('priority', req.query.priority)
    }
    if (req.query.category) {
      query = query.eq('category', req.query.category)
    }
    if (req.query.assigned_to) {
      query = query.eq('assigned_to', req.query.assigned_to)
    }
    if (req.query.department_id) {
      query = query.eq('department_id', req.query.department_id)
    }
    
    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'priority', 'status', 'title']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })
    
    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    if (error) throw error
    
    res.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    res.status(500).json({ error: 'Failed to fetch tickets' })
  }
})

// POST /api/tickets - Enhanced with validation and rate limiting
router.post('/', createTicketLimiter, validateBody(ticketCreateSchema), auditLog('create_ticket'), async (req, res) => {
  try {
    const user = req.user
    const validatedData = req.validatedBody
    
    // Auto-assign logic based on department and workload
    let assignedTo = validatedData.assigned_to
    if (!assignedTo && validatedData.department_id) {
      const { data: agents } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'agent')
        .eq('department_id', validatedData.department_id)
        .limit(1)
      
      if (agents && agents.length > 0) {
        assignedTo = agents[0].id
      }
    }
    
    const payload = {
      ...validatedData,
      status: 'open',
      created_by: user.id,
      assigned_to: assignedTo,
      ticket_number: await generateTicketNumber(),
      sla_due_date: calculateSLADate(validatedData.priority)
    }
    
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert(payload)
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role),
        assignee:profiles!assigned_to(id, full_name, role),
        department:departments(id, name)
      `)
      .single()
      
    if (error) throw error
    
    // Create initial activity log
    await supabaseAdmin.from('ticket_activities').insert({
      ticket_id: data.id,
      user_id: user.id,
      action: 'created',
      details: `Ticket created with priority: ${data.priority}`
    })
    
    // Send email notification
    try {
      const { data: creator } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      if (creator) {
        await notifyTicketCreated(data, creator)
        console.log('✅ Email notification sent for ticket:', data.ticket_number)
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }
    
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating ticket:', error)
    res.status(500).json({ error: 'Failed to create ticket' })
  }
})

// GET /api/tickets/:id - Enhanced with full details
router.get('/:id', auditLog('view_ticket'), async (req, res) => {
  try {
    const id = req.params.id
    const user = req.user
    const profile = req.profile
    
    let query = supabaseAdmin.from('tickets')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role, avatar_url),
        assignee:profiles!assigned_to(id, full_name, role, avatar_url),
        department:departments(id, name),
        ticket_messages(
          id, body, created_at, is_internal, message_type,
          sender:profiles(id, full_name, role, avatar_url)
        ),
        ticket_activities(
          id, action, details, created_at,
          user:profiles(id, full_name, role)
        ),
        attachments:ticket_attachments(
          id, filename, file_size, file_type, file_url, uploaded_by, created_at
        )
      `)
      .eq('id', id)
      .single()
    
    // Check access permissions
    const { data: ticket, error } = await query
    if (error) return res.status(404).json({ error: 'Ticket not found' })
    
    // Role-based access control
    const hasAccess = requireRole(profile, ['admin', 'agent']) ||
                     ticket.created_by === user.id ||
                     ticket.assigned_to === user.id
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    // Filter internal messages for non-staff
    if (!requireRole(profile, ['admin', 'agent'])) {
      ticket.ticket_messages = ticket.ticket_messages.filter(msg => !msg.is_internal)
    }
    
    res.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    res.status(500).json({ error: 'Failed to fetch ticket' })
  }
})

// PATCH /api/tickets/:id - Enhanced with validation and activity tracking
router.patch('/:id', validateBody(ticketUpdateSchema), auditLog('update_ticket'), async (req, res) => {
  try {
    const id = req.params.id
    const user = req.user
    const profile = req.profile
    const updates = req.validatedBody
    
    // Get current ticket
    const { data: currentTicket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    
    // Permission checks
    const canUpdate = requireRole(profile, ['admin', 'agent']) ||
                     (currentTicket.assigned_to === user.id) ||
                     (currentTicket.created_by === user.id && ['title', 'description'].some(field => field in updates))
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    // Update ticket
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role),
        assignee:profiles!assigned_to(id, full_name, role),
        department:departments(id, name)
      `)
      .single()
    
    if (error) throw error
    
    // Log activities for significant changes
    const activities = []
    if (updates.status && updates.status !== currentTicket.status) {
      activities.push({
        ticket_id: id,
        user_id: user.id,
        action: 'status_changed',
        details: `Status changed from ${currentTicket.status} to ${updates.status}`
      })
    }
    
    if (updates.assigned_to && updates.assigned_to !== currentTicket.assigned_to) {
      activities.push({
        ticket_id: id,
        user_id: user.id,
        action: 'assigned',
        details: `Ticket assigned to user ${updates.assigned_to}`
      })
    }
    
    if (updates.priority && updates.priority !== currentTicket.priority) {
      activities.push({
        ticket_id: id,
        user_id: user.id,
        action: 'priority_changed',
        details: `Priority changed from ${currentTicket.priority} to ${updates.priority}`
      })
    }
    
    if (activities.length > 0) {
      await supabaseAdmin.from('ticket_activities').insert(activities)
    }
    
res.json(data)
  } catch (error) {
    console.error('Error updating ticket:', error)
    res.status(500).json({ error: 'Failed to update ticket' })
  }
})

// DELETE /api/tickets/:id - Delete ticket with cleanup
router.delete('/:id', auditLog('delete_ticket'), async (req, res) => {
  try {
    const ticketId = req.params.id
    const user = req.user
    const profile = req.profile

    // Load ticket
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by')
      .eq('id', ticketId)
      .single()

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

    // Admin only can delete tickets
    const canDelete = requireRole(profile, ['admin'])
    if (!canDelete) return res.status(403).json({ error: 'Permission denied' })

    // Delete attachments from disk then DB
    const { data: attachments } = await supabaseAdmin
      .from('ticket_attachments')
      .select('id, file_path')
      .eq('ticket_id', ticketId)

    if (attachments?.length) {
      await Promise.all(attachments.map(a => fs.unlink(a.file_path).catch(()=>{})))
      await supabaseAdmin.from('ticket_attachments').delete().eq('ticket_id', ticketId)
    }

    // Delete messages and activities
    await supabaseAdmin.from('ticket_messages').delete().eq('ticket_id', ticketId)
    await supabaseAdmin.from('ticket_activities').delete().eq('ticket_id', ticketId)

    // Delete ticket
    const { error } = await supabaseAdmin.from('tickets').delete().eq('id', ticketId)
    if (error) throw error

    res.json({ ok: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    res.status(500).json({ error: 'Failed to delete ticket' })
  }
})

// POST /api/tickets/:id/messages - Enhanced with validation
router.post('/:id/messages', validateBody(messageCreateSchema), auditLog('add_message'), async (req, res) => {
  try {
    const ticketId = req.params.id
    const user = req.user
    const profile = req.profile
    const { body, is_internal, message_type } = req.validatedBody
    
    // Check ticket access
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('created_by, assigned_to')
      .eq('id', ticketId)
      .single()
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }
    
    const hasAccess = requireRole(profile, ['admin', 'agent']) ||
                     ticket.created_by === user.id ||
                     ticket.assigned_to === user.id
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    // Only staff can create internal messages
    if (is_internal && !requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Cannot create internal messages' })
    }
    
    const { data, error } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender: user.id,
        body,
        is_internal,
        message_type
      })
      .select(`
        *,
        sender:profiles(id, full_name, role, avatar_url)
      `)
      .single()
    
    if (error) throw error
    
    // Update ticket's last activity
    await supabaseAdmin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)
    
    // Log activity
    await supabaseAdmin.from('ticket_activities').insert({
      ticket_id: ticketId,
      user_id: user.id,
      action: is_internal ? 'internal_note' : 'commented',
      details: `Added ${is_internal ? 'internal note' : 'comment'}`
    })
    
    res.status(201).json(data)
  } catch (error) {
    console.error('Error adding message:', error)
    res.status(500).json({ error: 'Failed to add message' })
  }
})

// Bulk operations
router.patch('/bulk/update', auditLog('bulk_update_tickets'), async (req, res) => {
  try {
    const user = req.user
    const profile = req.profile
    const { ticket_ids, updates } = req.body
    
    if (!requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return res.status(400).json({ error: 'ticket_ids array is required' })
    }
    
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ticket_ids)
      .select('id, title')
    
    if (error) throw error
    
    // Log bulk activity
    await supabaseAdmin.from('ticket_activities').insert(
      ticket_ids.map(ticketId => ({
        ticket_id: ticketId,
        user_id: user.id,
        action: 'bulk_updated',
        details: `Bulk update: ${Object.keys(updates).join(', ')}`
      }))
    )
    
    res.json({ updated_count: data.length, tickets: data })
  } catch (error) {
    console.error('Error bulk updating tickets:', error)
    res.status(500).json({ error: 'Failed to bulk update tickets' })
  }
})

// Analytics endpoints
router.get('/analytics/summary', auditLog('view_analytics'), async (req, res) => {
  try {
    const profile = req.profile
    
    if (!requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    const [ticketStats, priorityStats, statusStats, departmentStats] = await Promise.all([
      // Total tickets
      supabaseAdmin
        .from('tickets')
        .select('id', { count: 'exact', head: true }),
      
      // Priority distribution
      supabaseAdmin
        .from('tickets')
        .select('priority')
        .then(({ data }) => {
          const counts = { low: 0, normal: 0, high: 0, urgent: 0 }
          data?.forEach(ticket => counts[ticket.priority]++)
          return counts
        }),
      
      // Status distribution  
      supabaseAdmin
        .from('tickets')
        .select('status')
        .then(({ data }) => {
          const counts = { open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 }
          data?.forEach(ticket => counts[ticket.status]++)
          return counts
        }),
      
      // Department breakdown
      supabaseAdmin
        .from('tickets')
        .select('department_id, departments(name)')
        .then(({ data }) => {
          const counts = {}
          data?.forEach(ticket => {
            const dept = ticket.departments?.name || 'Unassigned'
            counts[dept] = (counts[dept] || 0) + 1
          })
          return counts
        })
    ])
    
    res.json({
      total_tickets: ticketStats.count,
      priority_distribution: priorityStats,
      status_distribution: statusStats,
      department_distribution: departmentStats,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// SLA status endpoint
router.get('/sla/status', auditLog('view_sla_status'), async (req, res) => {
  try {
    const profile = req.profile
    
    if (!requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    const now = new Date().toISOString()
    
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('id, title, priority, status, sla_due_date, created_at')
      .in('status', ['open', 'in_progress', 'pending'])
      .not('sla_due_date', 'is', null)
    
    if (error) throw error
    
    const slaStatus = {
      overdue: [],
      due_soon: [], // within 2 hours
      on_track: []
    }
    
    tickets?.forEach(ticket => {
      const dueDate = new Date(ticket.sla_due_date)
      const hoursUntilDue = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      
      if (hoursUntilDue < 0) {
        slaStatus.overdue.push(ticket)
      } else if (hoursUntilDue <= 2) {
        slaStatus.due_soon.push(ticket)
      } else {
        slaStatus.on_track.push(ticket)
      }
    })
    
    res.json({
      overdue_count: slaStatus.overdue.length,
      due_soon_count: slaStatus.due_soon.length,
      on_track_count: slaStatus.on_track.length,
      overdue_tickets: slaStatus.overdue,
      due_soon_tickets: slaStatus.due_soon
    })
  } catch (error) {
    console.error('Error fetching SLA status:', error)
    res.status(500).json({ error: 'Failed to fetch SLA status' })
  }
})

export default router
