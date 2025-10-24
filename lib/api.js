import { supabase } from './supabase/client'

// API base configuration - Use Next.js proxy so everything runs on same port
const API_BASE = '/api'

/**
 * Enhanced API utility with authentication and error handling
 */
export async function apiCall(endpoint, options = {}) {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession()
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        }),
        ...options.headers
      },
      ...options
    }

    // Add body for POST/PUT/PATCH requests
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body)
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Convenience methods
export const api = {
  get: (endpoint, params = {}) => {
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString()
      : ''
    return apiCall(`${endpoint}${queryString}`)
  },
  
  post: (endpoint, data) => apiCall(endpoint, {
    method: 'POST',
    body: data
  }),
  
  put: (endpoint, data) => apiCall(endpoint, {
    method: 'PUT', 
    body: data
  }),
  
  patch: (endpoint, data) => apiCall(endpoint, {
    method: 'PATCH',
    body: data
  }),
  
  delete: (endpoint) => apiCall(endpoint, {
    method: 'DELETE'
  })
}

// Specific API functions for the dashboard
export const dashboardAPI = {
  // Get dashboard overview
  getDashboard: () => api.get('/analytics/dashboard'),
  
  // Get analytics summary  
  getAnalytics: () => api.get('/analytics/summary'),
  
  // Get SLA status
  getSLAStatus: () => api.get('/tickets/sla/status'),
  
  // Get performance metrics
  getPerformance: (timeframe = '30d') => api.get('/analytics/performance', { timeframe }),
  
  // Get tickets with filters
  getTickets: (filters = {}) => api.get('/tickets', filters),
  
  // Get my tickets for users
  getMyTickets: () => api.get('/tickets', { created_by: 'me' }),
  
  // Create ticket
  createTicket: (ticketData) => api.post('/tickets', ticketData),
  
  // Update ticket
  updateTicket: (id, updates) => api.patch(`/tickets/${id}`, updates),
  
  // Get ticket details
  getTicket: (id) => api.get(`/tickets/${id}`),
  
  // Add message to ticket
  addMessage: (ticketId, message) => api.post(`/tickets/${ticketId}/messages`, message),
  
  // Bulk update tickets
  bulkUpdateTickets: (ticketIds, updates) => api.patch('/tickets/bulk/update', {
    ticket_ids: ticketIds,
    updates
  })
}

// User API functions
export const userAPI = {
  // Get user profile
  getProfile: () => api.get('/users/profile'),
  
  // Update user profile  
  updateProfile: (profileData) => api.patch('/users/profile', profileData),
  
  // Get users (admin only)
  getUsers: (filters = {}) => api.get('/users', filters),
  
  // Create user (admin only)
  createUser: (userData) => api.post('/users', userData),
  
  // Update user (admin only)
  updateUser: (id, userData) => api.patch(`/users/${id}`, userData),
  
  // Delete user (admin only)
  deleteUser: (id) => api.delete(`/users/${id}`)
}

// Error handling utility
export function handleAPIError(error) {
  console.error('API Error:', error)
  
  if (error.message.includes('401')) {
    return 'Authentication required. Please log in again.'
  }
  
  if (error.message.includes('403')) {
    return 'You do not have permission to perform this action.'
  }
  
  if (error.message.includes('404')) {
    return 'The requested resource was not found.'
  }
  
  if (error.message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  return error.message || 'An unexpected error occurred.'
}