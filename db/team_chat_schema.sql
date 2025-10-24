-- Team Chat System for Teachers, Admins, and Agents
-- Standalone chat system separate from tickets
-- Run this in your Supabase SQL Editor

-- Direct Messages / Group Chats table
CREATE TABLE IF NOT EXISTS public.team_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_name TEXT, -- Optional name for group chats
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

-- Team Chat Messages table
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.team_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_by UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Team Chat Members table
CREATE TABLE IF NOT EXISTS public.team_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.team_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(chat_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS team_chat_messages_chat_id_idx ON public.team_chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS team_chat_messages_sender_id_idx ON public.team_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS team_chat_members_user_id_idx ON public.team_chat_members(user_id);
CREATE INDEX IF NOT EXISTS team_chat_members_chat_id_idx ON public.team_chat_members(chat_id);
CREATE INDEX IF NOT EXISTS team_chats_last_message_idx ON public.team_chats(last_message_at DESC NULLS LAST);

-- Function to update last_message_at and preview
CREATE OR REPLACE FUNCTION public.update_team_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.team_chats
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message, 100),
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is sent
DROP TRIGGER IF EXISTS team_chat_message_inserted ON public.team_chat_messages;
CREATE TRIGGER team_chat_message_inserted
  AFTER INSERT ON public.team_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_chat_last_message();

-- Function to get or create direct chat between two users
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  existing_chat_id UUID;
  new_chat_id UUID;
BEGIN
  -- Check if direct chat already exists between these two users
  SELECT tc.id INTO existing_chat_id
  FROM public.team_chats tc
  WHERE tc.is_group = FALSE
    AND EXISTS (
      SELECT 1 FROM public.team_chat_members tcm1
      WHERE tcm1.chat_id = tc.id AND tcm1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM public.team_chat_members tcm2
      WHERE tcm2.chat_id = tc.id AND tcm2.user_id = user2_id
    )
  LIMIT 1;

  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;

  -- Create new direct chat
  INSERT INTO public.team_chats (created_by, is_group)
  VALUES (user1_id, FALSE)
  RETURNING id INTO new_chat_id;

  -- Add both users as members
  INSERT INTO public.team_chat_members (chat_id, user_id)
  VALUES 
    (new_chat_id, user1_id),
    (new_chat_id, user2_id);

  RETURN new_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
ALTER TABLE public.team_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_members ENABLE ROW LEVEL SECURITY;

-- Team Chats: Users can see chats they're members of
CREATE POLICY "Users can view their team chats"
  ON public.team_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_chat_members
      WHERE team_chat_members.chat_id = team_chats.id
      AND team_chat_members.user_id = auth.uid()
      AND team_chat_members.is_active = TRUE
    )
  );

-- Team Chat Messages: Users can view messages in chats they're part of
CREATE POLICY "Users can view messages in their chats"
  ON public.team_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_chat_members
      WHERE team_chat_members.chat_id = team_chat_messages.chat_id
      AND team_chat_members.user_id = auth.uid()
      AND team_chat_members.is_active = TRUE
    )
  );

-- Team Chat Messages: Users can send messages to chats they're part of
CREATE POLICY "Users can send messages to their chats"
  ON public.team_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_chat_members
      WHERE team_chat_members.chat_id = team_chat_messages.chat_id
      AND team_chat_members.user_id = auth.uid()
      AND team_chat_members.is_active = TRUE
    )
  );

-- Team Chat Members: Users can view members in chats they're part of
CREATE POLICY "Users can view members in their chats"
  ON public.team_chat_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_chat_members tcm
      WHERE tcm.chat_id = team_chat_members.chat_id
      AND tcm.user_id = auth.uid()
      AND tcm.is_active = TRUE
    )
  );

-- Staff can create chats
CREATE POLICY "Staff can create team chats"
  ON public.team_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Staff can add members to chats they're part of
CREATE POLICY "Staff can add members to their chats"
  ON public.team_chat_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'agent', 'teacher')
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.team_chats TO authenticated;
GRANT ALL ON public.team_chat_messages TO authenticated;
GRANT ALL ON public.team_chat_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat TO authenticated;
