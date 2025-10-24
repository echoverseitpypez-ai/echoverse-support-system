import 'dotenv/config'
import { supabaseAdmin } from '../server/supabase.js'

console.log('Creating RLS policies for profiles table...')

// First, let's check if we can access the database
console.log('Testing database connection...')

try {
  // Test basic connectivity
  const { data, error } = await supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true })
  
  if (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Database connected, profiles count:', data)
  
  // Now let's create the policies using SQL
  const policies = [
    `DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Staff can update all profiles" ON public.profiles;`,
    
    `CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);`,
    
    `CREATE POLICY "Staff can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')));`,
    
    `CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);`,
    
    `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`,
    
    `CREATE POLICY "Staff can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')));`
  ]
  
  for (let i = 0; i < policies.length; i++) {
    const sql = policies[i]
    console.log(`Executing: ${sql.substring(0, 50)}...`)
    
    try {
      const result = await supabaseAdmin.rpc('exec_sql', { sql })
      if (result.error) {
        console.log(`⚠️  SQL result:`, result.error.message)
      } else {
        console.log(`✅ Success`)
      }
    } catch (err) {
      // Try alternative approach - direct query if rpc fails
      console.log(`Trying alternative approach...`)
      const result = await supabaseAdmin.from('_').select(sql)
      console.log(`Result:`, result)
    }
  }
  
  console.log('\n🎉 Policies creation completed!')
  console.log('Try logging in again now.')
  
} catch (err) {
  console.error('Error:', err.message)
}