-- Fix departments table trigger issue
-- Drop the updated_at trigger if it exists (table doesn't have updated_at column)

DROP TRIGGER IF EXISTS departments_updated_at ON public.departments;

-- Verify departments table structure (should only have id, name, description)
-- Run this to check: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments';
