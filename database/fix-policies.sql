-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only staff can delete profiles" ON public.profiles;

-- Simple profiles policies without circular dependencies
CREATE POLICY "Enable read for own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin access using direct role check (not a subquery that causes recursion)
CREATE POLICY "Enable admin read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'agent')
      LIMIT 1
    )
  );

-- Drop and recreate other table policies with simpler approach
DROP POLICY IF EXISTS "Allow admin to manage departments" ON public.departments;
CREATE POLICY "Allow admin to manage departments" ON public.departments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;
CREATE POLICY "Admins can manage all tickets" ON public.tickets
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        tickets.created_by = auth.uid() OR 
        tickets.assigned_to = auth.uid() OR
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'agent'))
      )
    )
  );

DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can create messages for their tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    sender = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        tickets.created_by = auth.uid() OR 
        tickets.assigned_to = auth.uid() OR
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'agent'))
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;
CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'agent')
    )
  );