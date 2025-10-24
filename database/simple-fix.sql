-- Temporarily disable RLS on profiles to break the recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Or use very simple policies
DROP POLICY IF EXISTS "Enable read for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable admin read all profiles" ON public.profiles;

-- Simple policy: authenticated users can read any profile
CREATE POLICY "authenticated_can_read_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Simple policy: users can only insert/update their own profile  
CREATE POLICY "users_can_manage_own_profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;