import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient.js'
import { api } from '../../lib/api.js'

export default function TicketList() {
  const [tickets, setTickets] = React.useState([])
  const [isAdmin, setIsAdmin] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(profile?.role === 'admin')
      let query = supabase.from('tickets').select('*').order('created_at', { ascending: false })
      if (profile?.role !== 'admin' && profile?.role !== 'agent') {
        query = query.eq('created_by', user.id)
      }
      const { data } = await query
      setTickets(data || [])
    })()
  }, [])

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2 style={{margin:0}}>Tickets</h2>
        <div className="row">
          <input placeholder="Search…" className="input" style={{width:260}} />
          <button className="btn">Filter</button>
          <button className="btn primary" onClick={() => navigate('/tickets/new')}>New</button>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Priority</th><th>Updated</th>{isAdmin && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {tickets?.map(t => (
              <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{cursor:'pointer'}}>
                <td>{t.title}</td>
                <td><span className={`badge ${t.status==='open'?'green':'amber'}`}>{t.status}</span></td>
                <td><span className={`badge ${t.priority==='urgent'?'red':t.priority==='high'?'amber':'green'}`}>{t.priority}</span></td>
                <td>{new Date(t.updated_at || t.created_at).toLocaleString()}</td>
                {isAdmin && (
                  <td>
                    <button
                      className="btn ghost sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!window.confirm('Delete this ticket?')) return
                        try {
                          await api(`/tickets/${t.id}`, { method: 'DELETE' })
                          // refresh list
                          setTickets(prev => prev.filter(x => x.id !== t.id))
                        } catch (err) {
                          alert(err.message || 'Failed to delete ticket')
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
