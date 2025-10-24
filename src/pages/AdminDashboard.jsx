import React from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { api } from '../lib/api.js'
import { useUserRole } from '../hooks/useUserRole.js'
import '../styles/design-system.css'
import '../styles/admin-dashboard.css'

// Dashboard Icons
const DashboardIcons = {
  Tickets: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 11-0-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Clock: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

export default function AdminDashboard() {
  const { isAdmin } = useUserRole()
  const [stats, setStats] = React.useState({
    totalTickets: 0,
    openTickets: 0,
    urgentTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0,
    avgResponseTime: '0h'
  })
  const [recentTickets, setRecentTickets] = React.useState([])
  const [recentActivity, setRecentActivity] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      

      // Fetch ticket statistics
      const { data: allTickets } = await supabase.from('tickets').select('*')
      const { data: openTickets } = await supabase.from('tickets').select('id').eq('status', 'open')
      const { data: urgentTickets } = await supabase.from('tickets').select('id').eq('priority', 'urgent')
      const { data: resolvedTickets } = await supabase.from('tickets').select('id').eq('status', 'resolved')
      
      // Fetch user count
      const { data: users } = await supabase.from('profiles').select('id')
      
      // Fetch recent tickets with creator info
      const { data: recent } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setStats({
        totalTickets: allTickets?.length || 0,
        openTickets: openTickets?.length || 0,
        urgentTickets: urgentTickets?.length || 0,
        resolvedTickets: resolvedTickets?.length || 0,
        totalUsers: users?.length || 0,
        avgResponseTime: 'N/A'
      })
      
      setRecentTickets(recent || [])
      
      // No activity data for now - could be implemented with real audit logs
      setRecentActivity([])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, change, changeType, variant = 'primary' }) => (
    <div className={`stat-card ${variant} fade-in-up hover-lift`}>
      <div className={`stat-icon ${variant}`}>
        <Icon />
      </div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeType}`}>
          {changeType === 'positive' ? '+' : ''}{change}%
        </div>
      )}
    </div>
  )

  const QuickActionCard = ({ title, description, icon: Icon, to, color }) => (
    <Link to={to} className="quick-action-card hover-lift">
      <div className="quick-action-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: 'white' }}>
        <Icon />
      </div>
      <h3 className="quick-action-title">{title}</h3>
      <p className="quick-action-description">{description}</p>
    </Link>
  )

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'var(--info)'
      case 'in_progress': return 'var(--warning)'
      case 'resolved': return 'var(--success)'
      case 'closed': return 'var(--text-muted)'
      default: return 'var(--text-secondary)'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'var(--danger)'
      case 'high': return 'var(--warning)'
      case 'normal': return 'var(--info)'
      case 'low': return 'var(--success)'
      default: return 'var(--text-secondary)'
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <div className="loading-text">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container admin-dashboard fade-in">
      {/* Enhanced Header */}
      <div className="admin-header">
        <div className="flex between">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Welcome back! Here's what's happening with your support system.</p>
          </div>
          <Link to="/tickets" className="btn primary lg hover-glow">
            <DashboardIcons.Tickets />
            View All Tickets
          </Link>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Tickets" 
          value={stats.totalTickets} 
          icon={DashboardIcons.Tickets} 
          variant="primary"
          change={12}
          changeType="positive"
        />
        <StatCard 
          title="Open Tickets" 
          value={stats.openTickets} 
          icon={DashboardIcons.AlertCircle} 
          variant="warning"
          change={-5}
          changeType="negative"
        />
        <StatCard 
          title="Urgent Tickets" 
          value={stats.urgentTickets} 
          icon={DashboardIcons.TrendingUp} 
          variant="danger"
          change={3}
          changeType="positive"
        />
        <StatCard 
          title="Resolved Today" 
          value={stats.resolvedTickets} 
          icon={DashboardIcons.CheckCircle} 
          variant="success"
          change={8}
          changeType="positive"
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={DashboardIcons.Users} 
          variant="info"
          change={2}
          changeType="positive"
        />
        <StatCard 
          title="Avg Response Time" 
          value={stats.avgResponseTime} 
          icon={DashboardIcons.Clock} 
          variant="primary"
          change={-15}
          changeType="positive"
        />
      </div>

      {/* Enhanced Quick Actions */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">Quick Actions</h2>
          <p className="dashboard-card-subtitle">Common administrative tasks</p>
        </div>
        <div className="dashboard-card-content">
          <div className="quick-actions-grid">
            <QuickActionCard 
              title="Manage Users" 
              description="Create and manage teacher accounts"
              icon={DashboardIcons.Users}
              to="/admin/users"
              color="var(--primary-600)"
            />
            <QuickActionCard 
              title="View All Tickets" 
              description="Browse and manage all support tickets"
              icon={DashboardIcons.Tickets}
              to="/tickets"
              color="var(--success-600)"
            />
            <QuickActionCard 
              title="System Settings" 
              description="Configure system preferences"
              icon={DashboardIcons.Settings}
              to="/settings"
              color="var(--warning-600)"
            />
            <QuickActionCard 
              title="Reports" 
              description="View system analytics and reports"
              icon={DashboardIcons.TrendingUp}
              to="/admin/reports"
              color="var(--primary-500)"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Recent Sections */}
      <div className="recent-section">
        {/* Recent Tickets */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="flex between">
              <div>
                <h3 className="dashboard-card-title">Recent Tickets</h3>
                <p className="dashboard-card-subtitle">Latest support requests</p>
              </div>
              <Link to="/tickets" className="btn ghost sm">View All</Link>
            </div>
          </div>
          <div className="dashboard-card-content">
            {recentTickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {recentTickets.map(ticket => (
                  <div key={ticket.id} className="recent-item">
                    <div className="flex between">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/tickets/${ticket.id}`} className="recent-ticket-title">
                          {ticket.title}
                        </Link>
                        <div className="recent-ticket-meta">
                          by {ticket.profiles?.full_name || 'Unknown'} • {formatTimeAgo(ticket.created_at)}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn ghost sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={async () => {
                            if (!window.confirm('Delete this ticket?')) return
                            try {
                              await api(`/tickets/${ticket.id}`, { method: 'DELETE' })
                              await fetchDashboardData()
                            } catch (e) {
                              alert(e.message || 'Failed to delete ticket')
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="recent-ticket-badges">
                      <span className={`status-badge ${ticket.status.replace('_', '-')}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`priority-badge ${ticket.priority}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <DashboardIcons.Tickets />
                </div>
                <h4 className="empty-state-title">No recent tickets</h4>
                <p className="empty-state-description">New support tickets will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Recent Activity</h3>
            <p className="dashboard-card-subtitle">System activity timeline</p>
          </div>
          <div className="dashboard-card-content">
            <div>
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-dot ${activity.type}`}></div>
                  <div className="activity-content">
                    <div className="activity-action">
                      {activity.action}
                    </div>
                    <div className="activity-meta">
                      {activity.user} • {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
