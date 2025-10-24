-- Clean Up Incomplete Profiles
-- Run this in Supabase SQL Editor

-- Check for profiles with NULL or empty full_name
SELECT id, full_name, role, created_at 
FROM profiles 
WHERE full_name IS NULL OR full_name = '' OR TRIM(full_name) = '';

-- Option 1: Update them with placeholder names (if you want to keep them)
-- UPDATE profiles 
-- SET full_name = 'User_' || SUBSTRING(id::text, 1, 8)
-- WHERE full_name IS NULL OR full_name = '' OR TRIM(full_name) = '';

-- Option 2: Delete incomplete profiles (if they're test accounts)
-- DELETE FROM profiles 
-- WHERE (full_name IS NULL OR full_name = '' OR TRIM(full_name) = '')
-- AND role IN ('teacher', 'admin', 'agent');

-- Recommended: Check which ones exist first, then decide what to do
