/**
 * Application Constants
 * Centralized configuration values
 */

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
}

// SLA Configuration (in hours)
export const SLA_HOURS = {
  low: 72,
  normal: 48,
  high: 24,
  urgent: 4
}

// Rate Limiting
export const RATE_LIMITS = {
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX_REQUESTS: 5,
  TICKET_CREATION_WINDOW_MS: 60 * 1000, // 1 minute
  TICKET_CREATION_MAX: 5
}

// Session Validation
export const SESSION = {
  VALIDATION_INTERVAL_MS: 10000, // 10 seconds
  SESSION_STORAGE_KEY: 'server_session_id'
}

// Ticket Configuration
export const TICKET = {
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 10000,
  PRIORITIES: ['low', 'normal', 'high', 'urgent'],
  STATUSES: ['open', 'in_progress', 'pending', 'resolved', 'closed']
}

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  TEACHER: 'teacher',
  USER: 'user'
}

// API Configuration
export const API = {
  BASE_URL: '/api',
  TIMEOUT_MS: 30000 // 30 seconds
}
