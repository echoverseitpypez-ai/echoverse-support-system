-- Fix Infinite Recursion in Team Chat Policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members in their chats" ON public.team_chat_members;

-- Create a simpler policy that doesn't cause recursion
-- Allow staff members to view all chat members
CREATE POLICY "Staff can view chat members"
  ON public.team_chat_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Also update the insert policy to be simpler
DROP POLICY IF EXISTS "Staff can add members to their chats" ON public.team_chat_members;

CREATE POLICY "Staff can add chat members"
  ON public.team_chat_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Fix the messages policy too - simplify it
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.team_chat_messages;

CREATE POLICY "Staff can view chat messages"
  ON public.team_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.team_chat_messages;

CREATE POLICY "Staff can send chat messages"
  ON public.team_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Fix chats policy
DROP POLICY IF EXISTS "Users can view their team chats" ON public.team_chats;

CREATE POLICY "Staff can view team chats"
  ON public.team_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );
