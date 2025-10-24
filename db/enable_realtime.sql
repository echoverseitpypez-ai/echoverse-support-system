-- Enable Realtime for Team Messages
-- Run this in Supabase SQL Editor

-- Check if table exists in realtime publication
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'team_messages';

-- Enable realtime (run this)
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- Verify it's enabled
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'team_messages';
-- Should show 1 row if enabled correctly
