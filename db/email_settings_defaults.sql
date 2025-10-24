-- Insert default email settings
-- This migration sets up default email notification preferences

-- Delete existing email settings (optional, for clean slate)
DELETE FROM public.settings 
WHERE key IN (
  'email_enabled',
  'admin_emails',
  'notify_on_ticket_created',
  'notify_on_ticket_assigned',
  'notify_on_ticket_updated',
  'notify_on_ticket_resolved',
  'mail_from_name'
);

-- Insert default email settings
INSERT INTO public.settings (key, value) VALUES
  ('email_enabled', 'false'),
  ('admin_emails', '[]'),
  ('notify_on_ticket_created', 'true'),
  ('notify_on_ticket_assigned', 'true'),
  ('notify_on_ticket_updated', 'true'),
  ('notify_on_ticket_resolved', 'true'),
  ('mail_from_name', 'Echoverse Support')
ON CONFLICT (key) DO NOTHING;

-- Note: Admin emails should be added through the UI after enabling email notifications
