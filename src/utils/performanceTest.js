// Performance testing utilities for debugging slow loading

export const measureComponentLoad = (componentName, startTime) => {
  const endTime = performance.now()
  const loadTime = endTime - startTime
  
  console.group(`📊 Performance Report: ${componentName}`)
  
  if (loadTime > 2000) {
    console.error(`🔴 VERY SLOW: ${loadTime.toFixed(2)}ms`)
  } else if (loadTime > 1000) {
    console.warn(`🟡 SLOW: ${loadTime.toFixed(2)}ms`)
  } else if (loadTime > 500) {
    console.info(`🟠 ACCEPTABLE: ${loadTime.toFixed(2)}ms`)
  } else {
    console.log(`🟢 FAST: ${loadTime.toFixed(2)}ms`)
  }
  
  // Provide recommendations
  if (loadTime > 1000) {
    console.log('💡 Recommendations:')
    console.log('  - Check network requests (database queries)')
    console.log('  - Review component re-renders')
    console.log('  - Consider memoization')
    console.log('  - Check for blocking operations')
  }
  
  console.groupEnd()
  
  return loadTime
}

export const testDBConnection = async () => {
  console.log('🧪 Testing database connection...')
  
  const startTime = performance.now()
  
  try {
    const { supabase } = await import('../supabaseClient.js')
    
    // Simple query to test DB speed
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    const endTime = performance.now()
    const queryTime = endTime - startTime
    
    if (error) {
      console.error('❌ DB Connection Error:', error.message)
      return false
    }
    
    console.log(`✅ DB Connection: ${queryTime.toFixed(2)}ms`)
    
    if (queryTime > 500) {
      console.warn('⚠️ Database queries are slow - check your internet connection or Supabase status')
    }
    
    return true
  } catch (error) {
    console.error('❌ DB Connection Failed:', error.message)
    return false
  }
}

export const testAuth = async () => {
  console.log('🔐 Testing authentication...')
  
  const startTime = performance.now()
  
  try {
    const { supabase } = await import('../supabaseClient.js')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    const endTime = performance.now()
    const authTime = endTime - startTime
    
    console.log(`🔐 Auth Check: ${authTime.toFixed(2)}ms`)
    
    if (error) {
      console.error('❌ Auth Error:', error.message)
      return false
    }
    
    if (!session) {
      console.warn('⚠️ No active session')
      return false
    }
    
    console.log('✅ User authenticated:', session.user.email)
    return true
  } catch (error) {
    console.error('❌ Auth Test Failed:', error.message)
    return false
  }
}

// Run all performance tests
export const runPerformanceTests = async () => {
  console.group('🚀 Performance Test Suite')
  
  await testDBConnection()
  await testAuth()
  
  console.groupEnd()
}