-- Complete Email Setup - Run this in Supabase SQL Editor
-- This combines all necessary migrations for email functionality

-- ============================================
-- PART 1: Add email column to profiles
-- ============================================

-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync existing profiles with auth.users email
UPDATE public.profiles 
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND public.profiles.email IS NULL;

-- Update trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update trigger
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    full_name = COALESCE(NULLIF(full_name, ''), NEW.raw_user_meta_data->>'full_name', NEW.email)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- ============================================
-- PART 2: Initialize email settings
-- ============================================

-- Insert default email settings (will not overwrite existing)
INSERT INTO public.settings (key, value) VALUES
  ('email_enabled', 'false'),
  ('admin_emails', '[]'),
  ('notify_on_ticket_created', 'true'),
  ('notify_on_ticket_assigned', 'true'),
  ('notify_on_ticket_updated', 'true'),
  ('notify_on_ticket_resolved', 'true'),
  ('mail_from_name', 'Echoverse Support')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check profiles have email
SELECT 'Profiles with email:' as check_type, COUNT(*) as count 
FROM public.profiles 
WHERE email IS NOT NULL;

-- Check email settings exist
SELECT 'Email settings:' as check_type, key, value 
FROM public.settings 
WHERE key IN (
  'email_enabled',
  'admin_emails',
  'notify_on_ticket_created',
  'notify_on_ticket_assigned',
  'notify_on_ticket_updated',
  'notify_on_ticket_resolved',
  'mail_from_name'
)
ORDER BY key;

-- Sample profile data
SELECT 'Sample profiles:' as check_type, id, full_name, email, role 
FROM public.profiles 
LIMIT 5;

-- ============================================
-- NEXT STEPS
-- ============================================

-- After running this script:
-- 1. Go to Admin Dashboard > Settings
-- 2. Enable "Email Notifications"
-- 3. Add admin email addresses
-- 4. Click "Save Settings"
-- 5. Send a test email to verify
-- 6. Create a test ticket to check notifications

SELECT '✅ Email setup complete! Now configure via Admin UI.' as status;
