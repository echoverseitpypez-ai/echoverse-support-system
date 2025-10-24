import { Router } from 'express'
import { supabaseAdmin } from '../supabase.js'
import { requireRole } from '../auth.js'
import { auditLog } from '../middleware/security.js'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs/promises'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'attachments')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex')
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed'
  ]
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files per upload
  }
})

// Upload attachments to ticket
router.post('/:ticketId/upload', upload.array('files', 5), auditLog('upload_attachment'), async (req, res) => {
  try {
    const ticketId = req.params.ticketId
    const user = req.user
    const profile = req.profile
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    // Check if ticket exists and user has access
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by, assigned_to')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})))
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const hasAccess = requireRole(profile, ['admin', 'agent']) ||
                     ticket.created_by === user.id ||
                     ticket.assigned_to === user.id

    if (!hasAccess) {
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})))
      return res.status(403).json({ error: 'Access denied' })
    }

    // Save file records to database
    const attachmentRecords = files.map(file => ({
      ticket_id: ticketId,
      filename: file.originalname,
      file_path: file.path,
      file_size: file.size,
      file_type: file.mimetype,
      uploaded_by: user.id
    }))

    const { data: savedAttachments, error } = await supabaseAdmin
      .from('ticket_attachments')
      .insert(attachmentRecords)
      .select(`
        id, filename, file_size, file_type, created_at,
        uploader:profiles!uploaded_by(full_name)
      `)

    if (error) {
      // Clean up uploaded files on database error
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})))
      throw error
    }

    // Log activity
    await supabaseAdmin.from('ticket_activities').insert({
      ticket_id: ticketId,
      user_id: user.id,
      action: 'attachment_added',
      details: `Added ${files.length} attachment(s): ${files.map(f => f.originalname).join(', ')}`
    })

    // Update ticket's last activity
    await supabaseAdmin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    res.status(201).json({
      message: `${files.length} file(s) uploaded successfully`,
      attachments: savedAttachments
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }
    
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

// Download attachment
router.get('/:ticketId/download/:attachmentId', auditLog('download_attachment'), async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params
    const user = req.user
    const profile = req.profile

    // Check ticket access
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by, assigned_to')
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

    // Get attachment details
    const { data: attachment } = await supabaseAdmin
      .from('ticket_attachments')
      .select('filename, file_path, file_type')
      .eq('id', attachmentId)
      .eq('ticket_id', ticketId)
      .single()

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    // Check if file exists
    try {
      await fs.access(attachment.file_path)
    } catch {
      return res.status(404).json({ error: 'File not found on disk' })
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
    res.setHeader('Content-Type', attachment.file_type)

    // Stream the file
    const fileStream = await fs.readFile(attachment.file_path)
    res.send(fileStream)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// Delete attachment
router.delete('/:ticketId/attachments/:attachmentId', auditLog('delete_attachment'), async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params
    const user = req.user
    const profile = req.profile

    // Check permissions (only uploader, assignee, or staff can delete)
    const { data: attachment } = await supabaseAdmin
      .from('ticket_attachments')
      .select(`
        filename, file_path, uploaded_by,
        ticket:tickets(created_by, assigned_to)
      `)
      .eq('id', attachmentId)
      .eq('ticket_id', ticketId)
      .single()

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    const canDelete = requireRole(profile, ['admin', 'agent']) ||
                     attachment.uploaded_by === user.id ||
                     attachment.ticket.created_by === user.id ||
                     attachment.ticket.assigned_to === user.id

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId)

    if (error) throw error

    // Delete file from disk
    try {
      await fs.unlink(attachment.file_path)
    } catch (error) {
      console.warn('Could not delete file from disk:', error)
    }

    // Log activity
    await supabaseAdmin.from('ticket_activities').insert({
      ticket_id: ticketId,
      user_id: user.id,
      action: 'attachment_deleted',
      details: `Deleted attachment: ${attachment.filename}`
    })

    res.json({ message: 'Attachment deleted successfully' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    res.status(500).json({ error: 'Failed to delete attachment' })
  }
})

// List attachments for a ticket
router.get('/:ticketId/attachments', auditLog('list_attachments'), async (req, res) => {
  try {
    const ticketId = req.params.ticketId
    const user = req.user
    const profile = req.profile

    // Check ticket access
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by, assigned_to')
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

    const { data: attachments, error } = await supabaseAdmin
      .from('ticket_attachments')
      .select(`
        id, filename, file_size, file_type, created_at,
        uploader:profiles!uploaded_by(id, full_name, avatar_url)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(attachments)
  } catch (error) {
    console.error('Error listing attachments:', error)
    res.status(500).json({ error: 'Failed to list attachments' })
  }
})

export default router