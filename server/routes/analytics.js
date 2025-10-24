import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { requireRole } from '../auth.js'
import { auditLog } from '../middleware/security.js'

const router = Router()

// Dashboard overview
router.get('/dashboard', auditLog('view_dashboard'), async (req, res) => {
  try {
    const user = req.user
    const profile = req.profile
    
    // Role-based data filtering
    const isStaff = requireRole(profile, ['admin', 'agent'])
    
    const [
      myTicketsCount,
      assignedToMeCount,
      recentTickets,
      urgentTickets,
      overdueTickets
    ] = await Promise.all([
      // My created tickets count
      supabaseAdmin
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id),
      
      // Assigned to me count (for staff)
      isStaff ? supabaseAdmin
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['open', 'in_progress', 'pending']) : { count: 0 },
      
      // Recent tickets
      supabaseAdmin
        .from('tickets')
        .select(`
          id, title, priority, status, created_at,
          creator:profiles!created_by(full_name),
          assignee:profiles!assigned_to(full_name)
        `)
        .or(isStaff ? undefined : `created_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Urgent tickets  
      isStaff ? supabaseAdmin
        .from('tickets')
        .select(`
          id, title, created_at, sla_due_date,
          creator:profiles!created_by(full_name)
        `)
        .eq('priority', 'urgent')
        .in('status', ['open', 'in_progress', 'pending'])
        .order('created_at', { ascending: false })
        .limit(10) : { data: [] },
      
      // Overdue tickets
      isStaff ? supabaseAdmin
        .from('tickets')
        .select(`
          id, title, priority, sla_due_date,
          creator:profiles!created_by(full_name)
        `)
        .lt('sla_due_date', new Date().toISOString())
        .in('status', ['open', 'in_progress', 'pending'])
        .order('sla_due_date', { ascending: true })
        .limit(10) : { data: [] }
    ])
    
    res.json({
      my_tickets_count: myTicketsCount.count,
      assigned_to_me_count: assignedToMeCount.count || 0,
      recent_tickets: recentTickets.data || [],
      urgent_tickets: urgentTickets.data || [],
      overdue_tickets: overdueTickets.data || [],
      is_staff: isStaff
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// Performance metrics
router.get('/performance', auditLog('view_performance'), async (req, res) => {
  try {
    const profile = req.profile
    
    if (!requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    const { timeframe = '30d' } = req.query
    const daysBack = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    const [
      resolutionTime,
      responseTime,
      ticketVolume,
      agentPerformance
    ] = await Promise.all([
      // Average resolution time
      supabaseAdmin
        .from('tickets')
        .select('created_at, updated_at')
        .eq('status', 'resolved')
        .gte('updated_at', startDate.toISOString())
        .then(({ data }) => {
          if (!data || data.length === 0) return 0
          const totalHours = data.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.updated_at)
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          }, 0)
          return Math.round(totalHours / data.length * 100) / 100
        }),
      
      // Average first response time
      supabaseAdmin
        .from('ticket_messages')
        .select(`
          created_at,
          ticket:tickets(created_at, created_by),
          sender
        `)
        .gte('created_at', startDate.toISOString())
        .then(async ({ data: messages }) => {
          if (!messages) return 0
          
          // Get staff user IDs
          const { data: staff } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'agent'])
          
          const staffIds = new Set(staff?.map(s => s.id) || [])
          
          const firstResponses = []
          const ticketFirstResponse = new Map()
          
          messages.forEach(msg => {
            if (staffIds.has(msg.sender) && !ticketFirstResponse.has(msg.ticket.id)) {
              if (msg.sender !== msg.ticket.created_by) {
                const responseTime = (new Date(msg.created_at).getTime() - new Date(msg.ticket.created_at).getTime()) / (1000 * 60 * 60)
                firstResponses.push(responseTime)
                ticketFirstResponse.set(msg.ticket.id, true)
              }
            }
          })
          
          if (firstResponses.length === 0) return 0
          return Math.round(firstResponses.reduce((sum, time) => sum + time, 0) / firstResponses.length * 100) / 100
        }),
      
      // Daily ticket volume
      supabaseAdmin
        .from('tickets')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .then(({ data }) => {
          const dailyCounts = {}
          data?.forEach(ticket => {
            const day = ticket.created_at.split('T')[0]
            dailyCounts[day] = (dailyCounts[day] || 0) + 1
          })
          return dailyCounts
        }),
      
      // Agent performance
      supabaseAdmin
        .from('tickets')
        .select(`
          assigned_to, status,
          assignee:profiles!assigned_to(full_name)
        `)
        .not('assigned_to', 'is', null)
        .gte('updated_at', startDate.toISOString())
        .then(({ data }) => {
          const agentStats = {}
          data?.forEach(ticket => {
            const agentId = ticket.assigned_to
            const agentName = ticket.assignee?.full_name || 'Unknown'
            
            if (!agentStats[agentId]) {
              agentStats[agentId] = {
                name: agentName,
                total: 0,
                resolved: 0,
                in_progress: 0
              }
            }
            
            agentStats[agentId].total++
            if (ticket.status === 'resolved') {
              agentStats[agentId].resolved++
            } else if (ticket.status === 'in_progress') {
              agentStats[agentId].in_progress++
            }
          })
          
          return Object.values(agentStats).map(stats => ({
            ...stats,
            resolution_rate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
          }))
        })
    ])
    
    res.json({
      timeframe,
      avg_resolution_time_hours: resolutionTime,
      avg_first_response_time_hours: responseTime,
      daily_ticket_volume: ticketVolume,
      agent_performance: agentPerformance
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    res.status(500).json({ error: 'Failed to fetch performance metrics' })
  }
})

// Trend analysis
router.get('/trends', auditLog('view_trends'), async (req, res) => {
  try {
    const profile = req.profile
    
    if (!requireRole(profile, ['admin', 'agent'])) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    const { period = 'weekly' } = req.query
    const isWeekly = period === 'weekly'
    const daysBack = isWeekly ? 28 : 90 // 4 weeks or 3 months
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('created_at, priority, status, department_id, departments(name)')
      .gte('created_at', startDate.toISOString())
    
    // Group tickets by time period
    const trends = {}
    const priorityTrends = {}
    const departmentTrends = {}
    
    tickets?.forEach(ticket => {
      const date = new Date(ticket.created_at)
      let periodKey
      
      if (isWeekly) {
        // Get week start (Monday)
        const weekStart = new Date(date)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        periodKey = weekStart.toISOString().split('T')[0]
      } else {
        // Monthly
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      // Overall trends
      if (!trends[periodKey]) {
        trends[periodKey] = { created: 0, resolved: 0, open: 0 }
      }
      trends[periodKey].created++
      if (ticket.status === 'resolved') trends[periodKey].resolved++
      if (ticket.status === 'open') trends[periodKey].open++
      
      // Priority trends
      if (!priorityTrends[periodKey]) {
        priorityTrends[periodKey] = { low: 0, normal: 0, high: 0, urgent: 0 }
      }
      priorityTrends[periodKey][ticket.priority]++
      
      // Department trends
      const dept = ticket.departments?.name || 'Unassigned'
      if (!departmentTrends[periodKey]) {
        departmentTrends[periodKey] = {}
      }
      departmentTrends[periodKey][dept] = (departmentTrends[periodKey][dept] || 0) + 1
    })
    
    res.json({
      period,
      overall_trends: trends,
      priority_trends: priorityTrends,
      department_trends: departmentTrends
    })
  } catch (error) {
    console.error('Error fetching trends:', error)
    res.status(500).json({ error: 'Failed to fetch trends data' })
  }
})

// Analytics summary endpoint
router.get('/summary', auditLog('view_analytics_summary'), async (req, res) => {
  try {
    const profile = req.profile
    const isStaff = requireRole(profile, ['admin', 'agent'])
    
    if (!isStaff) {
      return res.status(403).json({ error: 'Permission denied' })
    }
    
    const [
      totalTickets,
      priorityDistribution,
      statusDistribution,
      departmentDistribution,
      recentActivity
    ] = await Promise.all([
      // Total tickets count
      supabaseAdmin
        .from('tickets')
        .select('id', { count: 'exact', head: true }),
      
      // Priority distribution
      supabaseAdmin
        .from('tickets')
        .select('priority')
        .then(({ data }) => {
          const distribution = { low: 0, normal: 0, high: 0, urgent: 0 }
          data?.forEach(ticket => {
            if (distribution.hasOwnProperty(ticket.priority)) {
              distribution[ticket.priority]++
            }
          })
          return distribution
        }),
      
      // Status distribution
      supabaseAdmin
        .from('tickets')
        .select('status')
        .then(({ data }) => {
          const distribution = { open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 }
          data?.forEach(ticket => {
            if (distribution.hasOwnProperty(ticket.status)) {
              distribution[ticket.status]++
            }
          })
          return distribution
        }),
      
      // Department distribution
      supabaseAdmin
        .from('tickets')
        .select(`
          department_id,
          department:departments(name)
        `)
        .then(({ data }) => {
          const distribution = {}
          data?.forEach(ticket => {
            const deptName = ticket.department?.name || 'Unassigned'
            distribution[deptName] = (distribution[deptName] || 0) + 1
          })
          return distribution
        }),
      
      // Recent activity (last 7 days)
      supabaseAdmin
        .from('tickets')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ data }) => {
          const activity = {}
          data?.forEach(ticket => {
            const day = ticket.created_at.split('T')[0]
            activity[day] = (activity[day] || 0) + 1
          })
          return activity
        })
    ])
    
    res.json({
      total_tickets: totalTickets.count,
      priority_distribution: priorityDistribution,
      status_distribution: statusDistribution,
      department_distribution: departmentDistribution,
      recent_activity: recentActivity
    })
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    res.status(500).json({ error: 'Failed to fetch analytics summary' })
  }
})

export default router
