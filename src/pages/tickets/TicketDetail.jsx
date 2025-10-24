import React from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient.js'

export default function TicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')

  React.useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tickets').select('*').eq('id', id).single()
      setTicket(t)
      const { data: m } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
      setMessages(m || [])
    })()
  }, [id])

  const send = async (e) => {
    e.preventDefault()
    const user = (await supabase.auth.getUser()).data.user
    if (!user || !text.trim()) return
    const { data, error } = await supabase.from('ticket_messages').insert({
      ticket_id: id,
      sender: user.id,
      body: text.trim(),
    }).select('*').single()
    if (!error) {
      setMessages((prev) => [...prev, data])
      setText('')
    }
  }

  if (!ticket) return <div>Loading…</div>

  return (
    <div>
      <h2 style={{marginTop:0}}>{ticket.title}</h2>
      <div className="row">
        <span className="badge amber">{ticket.status}</span>
        <span className="badge">Priority: {ticket.priority}</span>
      </div>
      <div className="card">
        <form onSubmit={send} className="grid">
          <textarea className="textarea" rows={3} placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row" style={{justifyContent:'flex-end'}}>
            <button className="btn" type="button" onClick={()=>setText('')}>Clear</button>
            <button className="btn primary" type="submit">Send</button>
          </div>
        </form>
      </div>
      <div>
        {messages.map(m => (
          <div key={m.id} className="card">
            <div style={{opacity:.7, fontSize:12}}>{new Date(m.created_at).toLocaleString()}</div>
            <div style={{marginTop:4}}>{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
