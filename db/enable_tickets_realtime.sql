-- Enable Realtime for Tickets Table
-- Run this in Supabase SQL Editor to enable real-time updates for tickets

-- Check if tickets table is already in realtime publication
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'tickets';

-- Enable realtime for tickets table (run this if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Also enable for profiles table (to get user info in real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Verify both tables are enabled
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('tickets', 'profiles');

-- Should show 2 rows if both are enabled correctly
