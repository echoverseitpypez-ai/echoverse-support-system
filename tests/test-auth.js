import { supabase } from './lib/supabase/client.js'

async function testAuth() {
  try {
    console.log('🔐 Testing Supabase Authentication...')
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message)
      return
    }
    
    if (!session) {
      console.log('⚠️  No active session found. Please log in first.')
      return
    }
    
    console.log('✅ Session found')
    console.log('User ID:', session.user.id)
    console.log('Email:', session.user.email)
    console.log('Token exists:', !!session.access_token)
    console.log('Token length:', session.access_token?.length)
    
    // Test API call to your Express backend
    console.log('\n🌐 Testing API call to Express backend...')
    
    const response = await fetch('http://localhost:3001/api/analytics/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    console.log('Response Status:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API call successful!')
      console.log('Response data keys:', Object.keys(data))
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.log('❌ API call failed')
      console.log('Error:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()