-- Test Team Chat Setup
-- Run this in Supabase SQL Editor to verify everything works

-- 1. Check if tables exist
SELECT 'team_chats' as table_name, COUNT(*) as count FROM team_chats
UNION ALL
SELECT 'team_chat_messages', COUNT(*) FROM team_chat_messages
UNION ALL
SELECT 'team_chat_members', COUNT(*) FROM team_chat_members;

-- 2. Check if you can see staff profiles
SELECT id, full_name, role 
FROM profiles 
WHERE role IN ('teacher', 'admin', 'agent')
ORDER BY full_name
LIMIT 5;

-- 3. Test creating a chat (replace YOUR_USER_ID with your actual user ID)
-- Get your user ID first:
SELECT auth.uid() as your_user_id;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'team_chat%'
ORDER BY tablename, policyname;
