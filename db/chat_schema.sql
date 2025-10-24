-- Real-time Chat for Ticket Support System
-- Run this in your Supabase SQL Editor

-- Chat Rooms table (one room per ticket or direct message)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Chat Participants table (who can see the chat)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS chat_participants_user_id_idx ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS chat_participants_room_id_idx ON public.chat_participants(room_id);

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION public.update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is sent
DROP TRIGGER IF EXISTS chat_message_inserted ON public.chat_messages;
CREATE TRIGGER chat_message_inserted
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_last_message();

-- Row Level Security Policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Chat Rooms: Users can see rooms they're participants in
CREATE POLICY "Users can view their chat rooms"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Chat Messages: Users can view messages in rooms they're part of
CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Chat Messages: Users can send messages to rooms they're part of
CREATE POLICY "Users can send messages to their rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Chat Participants: Users can view participants in rooms they're part of
CREATE POLICY "Users can view participants in their rooms"
  ON public.chat_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      WHERE cp.room_id = chat_participants.room_id
      AND cp.user_id = auth.uid()
    )
  );

-- Staff can manage chat rooms
CREATE POLICY "Staff can manage chat rooms"
  ON public.chat_rooms FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Staff can manage participants
CREATE POLICY "Staff can manage participants"
  ON public.chat_participants FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
