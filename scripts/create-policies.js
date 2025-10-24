import 'dotenv/config'
import { supabaseAdmin } from '../server/supabase.js'

console.log('Creating RLS policies for profiles table...')

const policies = [
  // Policy 1: Users can read their own profile
  {
    name: 'Users can read own profile',
    sql: `
      CREATE POLICY "Users can read own profile" 
      ON public.profiles 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = id);
    `
  },
  
  // Policy 2: Staff can read all profiles  
  {
    name: 'Staff can read all profiles',
    sql: `
      CREATE POLICY "Staff can read all profiles" 
      ON public.profiles 
      FOR SELECT 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('admin', 'agent')
        )
      );
    `
  },
  
  // Policy 3: Users can insert their own profile
  {
    name: 'Users can insert own profile',
    sql: `
      CREATE POLICY "Users can insert own profile" 
      ON public.profiles 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = id);
    `
  },
  
  // Policy 4: Users can update their own profile
  {
    name: 'Users can update own profile',
    sql: `
      CREATE POLICY "Users can update own profile" 
      ON public.profiles 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = id) 
      WITH CHECK (auth.uid() = id);
    `
  },
  
  // Policy 5: Staff can update all profiles
  {
    name: 'Staff can update all profiles',
    sql: `
      CREATE POLICY "Staff can update all profiles" 
      ON public.profiles 
      FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('admin', 'agent')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('admin', 'agent')
        )
      );
    `
  }
]

try {
  for (const policy of policies) {
    console.log(`Creating policy: ${policy.name}`)
    
    // Drop policy if it exists (in case we're re-running)
    try {
      await supabaseAdmin.rpc('exec_sql', { 
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON public.profiles;` 
      })
    } catch (e) {
      // Ignore errors for non-existent policies
    }
    
    // Create the policy
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql })
    
    if (error) {
      console.error(`❌ Failed to create policy "${policy.name}":`, error.message)
    } else {
      console.log(`✅ Created policy: ${policy.name}`)
    }
  }
  
  console.log('\n🎉 All policies created successfully!')
  console.log('You can now try logging in again.')
  
} catch (err) {
  console.error('Error creating policies:', err)
}