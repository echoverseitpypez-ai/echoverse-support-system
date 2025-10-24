import { z } from 'zod'

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body)
      next()
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
  }
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query)
      next()
    } catch (error) {
      res.status(400).json({
        error: 'Query validation failed',
        details: error.errors
      })
    }
  }
}

// Common schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val) || 20, 100)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export const ticketCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
  department_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional()
})

export const ticketUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
  category: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  due_date: z.string().datetime().optional(),
  resolution: z.string().optional()
})

export const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  full_name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: z.enum(['user', 'teacher', 'agent', 'admin']).default('user'),
  department_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional()
})

export const messageCreateSchema = z.object({
  body: z.string().min(1).max(10000),
  is_internal: z.boolean().default(false),
  message_type: z.enum(['comment', 'status_change', 'assignment', 'resolution']).default('comment')
})