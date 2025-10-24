import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'

export default function Protected({ roles = [], children }) {
  const navigate = useNavigate()
  const [ok, setOk] = React.useState(null)
  
  // Stabilize roles array to prevent re-renders
  const rolesString = React.useMemo(() => JSON.stringify(roles), [roles.join(',')])

  React.useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (!roles.length || roles.includes(profile?.role)) setOk(true)
      else navigate('/login')
    })()
  }, [navigate, rolesString, roles])

  if (!ok) return <div className="card">Checking access…</div>
  return children
}
