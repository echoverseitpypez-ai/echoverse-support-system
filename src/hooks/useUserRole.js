import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient.js'

export const useUserRole = () => {
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const uid = data?.session?.user?.id
        
        if (!uid) {
          setLoading(false)
          return
        }
        
        setUserId(uid)
        
        // Get user profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', uid)
          .single()
        
        setUserRole(profile?.role || null)
      } catch (error) {
        console.error('Error checking user role:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkUserRole()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  const isTeacher = userRole === 'teacher'
  const isAdmin = userRole === 'admin' 
  const isStudent = userRole === 'student'

  return {
    userRole,
    userId,
    loading,
    isTeacher,
    isAdmin,
    isStudent
  }
}