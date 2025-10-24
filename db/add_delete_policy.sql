-- Add Delete Policy for Admins to Clear Chat
-- Run this in Supabase SQL Editor if you already ran public_team_chat.sql

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can delete team messages" ON public.team_messages;

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

-- Verify policy was created
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_messages' 
AND policyname = 'Admins can delete team messages';
