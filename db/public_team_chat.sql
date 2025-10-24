-- Simple Public Team Chat
-- One chat room for all staff (admin, teacher, agent)
-- Run this in Supabase SQL Editor

-- Drop old complex tables
DROP TABLE IF EXISTS public.team_chat_messages CASCADE;
DROP TABLE IF EXISTS public.team_chat_members CASCADE;
DROP TABLE IF EXISTS public.team_chats CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_direct_chat CASCADE;

-- Simple messages table for public chat
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS team_messages_created_at_idx ON public.team_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Staff can view all messages
CREATE POLICY "Staff can view team messages"
  ON public.team_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Staff can send messages
CREATE POLICY "Staff can send team messages"
  ON public.team_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Admins can delete messages (for clearing chat)
CREATE POLICY "Admins can delete team messages"
  ON public.team_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON public.team_messages TO authenticated;

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
