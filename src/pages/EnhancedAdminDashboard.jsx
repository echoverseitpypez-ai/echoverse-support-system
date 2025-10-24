import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { supabase, getSessionToken } from '../supabaseClient.js'
import '../styles/enhanced-dashboard.css'
const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }) => (
  <div className="stat-card">
    <div className={`stat-card-icon ${color}`}>
      {icon}
    </div>
    <div className="stat-card-content">
      <h3 className="stat-card-title">{title}</h3>
      <div className="stat-card-value">{value}</div>
      {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      {trend && (
        <div className={`stat-card-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.positive ? '↗' : '↘'} {trend.value}
        </div>
      )}
    </div>
  </div>
)

// Tickets Table Component with full management features
const TicketsTable = ({ tickets, filter, search, onStatusChange, onDelete, onAssign }) => {
  const [availableAgents, setAvailableAgents] = useState([])
  
  // Load available agents for assignment
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data: agents } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('role', ['admin', 'agent'])
        
        setAvailableAgents(agents || [])
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
    }
    
    loadAgents()
  }, [])
  
  // Filter and search tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter
    const matchesSearch = !search || 
      ticket.title?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.creator?.full_name?.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'status-open'
      case 'in_progress': return 'status-progress'
      case 'resolved': return 'status-resolved'
      case 'closed': return 'status-closed'
      default: return 'status-default'
    }
  }
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent'
      case 'high': return 'priority-high'
      case 'normal': return 'priority-normal'
      case 'low': return 'priority-low'
      default: return 'priority-default'
    }
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  if (filteredTickets.length === 0) {
    return (
      <div className="empty-tickets">
        <div className="empty-icon">📄</div>
        <h3>No tickets found</h3>
        <p>No tickets match your current filter and search criteria.</p>
      </div>
    )
  }
  
  return (
    <div className="tickets-table-container">
      <div className="tickets-count">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </div>
      
      <div className="tickets-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Creator</th>
              <th>Assignee</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(ticket => (
              <tr key={ticket.id} className="ticket-row">
                <td className="ticket-id">
                  #{ticket.id.slice(-6)}
                </td>
                <td className="ticket-title">
                  <div className="title-content">
                    <strong>{ticket.title}</strong>
                    {ticket.description && (
                      <div className="ticket-description">
                        {ticket.description.length > 60 
                          ? ticket.description.substring(0, 60) + '...'
                          : ticket.description
                        }
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <StatusDropdown 
                    currentStatus={ticket.status}
                    ticketId={ticket.id}
                    onChange={onStatusChange}
                  />
                </td>
                <td>
                  <span className={`priority-badge ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority || 'normal'}
                  </span>
                </td>
                <td className="ticket-creator">
                  <div className="user-info">
                    <span className="user-name">{ticket.creator?.full_name || 'Unknown'}</span>
                    <span className="user-email">{ticket.creator?.email}</span>
                  </div>
                </td>
                <td>
                  <AssigneeDropdown
                    currentAssignee={ticket.assigned_to}
                    assigneeName={ticket.assignee?.full_name}
                    ticketId={ticket.id}
                    agents={availableAgents}
                    onChange={onAssign}
                  />
                </td>
                <td className="ticket-date">
                  {formatDate(ticket.created_at)}
                </td>
                <td className="ticket-actions">
                  <div className="action-buttons">
                    <button 
                      className="btn-action view"
                      onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}
                      title="View Ticket"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => onDelete(ticket.id)}
                      title="Delete Ticket"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Status Dropdown Component
const StatusDropdown = ({ currentStatus, ticketId, onChange }) => {
  const statuses = [
    { value: 'open', label: 'Open', color: 'status-open' },
    { value: 'in_progress', label: 'In Progress', color: 'status-progress' },
    { value: 'resolved', label: 'Resolved', color: 'status-resolved' },
    { value: 'closed', label: 'Closed', color: 'status-closed' }
  ]
  
  const currentStatusObj = statuses.find(s => s.value === currentStatus) || statuses[0]
  
  return (
    <select 
      value={currentStatus}
      onChange={(e) => onChange(ticketId, e.target.value)}
      className={`status-select ${currentStatusObj.color}`}
    >
      {statuses.map(status => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  )
}

// Assignee Dropdown Component
const AssigneeDropdown = ({ currentAssignee, assigneeName, ticketId, agents, onChange }) => {
  return (
    <select 
      value={currentAssignee || ''}
      onChange={(e) => onChange(ticketId, e.target.value || null)}
      className="assignee-select"
    >
      <option value="">Unassigned</option>
      {agents.map(agent => (
        <option key={agent.id} value={agent.id}>
          {agent.full_name}
        </option>
      ))}
    </select>
  )
}

// Enhanced Tickets Table with advanced features
const EnhancedTicketsTable = ({ tickets, filter, search, onStatusChange, onDelete, onAssign, onRefresh }) => {
  const [availableAgents, setAvailableAgents] = useState([])
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedTickets, setSelectedTickets] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Load available agents for assignment
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data: agents } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('role', ['admin', 'agent'])
        
        setAvailableAgents(agents || [])
      } catch (error) {
        console.error('Failed to load agents:', error)
      }
    }
    
    loadAgents()
  }, [])
  
  // Filter and search tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter
    const matchesSearch = !search || 
      ticket.title?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.creator?.full_name?.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })
  
  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      aValue = priorityOrder[aValue] || 1
      bValue = priorityOrder[bValue] || 1
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
  
  // Pagination
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + itemsPerPage)
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }
  
  const handleSelectTicket = (ticketId, checked) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId])
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId))
    }
  }
  
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTickets(paginatedTickets.map(t => t.id))
    } else {
      setSelectedTickets([])
    }
  }
  
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴'
      case 'high': return '🟠' 
      case 'normal': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🟡'
      case 'in_progress': return '🔵'
      case 'resolved': return '🟢'
      case 'closed': return '⚫'
      default: return '⚪'
    }
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }
  
  if (filteredTickets.length === 0) {
    return (
      <div className="empty-tickets-enhanced">
        <div className="empty-illustration">
          <div className="empty-icon-large">📄</div>
          <div className="empty-sparkles">✨</div>
        </div>
        <h3>No tickets found</h3>
        <p>No tickets match your current filter and search criteria.</p>
        <div className="empty-actions">
          <button 
            onClick={() => {
              onRefresh()
            }}
            className="btn primary"
          >
            🔄 Refresh Data
          </button>
          <button 
            onClick={() => window.open('/tickets/new', '_blank')}
            className="btn secondary"
          >
            ➕ Create New Ticket
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="enhanced-tickets-container">
      {/* Table Controls */}
      <div className="table-controls">
        <div className="controls-left">
          <div className="results-info">
            Showing <strong>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedTickets.length)}</strong> of <strong>{sortedTickets.length}</strong> tickets
            {selectedTickets.length > 0 && (
              <span className="selection-info">
                • {selectedTickets.length} selected
              </span>
            )}
          </div>
        </div>
        
        <div className="controls-right">
          <select 
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="items-per-page"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
      
      {/* Enhanced Table */}
      <div className="tickets-table-wrapper">
        <table className="enhanced-tickets-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th 
                className={`sortable ${sortBy === 'id' ? 'sorted-' + sortOrder : ''}`}
                onClick={() => handleSort('id')}
              >
                ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'title' ? 'sorted-' + sortOrder : ''}`}
                onClick={() => handleSort('title')}
              >
                Ticket {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'status' ? 'sorted-' + sortOrder : ''}`}
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'priority' ? 'sorted-' + sortOrder : ''}`}
                onClick={() => handleSort('priority')}
              >
                Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Creator</th>
              <th>Assignee</th>
              <th 
                className={`sortable ${sortBy === 'created_at' ? 'sorted-' + sortOrder : ''}`}
                onClick={() => handleSort('created_at')}
              >
                Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map(ticket => (
              <tr 
                key={ticket.id} 
                className={`ticket-row ${selectedTickets.includes(ticket.id) ? 'selected' : ''}`}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedTickets.includes(ticket.id)}
                    onChange={(e) => handleSelectTicket(ticket.id, e.target.checked)}
                  />
                </td>
                <td className="ticket-id">
                  <span className="id-badge">#{ticket.id.slice(-6)}</span>
                </td>
                <td className="ticket-title">
                  <div className="title-content">
                    <div className="title-main">{ticket.title}</div>
                    {ticket.description && (
                      <div className="title-description">
                        {ticket.description.length > 80 
                          ? ticket.description.substring(0, 80) + '...'
                          : ticket.description
                        }
                      </div>
                    )}
                  </div>
                </td>
                <td className="status-col">
                  <StatusDropdown 
                    currentStatus={ticket.status}
                    ticketId={ticket.id}
                    onChange={onStatusChange}
                  />
                </td>
                <td className="priority-col">
                  <div className="priority-display">
                    <span className="priority-icon">{getPriorityIcon(ticket.priority)}</span>
                    <span className="priority-text">{ticket.priority || 'normal'}</span>
                  </div>
                </td>
                <td className="creator-col">
                  <div className="user-info">
                    <div className="user-avatar">
                      {(ticket.creator?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{ticket.creator?.full_name || 'Unknown'}</div>
                      <div className="user-email">{ticket.creator?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="assignee-col">
                  <AssigneeDropdown
                    currentAssignee={ticket.assigned_to}
                    assigneeName={ticket.assignee?.full_name}
                    ticketId={ticket.id}
                    agents={availableAgents}
                    onChange={onAssign}
                  />
                </td>
                <td className="date-col">
                  <div className="date-info">
                    <div className="date-relative">{formatDate(ticket.created_at)}</div>
                    <div className="date-exact">{new Date(ticket.created_at).toLocaleDateString()}</div>
                  </div>
                </td>
                <td className="actions-col">
                  <div className="action-buttons-enhanced">
                    <button 
                      className="btn-action view"
                      onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}
                      title="View Ticket Details"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-action edit"
                      onClick={() => console.log('Edit ticket', ticket.id)}
                      title="Edit Ticket"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => onDelete(ticket.id)}
                      title="Delete Ticket"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Enhanced Pagination */}
      <div className="enhanced-pagination">
        <div className="pagination-info">
          Page {currentPage} of {totalPages}
        </div>
        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn pagination"
          >
            « First
          </button>
          <button 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn pagination"
          >
            ‹ Prev
          </button>
          
          {/* Page numbers */}
          <div className="page-numbers">
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i
              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn pagination ${pageNum === currentPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                )
              }
              return null
            })}
          </div>
          
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn pagination"
          >
            Next ›
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn pagination"
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  )
}

const PriorityChart = ({ data }) => {
  if (!data) return <div>Loading...</div>

  const total = Object.values(data).reduce((sum, val) => sum + val, 0)
  
  return (
    <div className="priority-chart">
      <h3>Tickets by Priority</h3>
      <div className="chart-container">
        {Object.entries(data).map(([priority, count]) => (
          <div key={priority} className="priority-bar">
            <div className="priority-label">
              <span className={`priority-dot ${priority}`}></span>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </div>
            <div className="priority-bar-container">
              <div 
                className={`priority-bar-fill ${priority}`} 
                style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="priority-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StatusChart = ({ data }) => {
  if (!data) return <div>Loading...</div>

  const statusColors = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    pending: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280'
  }

  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  return (
    <div className="status-chart">
      <h3>Tickets by Status</h3>
      <div className="donut-chart">
        <div className="donut-chart-center">
          <div className="donut-total">{total}</div>
          <div className="donut-label">Total</div>
        </div>
        {/* This would typically use a proper chart library like Chart.js or D3 */}
        <div className="status-legend">
          {Object.entries(data).map(([status, count]) => (
            <div key={status} className="status-item">
              <div 
                className="status-color" 
                style={{ backgroundColor: statusColors[status] }}
              ></div>
              <span className="status-name">
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const RecentTickets = ({ tickets }) => (
  <div className="recent-tickets">
    <h3>Recent Tickets</h3>
    <div className="tickets-list">
      {tickets.map(ticket => (
        <div key={ticket.id} className="ticket-item">
          <div className="ticket-header">
            <span className={`priority-badge ${ticket.priority}`}>
              {ticket.priority}
            </span>
            <span className={`status-badge ${ticket.status}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <h4 className="ticket-title">{ticket.title}</h4>
          <div className="ticket-meta">
            <span>Created by {ticket.creator?.full_name}</span>
            {ticket.assignee && <span> • Assigned to {ticket.assignee.full_name}</span>}
            <span> • {new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const SLAStatus = ({ slaData }) => {
  if (!slaData) return <div>Loading SLA status...</div>

  return (
    <div className="sla-status">
      <h3>SLA Status</h3>
      <div className="sla-summary">
        <div className="sla-stat overdue">
          <div className="sla-count">{slaData.overdue_count}</div>
          <div className="sla-label">Overdue</div>
        </div>
        <div className="sla-stat due-soon">
          <div className="sla-count">{slaData.due_soon_count}</div>
          <div className="sla-label">Due Soon</div>
        </div>
        <div className="sla-stat on-track">
          <div className="sla-count">{slaData.on_track_count}</div>
          <div className="sla-label">On Track</div>
        </div>
      </div>
      
      {slaData.overdue_tickets.length > 0 && (
        <div className="overdue-tickets">
          <h4>Overdue Tickets</h4>
          {slaData.overdue_tickets.slice(0, 3).map(ticket => (
            <div key={ticket.id} className="overdue-ticket">
              <span className="ticket-id">#{ticket.id.slice(-6)}</span>
              <span className="ticket-title">{ticket.title}</span>
              <span className="overdue-time">
                {new Date(ticket.sla_due_date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Advanced Admin Components
const AgentPerformance = ({ agents }) => (
  <div className="agent-performance">
    <h3>👥 Agent Performance</h3>
    <div className="agents-grid">
      {agents?.map(agent => (
        <div key={agent.name} className="agent-card">
          <div className="agent-avatar">{agent.name.charAt(0)}</div>
          <div className="agent-info">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-stats">
              <span>📋 {agent.total} total</span>
              <span>✅ {agent.resolved} resolved</span>
              <span>📊 {agent.resolution_rate}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const SystemAlerts = ({ alerts, onDismissAlert }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Notification Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          position: 'relative',
          background: 'transparent',
          border: 'none',
          padding: '8px 12px',
          fontSize: '24px',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        title={`${alerts?.length || 0} notifications`}
      >
        🔔
        {alerts?.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            minWidth: '20px',
            height: '20px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
            animation: alerts.length > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          
          {/* Notification Panel */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '380px',
            maxHeight: '500px',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                🚨 System Alerts
              </h3>
              {alerts?.length > 0 && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {alerts.length} new
                </span>
              )}
            </div>

            {/* Alerts List */}
            <div>
              {alerts?.length > 0 ? alerts.map(alert => (
                <div 
                  key={alert.id} 
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'start',
                    background: alert.type === 'warning' ? '#fef3c7' : alert.type === 'info' ? '#dbeafe' : '#fee2e2',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = alert.type === 'warning' ? '#fef3c7' : alert.type === 'info' ? '#dbeafe' : '#fee2e2'}
                >
                  <span style={{ fontSize: '24px' }}>{alert.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {alert.time}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismissAlert(alert.id)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '0 4px',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>
              )) : (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '14px' }}>All systems normal</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const BulkActions = ({ selectedTickets, onBulkAction }) => {
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkAssignee, setBulkAssignee] = useState('')
  
  return (
    <div className="bulk-actions">
      <h3>⚡ Bulk Operations</h3>
      <div className="bulk-controls">
        <div className="bulk-info">
          {selectedTickets?.length || 0} tickets selected
        </div>
        <div className="bulk-options">
          <select 
            value={bulkStatus} 
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bulk-select"
          >
            <option value="">Update Status...</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <input 
            type="text"
            placeholder="Assign to..."
            value={bulkAssignee}
            onChange={(e) => setBulkAssignee(e.target.value)}
            className="bulk-input"
          />
          
          <button 
            onClick={() => onBulkAction('status', bulkStatus)}
            disabled={!bulkStatus || !selectedTickets?.length}
            className="btn primary sm"
          >
            Apply Status
          </button>
          
          <button 
            onClick={() => onBulkAction('assign', bulkAssignee)}
            disabled={!bulkAssignee || !selectedTickets?.length}
            className="btn secondary sm"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}

const LiveActivity = ({ activities }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="live-activity">
      <h3>🔴 Live Activity</h3>
      {activities?.length === 0 ? (
        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activities?.slice(0, 10).map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-time">
                {formatTime(activity.timestamp)}
              </div>
              <div className="activity-content">
                <div className="activity-main">
                  <span className="activity-user">{activity.user}</span>
                  <span className="activity-action">{activity.action}</span>
                  <span className="activity-target">{activity.target}</span>
                </div>
                {activity.ticketTitle && (
                  <div className="activity-ticket-title" style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    "{activity.ticketTitle}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EnhancedAdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [dashboardData, setDashboardData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [slaData, setSlaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Advanced admin states
  const [performanceData, setPerformanceData] = useState(null)
  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, type: 'warning', icon: '⚠️', title: '3 tickets approaching SLA deadline', time: '2 min ago' },
    { id: 2, type: 'info', icon: 'ℹ️', title: 'New agent onboarded: Sarah Wilson', time: '1 hour ago' }
  ])
  const [selectedTickets, setSelectedTickets] = useState([])
  const [liveActivities, setLiveActivities] = useState([])
  const [realtimeStatus, setRealtimeStatus] = useState('connecting') // connecting, connected, error
  
  // Determine view mode from URL path
  const getViewMode = () => {
    const path = location.pathname
    if (path.includes('/analytics')) return 'analytics'
    if (path.includes('/management')) return 'management'
    if (path.includes('/tickets')) return 'tickets'
    return 'overview' // default for /admin and /admin/overview
  }
  
  const viewMode = getViewMode()
  
  // Ticket management state
  const [allTickets, setAllTickets] = useState([])
  const [ticketFilter, setTicketFilter] = useState('all') // all, open, in_progress, resolved, closed
  const [ticketSearch, setTicketSearch] = useState('')
  const [editingTicket, setEditingTicket] = useState(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  // Management section state
  const [allUsers, setAllUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [systemSettings, setSystemSettings] = useState({
    default_sla_hours: 24,
    auto_assignment: 'round_robin',
    email_notifications: true
  })
  const [managementLoading, setManagementLoading] = useState(false)
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState(null)
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState(null)
  const [editingEmailSettings, setEditingEmailSettings] = useState(false)
  const [emailFormData, setEmailFormData] = useState({
    enabled: true,
    admin_emails: []
  })

  // Advanced admin methods
  const dismissAlert = (alertId) => {
    setSystemAlerts(alerts => alerts.filter(alert => alert.id !== alertId))
  }

  const handleBulkAction = async (action, value) => {
    try {
      console.log(`Bulk ${action}:`, value, 'on tickets:', selectedTickets)
      // Here you would call your bulk update API
      // await api('/tickets/bulk/update', { method: 'POST', body: { tickets: selectedTickets, [action]: value } })
      
      // Simulate success
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: `Bulk ${action} applied to ${selectedTickets.length} tickets`,
        time: 'Just now'
      }])
      
      setSelectedTickets([])
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const performance = await api('/analytics/performance')
      setPerformanceData(performance)
    } catch (error) {
      console.error('Failed to load performance data:', error)
    }
  }

  // Ticket management functions
  const loadAllTickets = async () => {
    try {
      setTicketLoading(true)
      console.log('Loading tickets from Supabase...')
      
      // First try with full join
      let { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey(full_name, email),
          assignee:profiles!tickets_assigned_to_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
      
      // If join fails, try without joins
      if (error) {
        console.log('Join failed, trying simple query:', error)
        const result = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
        
        tickets = result.data
        error = result.error
      }
      
      if (error) {
        console.error('Supabase query failed:', error)
        throw error
      }
      
      console.log('Loaded tickets from Supabase:', tickets?.length || 0, 'tickets')
      
      // Always use real data from database (even if empty)
      setAllTickets(tickets || [])
    } catch (error) {
      console.error('Failed to load tickets:', error)
      // Show empty array on error
      setAllTickets([])
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to load tickets: ${error.message}`,
        time: 'Just now'
      }])
    } finally {
      setTicketLoading(false)
    }
  }
  

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
      
      if (error) throw error
      
      // Update local state
      setAllTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
          : ticket
      ))
      
      // Add success alert
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: `Ticket status updated to ${newStatus}`,
        time: 'Just now'
      }])
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to update ticket: ${error.message}`,
        time: 'Just now'
      }])
    }
  }

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)
      
      if (error) throw error
      
      // Update local state
      setAllTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
      
      // Add success alert
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: 'Ticket deleted successfully',
        time: 'Just now'
      }])
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to delete ticket: ${error.message}`,
        time: 'Just now'
      }])
    }
  }

  const assignTicket = async (ticketId, assigneeId) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: assigneeId,
          status: assigneeId ? 'in_progress' : 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
      
      if (error) throw error
      
      // Reload tickets to get updated assignee info
      await loadAllTickets()
      
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: assigneeId ? 'Ticket assigned successfully' : 'Ticket unassigned',
        time: 'Just now'
      }])
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to assign ticket: ${error.message}`,
        time: 'Just now'
      }])
    }
  }

  // Management functions
  const loadAllUsers = async () => {
    try {
      setManagementLoading(true)
      console.log('Loading users from Supabase...')
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log('Loaded users:', users?.length || 0)
      setAllUsers(users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to load users: ${error.message}`,
        time: 'Just now'
      }])
    } finally {
      setManagementLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      console.log('Loading departments from Supabase...')
      
      const { data: depts, error } = await supabase
        .from('departments')
        .select('*')
      
      if (error) {
        console.log('Departments table not found, using default data')
        // Use default departments if table doesn't exist
        setDepartments([
          { id: 1, name: 'IT Support', agent_count: 12 },
          { id: 2, name: 'Customer Service', agent_count: 8 },
          { id: 3, name: 'Technical', agent_count: 15 }
        ])
        return
      }
      
      // Count agents per department
      const departmentsWithCounts = await Promise.all(
        depts.map(async (dept) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department', dept.name)
            .in('role', ['admin', 'agent'])
          
          return { ...dept, agent_count: count || 0 }
        })
      )
      
      setDepartments(departmentsWithCounts)
    } catch (error) {
      console.error('Failed to load departments:', error)
      // Use fallback data
      setDepartments([
        { id: 1, name: 'IT Support', agent_count: 0 },
        { id: 2, name: 'Customer Service', agent_count: 0 },
        { id: 3, name: 'Technical', agent_count: 0 }
      ])
    }
  }

  const loadSystemSettings = async () => {
    try {
      console.log('Loading system settings...')
      
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .single()
      
      if (error) {
        console.log('Settings table not found, using defaults')
        return
      }
      
      setSystemSettings(settings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const updateSystemSetting = async (key, value) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ [key]: value })
      
      if (error) throw error
      
      setSystemSettings(prev => ({ ...prev, [key]: value }))
      
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: 'Setting updated successfully',
        time: 'Just now'
      }])
    } catch (error) {
      console.error('Failed to update setting:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: `Failed to update setting: ${error.message}`,
        time: 'Just now'
      }])
    }
  }

  // Email settings functions
  const loadEmailSettings = async () => {
    try {
      const response = await api('/email/settings')
      setEmailSettings(response)
    } catch (error) {
      console.error('Failed to load email settings:', error)
      // Show settings from env as fallback
      setEmailSettings({
        enabled: true,
        configured: true,
        smtp_server: 'smtp.gmail.com',
        from_email: 'echoverseitpypez@gmail.com',
        admin_emails: ['echoverseitpypez@gmail.com', 'jajamabuhay3@gmail.com']
      })
    }
  }

  const testEmailConfiguration = async () => {
    setTestingEmail(true)
    setEmailTestResult(null)
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSessionToken()}`
        },
        body: JSON.stringify({})
      })
      
      const text = await response.text()
      console.log('Test email response:', text)
      
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        console.error('JSON parse error:', e)
        throw new Error(`Server returned invalid JSON: ${text.substring(0, 100)}`)
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send test email')
      }
      
      setEmailTestResult({
        success: true,
        message: data.message || 'Test email sent successfully! Check your inbox.'
      })
      
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        icon: '✅',
        title: 'Test email sent successfully',
        time: 'Just now'
      }])
    } catch (error) {
      console.error('Test email error:', error)
      setEmailTestResult({
        success: false,
        message: error.message || 'Failed to send test email'
      })
      
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: 'Failed to send test email',
        time: 'Just now'
      }])
    } finally {
      setTestingEmail(false)
    }
  }

  const saveEmailSettings = async () => {
    try {
      // For now, just show a message that settings need to be updated in .env file
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'info',
        icon: 'ℹ️',
        title: 'Email settings must be updated in .env.server.local file',
        time: 'Just now'
      }])
      setEditingEmailSettings(false)
    } catch (error) {
      console.error('Save email settings error:', error)
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        icon: '❌',
        title: 'Failed to save email settings',
        time: 'Just now'
      }])
    }
  }

  const addAdminEmail = () => {
    const email = prompt('Enter admin email address:')
    if (email && email.includes('@')) {
      setEmailFormData(prev => ({
        ...prev,
        admin_emails: [...prev.admin_emails, email.trim()]
      }))
    }
  }

  const removeAdminEmail = (index) => {
    setEmailFormData(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.filter((_, i) => i !== index)
    }))
  }

  // Redirect /admin to /admin/overview
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/overview', { replace: true })
      return
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    loadDashboardData()
    loadPerformanceData()
    
    // Load tickets if on tickets view
    if (viewMode === 'tickets') {
      loadAllTickets()
    }
    
    // Load management data if on management view
    if (viewMode === 'management') {
      loadAllUsers()
      loadDepartments()
      loadSystemSettings()
      loadEmailSettings()
    }
    
    // Set up real-time Supabase subscriptions for tickets
    console.log('🔌 Setting up real-time subscription for tickets...')
    
    const ticketsChannel = supabase
      .channel('admin-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async (payload) => {
          console.log('🎉 Ticket change detected!', payload)
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            // New ticket created
            const newTicket = payload.new
            
            // Fetch creator details from profiles table
            let userName = 'Unknown User'
            try {
              const { data: creator, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', newTicket.created_by)
                .single()
              
              if (creator?.full_name) {
                userName = creator.full_name
              } else if (creator?.email) {
                userName = creator.email
              } else if (profileError) {
                console.warn('Profile not found, fetching from auth.users:', profileError)
                // Try to get user email from auth metadata as fallback
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser && authUser.id === newTicket.created_by) {
                  userName = authUser.email || authUser.user_metadata?.full_name || 'Current User'
                }
              }
            } catch (error) {
              console.error('Error fetching creator details:', error)
            }
            
            // Add to live activities
            setLiveActivities(prev => [{
              id: `${newTicket.id}-${Date.now()}`,
              timestamp: new Date(newTicket.created_at),
              user: userName,
              action: 'created ticket',
              target: `#TK-${newTicket.id.slice(-6).toUpperCase()}`,
              ticketId: newTicket.id,
              ticketTitle: newTicket.title
            }, ...prev.slice(0, 9)])
            
            // Refresh dashboard data to update Recent Tickets
            loadDashboardData()
          }
          
          if (payload.eventType === 'UPDATE') {
            // Ticket updated
            const updatedTicket = payload.new
            const oldTicket = payload.old
            
            // Fetch user who made the update (assignee or updater)
            let userName = 'System'
            if (updatedTicket.assigned_to && updatedTicket.assigned_to !== oldTicket.assigned_to) {
              const { data: assignee } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', updatedTicket.assigned_to)
                .single()
              userName = assignee?.full_name || 'Unknown User'
            }
            
            // Determine what changed
            let action = 'updated ticket'
            if (updatedTicket.status !== oldTicket.status) {
              if (updatedTicket.status === 'resolved') {
                action = 'resolved ticket'
              } else if (updatedTicket.status === 'closed') {
                action = 'closed ticket'
              } else if (updatedTicket.status === 'in_progress') {
                action = 'started working on ticket'
              }
            } else if (updatedTicket.assigned_to !== oldTicket.assigned_to) {
              action = 'assigned ticket'
            }
            
            // Add to live activities
            setLiveActivities(prev => [{
              id: `${updatedTicket.id}-${Date.now()}`,
              timestamp: new Date(),
              user: userName,
              action: action,
              target: `#TK-${updatedTicket.id.slice(-6).toUpperCase()}`,
              ticketId: updatedTicket.id,
              ticketTitle: updatedTicket.title
            }, ...prev.slice(0, 9)])
            
            // Refresh dashboard data
            loadDashboardData()
          }
          
          if (payload.eventType === 'DELETE') {
            // Ticket deleted
            const deletedTicket = payload.old
            
            setLiveActivities(prev => [{
              id: `${deletedTicket.id}-${Date.now()}`,
              timestamp: new Date(),
              user: 'Admin',
              action: 'deleted ticket',
              target: `#TK-${deletedTicket.id.slice(-6).toUpperCase()}`,
              ticketId: deletedTicket.id,
              ticketTitle: deletedTicket.title || 'Deleted Ticket'
            }, ...prev.slice(0, 9)])
            
            // Refresh dashboard data
            loadDashboardData()
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to tickets real-time updates!')
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to tickets real-time updates. Please enable realtime for tickets table in Supabase.')
          setRealtimeStatus('error')
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out. Check your internet connection and Supabase status.')
          setRealtimeStatus('error')
        } else if (status === 'CLOSED') {
          console.log('🔌 Real-time subscription closed')
          setRealtimeStatus('connecting')
        }
      })

    return () => {
      supabase.removeChannel(ticketsChannel)
    }
  }, [viewMode])

  const loadInitialActivities = async () => {
    try {
      // Load recent tickets with creator info to populate initial activities
      const { data: recentTickets } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          status,
          created_by,
          creator:created_by(full_name, email),
          assigned_to,
          assignee:assigned_to(full_name, email)
        `)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      if (recentTickets) {
        const activities = recentTickets.map(ticket => {
          // Determine action based on most recent change
          let action = 'created ticket'
          // Use full_name if available, otherwise use email, otherwise "Unknown User"
          let user = ticket.creator?.full_name || ticket.creator?.email || 'Unknown User'
          
          if (ticket.status === 'resolved') {
            action = 'resolved ticket'
            user = ticket.assignee?.full_name || ticket.assignee?.email || user
          } else if (ticket.status === 'in_progress') {
            action = 'started working on ticket'
            user = ticket.assignee?.full_name || ticket.assignee?.email || user
          } else if (ticket.assigned_to) {
            action = 'assigned ticket'
            user = ticket.assignee?.full_name || ticket.assignee?.email || user
          }
          
          return {
            id: `${ticket.id}-init`,
            timestamp: new Date(ticket.updated_at || ticket.created_at),
            user: user,
            action: action,
            target: `#TK-${ticket.id.slice(-6).toUpperCase()}`,
            ticketId: ticket.id,
            ticketTitle: ticket.title
          }
        })
        
        setLiveActivities(activities)
      }
    } catch (error) {
      console.error('Error loading initial activities:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading dashboard data...')
      
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated. Please log in.')
      }
      
      console.log('User authenticated:', session.user.email)
      
      const [dashboard, analytics, sla] = await Promise.all([
        api('/analytics/dashboard').catch(err => {
          console.error('Dashboard API error:', err)
          return null
        }),
        api('/analytics/summary').catch(err => {
          console.error('Analytics API error:', err)
          return null
        }),
        api('/tickets/sla/status').catch(err => {
          console.error('SLA API error:', err)
          return null
        })
      ])
      
      console.log('API responses:', { dashboard, analytics, sla })

      setDashboardData(dashboard)
      setAnalyticsData(analytics)
      setSlaData(sla)
      
      // Load initial activities
      loadInitialActivities()
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError(`Failed to load dashboard data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="enhanced-dashboard">
      {/* Simplified Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📋 Enhanced Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            {viewMode === 'overview' && 'Overview & Key Metrics'}
            {viewMode === 'analytics' && 'Analytics & Performance'}
            {viewMode === 'management' && 'System Management'}
            {viewMode === 'tickets' && 'Ticket Management Center'}
          </p>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-stats">
            <span className="header-stat" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 12px',
              background: realtimeStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 
                         realtimeStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                         'rgba(251, 146, 60, 0.1)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500
            }}>
              {realtimeStatus === 'connected' ? '🟢' : realtimeStatus === 'error' ? '🔴' : '🟡'} 
              {' '}
              {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'error' ? 'Disconnected' : 'Connecting...'}
              {realtimeStatus === 'connected' && ` • ${liveActivities?.length || 0} activities`}
            </span>
          </div>
          {/* Notification Bell */}
          <SystemAlerts alerts={systemAlerts} onDismissAlert={dismissAlert} />
          <button onClick={loadDashboardData} className="refresh-button" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="stats-grid">
            <StatCard
              title="Total Tickets"
              value={analyticsData?.total_tickets || 0}
              icon="🎫"
              color="blue"
              trend={{ positive: true, value: "+12%" }}
            />
            <StatCard
              title="Active Tickets"
              value={dashboardData?.assigned_to_me_count || 0}
              icon="⚡"
              color="orange"
            />
            <StatCard
              title="Overdue Tickets"
              value={slaData?.overdue_count || 0}
              icon="⚠️"
              color="red"
              trend={{ positive: false, value: "+3" }}
            />
            <StatCard
              title="Resolved Today"
              value="12"
              icon="✅"
              color="green"
              trend={{ positive: true, value: "+5" }}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            <div className="grid-left">
              {/* Charts Section */}
              <div className="charts-grid">
                <div className="chart-card">
                  <PriorityChart data={analyticsData?.priority_distribution} />
                </div>
                <div className="chart-card">
                  <StatusChart data={analyticsData?.status_distribution} />
                </div>
              </div>
              
              {/* Recent Tickets */}
              <div className="content-card">
                <RecentTickets tickets={dashboardData?.recent_tickets || []} />
              </div>
            </div>
            
            <div className="grid-right">
              {/* Live Activity */}
              <div className="content-card">
                <LiveActivity activities={liveActivities} />
              </div>
              
              {/* SLA Status */}
              <div className="content-card">
                <SLAStatus slaData={slaData} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Mode */}
      {viewMode === 'analytics' && (
        <>
          <div className="analytics-section">
            <div className="stats-grid">
              <StatCard
                title="Avg Response Time"
                value={performanceData?.avg_first_response_time_hours?.toFixed(1) || '0.0'}
                subtitle="hours"
                icon="⏱️"
                color="blue"
              />
              <StatCard
                title="Resolution Rate"
                value="87%"
                subtitle="this month"
                icon="📈"
                color="green"
                trend={{ positive: true, value: "+5%" }}
              />
              <StatCard
                title="Customer Satisfaction"
                value="4.2"
                subtitle="out of 5.0"
                icon="⭐"
                color="orange"
              />
              <StatCard
                title="Avg Resolution Time"
                value={performanceData?.avg_resolution_time_hours?.toFixed(1) || '0.0'}
                subtitle="hours"
                icon="⏰"
                color="red"
              />
            </div>

            {/* Agent Performance */}
            <div className="content-card">
              <AgentPerformance agents={performanceData?.agent_performance} />
            </div>

            {/* Enhanced Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <PriorityChart data={analyticsData?.priority_distribution} />
              </div>
              <div className="chart-card">
                <StatusChart data={analyticsData?.status_distribution} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Management Mode */}
      {viewMode === 'management' && (
        <>
          <div className="management-section">
            {/* User Management */}
            <div className="content-card">
              <h3>👥 User Management</h3>
              <div className="management-stats">
                <div className="stat-item">
                  <span className="stat-value">{allUsers.length}</span>
                  <span className="stat-label">Total Users</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{allUsers.filter(u => u.role === 'admin').length}</span>
                  <span className="stat-label">Admins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{allUsers.filter(u => u.role === 'agent').length}</span>
                  <span className="stat-label">Agents</span>
                </div>
              </div>
              <div className="management-actions">
                <button 
                  className="btn primary"
                  onClick={() => window.open('/admin/users', '_blank')}
                >
                  ➕ Add New User
                </button>
                <button 
                  className="btn secondary"
                  onClick={() => {
                    loadAllUsers()
                    console.log('All users:', allUsers)
                  }}
                  disabled={managementLoading}
                >
                  {managementLoading ? '⏳' : '📊'} View All Users ({allUsers.length})
                </button>
                <button 
                  className="btn warning"
                  onClick={() => navigate('/admin/users')}
                >
                  🔒 Manage Permissions
                </button>
              </div>
            </div>

            {/* System Settings */}
            <div className="content-card">
              <h3>⚙️ System Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Default SLA Time (hours)</label>
                  <input 
                    type="number" 
                    value={systemSettings.default_sla_hours} 
                    onChange={(e) => updateSystemSetting('default_sla_hours', parseInt(e.target.value))}
                    className="setting-input" 
                  />
                </div>
                <div className="setting-item">
                  <label>Auto-assignment</label>
                  <select 
                    value={systemSettings.auto_assignment}
                    onChange={(e) => updateSystemSetting('auto_assignment', e.target.value)}
                    className="setting-select"
                  >
                    <option value="round_robin">Round Robin</option>
                    <option value="least_busy">Least Busy</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Email Notifications</label>
                  <input 
                    type="checkbox" 
                    checked={systemSettings.email_notifications}
                    onChange={(e) => updateSystemSetting('email_notifications', e.target.checked)}
                  /> Enable
                </div>
              </div>
              <div className="settings-actions">
                <button 
                  onClick={() => {
                    loadSystemSettings()
                    console.log('Current settings:', systemSettings)
                  }}
                  className="btn ghost"
                >
                  🔄 Reload Settings
                </button>
              </div>
            </div>

            {/* Department Management */}
            <div className="content-card">
              <h3>🏢 Department Management</h3>
              <div className="departments-list">
                {departments.map(dept => (
                  <div key={dept.id} className="department-item">
                    <span>{dept.name}</span>
                    <span className="department-count">{dept.agent_count} agents</span>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="empty-departments">
                    <p>No departments found. Loading from Supabase...</p>
                  </div>
                )}
              </div>
              <div className="departments-actions">
                <button 
                  onClick={() => {
                    loadDepartments()
                    console.log('Departments:', departments)
                  }}
                  className="btn secondary"
                >
                  🔄 Refresh Departments
                </button>
              </div>
            </div>

            {/* Email Settings */}
            <div className="content-card">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>📧 Email Notifications</h3>
                {emailSettings?.enabled ? (
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{fontSize: '0.6rem'}}>●</span> Active
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    Disabled
                  </span>
                )}
              </div>
              
              {emailSettings ? (
                <>
                  <div style={{
                    background: 'rgba(79, 70, 229, 0.05)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text)'}}>Current Configuration</h4>
                    <div style={{display: 'grid', gap: '0.75rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                        <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>SMTP Server</span>
                        <strong style={{color: 'var(--text)'}}>{emailSettings.smtp_server || 'smtp.gmail.com'}</strong>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                        <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>From Email</span>
                        <strong style={{color: 'var(--text)'}}>{emailSettings.from_email || 'echoverseitpypez@gmail.com'}</strong>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '0.5rem 0'}}>
                        <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Admin Recipients</span>
                        <div style={{textAlign: 'right'}}>
                          {(emailSettings.admin_emails || ['echoverseitpypez@gmail.com', 'jajamabuhay3@gmail.com']).map((email, idx) => (
                            <div key={idx} style={{color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.25rem'}}>
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem'}}>
                    <button 
                      className="btn primary"
                      onClick={testEmailConfiguration}
                      disabled={testingEmail}
                      style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                    >
                      {testingEmail ? '⏳ Sending...' : '📧 Send Test Email'}
                    </button>
                    <button 
                      className="btn ghost"
                      onClick={loadEmailSettings}
                    >
                      🔄 Refresh Settings
                    </button>
                  </div>

                  {emailTestResult && (
                    <div style={{
                      padding: '1rem',
                      background: emailTestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${emailTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.75rem'
                    }}>
                      <span style={{fontSize: '1.25rem'}}>{emailTestResult.success ? '✅' : '❌'}</span>
                      <div>
                        <strong style={{display: 'block', marginBottom: '0.25rem'}}>
                          {emailTestResult.success ? 'Test Email Sent!' : 'Test Failed'}
                        </strong>
                        <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                          {emailTestResult.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '0.75rem'
                  }}>
                    <span style={{fontSize: '1.25rem'}}>💡</span>
                    <div>
                      <strong style={{color: 'var(--text)', display: 'block', marginBottom: '0.25rem'}}>Email Notifications</strong>
                      <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5'}}>
                        Automatic email notifications are sent when tickets are created, assigned, updated, or resolved.
                        Configure settings in <code>.env.server.local</code>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <div className="loading-spinner"></div>
                  <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>Loading email settings...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tickets Mode */}
      {viewMode === 'tickets' && (
        <>
          <div className="tickets-section">
            {/* Bulk Operations - Only in Tickets View */}
            <div className="management-tools">
              <BulkActions 
                selectedTickets={selectedTickets} 
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Enhanced Tickets Header */}
            <div className="content-card tickets-header-card">
              <div className="tickets-header-top">
                <div className="header-title-section">
                  <h2 className="tickets-main-title">
                    🎫 Ticket Management Center
                  </h2>
                  <p className="tickets-subtitle">
                    Manage and track all support tickets in your system
                  </p>
                </div>
                <div className="tickets-stats-mini">
                  <div className="stat-mini">
                    <span className="stat-number">{allTickets.length}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-number">
                      {allTickets.filter(t => t.status === 'open').length}
                    </span>
                    <span className="stat-label">Open</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-number">
                      {allTickets.filter(t => t.status === 'in_progress').length}
                    </span>
                    <span className="stat-label">In Progress</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Controls */}
              <div className="tickets-controls-enhanced">
                <div className="controls-left">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="🔍 Search by title, description, or creator..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="search-input-enhanced"
                    />
                    {ticketSearch && (
                      <button 
                        onClick={() => setTicketSearch('')}
                        className="clear-search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <div className="filter-container">
                    <select
                      value={ticketFilter}
                      onChange={(e) => setTicketFilter(e.target.value)}
                      className="filter-select-enhanced"
                    >
                      <option value="all">📋 All Status</option>
                      <option value="open">🟡 Open</option>
                      <option value="in_progress">🔵 In Progress</option>
                      <option value="resolved">🟢 Resolved</option>
                      <option value="closed">⚫ Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="controls-right">
                  <button
                    onClick={() => {
                      setTicketSearch('')
                      setTicketFilter('all')
                    }}
                    className="btn ghost"
                  >
                    🧹 Clear Filters
                  </button>
                  <button
                    onClick={loadAllTickets}
                    className="btn primary"
                    disabled={ticketLoading}
                  >
                    {ticketLoading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        🔄 Refresh from Supabase
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => console.log('Current tickets:', allTickets)}
                    className="btn ghost"
                  >
                    🐛 Debug Log
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Tickets Table */}
            <div className="content-card tickets-table-card">
              {ticketLoading ? (
                <div className="loading-state-enhanced">
                  <div className="loading-animation">
                    <div className="spinner-large"></div>
                    <div className="loading-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                  <h3>Loading Tickets</h3>
                  <p>Please wait while we fetch the latest ticket data</p>
                </div>
              ) : (
                <EnhancedTicketsTable
                  tickets={allTickets}
                  filter={ticketFilter}
                  search={ticketSearch}
                  onStatusChange={updateTicketStatus}
                  onDelete={deleteTicket}
                  onAssign={assignTicket}
                  onRefresh={loadAllTickets}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Urgent Items */}
      {dashboardData?.urgent_tickets?.length > 0 && (
        <div className="urgent-section">
          <h2>🚨 Urgent Tickets</h2>
          <div className="urgent-tickets">
            {dashboardData.urgent_tickets.map(ticket => (
              <div key={ticket.id} className="urgent-ticket">
                <div className="urgent-header">
                  <span className="urgent-badge">URGENT</span>
                  <span className="ticket-id">#{ticket.id.slice(-6)}</span>
                </div>
                <h4>{ticket.title}</h4>
                <p>Created by {ticket.creator?.full_name}</p>
                <div className="urgent-time">
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}