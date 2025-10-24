-- Check if admin user exists in auth.users and profiles
SELECT 
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name,
  p.department_id,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@echoverse.local';

-- If admin doesn't exist, create it
-- Note: Run this manually if needed
/*
INSERT INTO auth.users (
  instance_id, 
  id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@echoverse.local',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  ''
);
*/

-- Ensure admin profile exists with admin role
-- Run this after creating the auth user
/*
INSERT INTO public.profiles (
  id,
  role,
  full_name,
  department_id,
  avatar_url,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  'admin',
  'Administrator',
  1,
  '',
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email = 'admin@echoverse.local'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  full_name = 'Administrator',
  updated_at = NOW();
*/