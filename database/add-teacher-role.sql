-- Migration to add 'teacher' role to the profiles table constraint
-- This fixes the "profiles_role_check" constraint error when creating teachers

BEGIN;

-- Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint that includes 'teacher'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'teacher', 'agent', 'admin'));

-- Update any existing users with 'teacher' role if they were somehow created
-- (This is safe even if no such users exist)
UPDATE public.profiles SET role = 'teacher' WHERE role = 'teacher';

COMMIT;

-- Note: Run this migration against your Supabase database to fix the role constraint
-- You can run this via: 
-- 1. Supabase Dashboard > SQL Editor
-- 2. Or via psql command line if you have access
-- 3. Or via your existing database migration system