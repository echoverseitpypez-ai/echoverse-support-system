import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient.js'

export default function CreateTicket() {
  const navigate = useNavigate()
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState('normal')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [selectedCubicle, setSelectedCubicle] = React.useState(null)

  const quickReport = (template) => {
    const cubicleText = selectedCubicle ? `Cubicle ${selectedCubicle}: ` : ''
    setTitle(cubicleText + template.title)
    setDescription(template.description)
    setPriority(template.priority)
  }

  const quickTemplates = [
    // Hardware Issues
    { title: "Computer Freezing", description: "My computer is freezing/not responding properly.", priority: 'high', icon: '🖥️', category: 'Hardware' },
    { title: "Internet Connection Problem", description: "No internet connection or very slow network.", priority: 'high', icon: '🌐', category: 'Network' },
    { title: "Hardware Problems", description: "Hardware equipment issues (printer, mouse, keyboard, etc.)", priority: 'normal', icon: '🔧', category: 'Hardware' },
    { title: "Monitor Issue", description: "Monitor display problems (flickering, no signal, etc.)", priority: 'normal', icon: '🖥️', category: 'Hardware' },
    
    // Software Issues
    { title: "Boda App Issue", description: "Problem with the Boda application.", priority: 'high', icon: '📱', category: 'Software' },
    { title: "Software Not Opening", description: "Application won't start or crashes on launch.", priority: 'normal', icon: '⚠️', category: 'Software' },
    { title: "Email Problems", description: "Cannot send/receive emails or email client issues.", priority: 'normal', icon: '📧', category: 'Software' },
    
    // Access Issues
    { title: "Can't Login", description: "Unable to log in to my account.", priority: 'high', icon: '🔐', category: 'Access' },
    { title: "Password Reset", description: "Need to reset my password.", priority: 'normal', icon: '🔑', category: 'Access' },
    { title: "Permission Denied", description: "Don't have access to required files or systems.", priority: 'normal', icon: '🚫', category: 'Access' },
    
    // Urgent Issues
    { title: "Emergency - System Down", description: "Critical system is completely down and affecting work.", priority: 'urgent', icon: '🚨', category: 'Emergency' },
    { title: "Data Loss", description: "Important data has been lost or deleted.", priority: 'urgent', icon: '💾', category: 'Emergency' },
    
    // General
    { title: "Bug Report", description: "I found a bug. Steps to reproduce:\n1. \n2. \n3. ", priority: 'normal', icon: '🐛', category: 'General' },
    { title: "Feature Request", description: "I would like to suggest a new feature: ", priority: 'low', icon: '💡', category: 'General' },
    { title: "Training Needed", description: "Need training or help learning to use a system/feature.", priority: 'low', icon: '📚', category: 'General' },
    { title: "Other Issue", description: "Please describe your issue: ", priority: 'normal', icon: '❓', category: 'General' },
  ]

  const cubicles = Array.from({ length: 20 }, (_, i) => i + 1)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }
    const { error } = await supabase.from('tickets').insert({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'open',
      created_by: user.id,
    })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/tickets')
  }

  return (
    <div style={{maxWidth:900}}>
      <h2 style={{marginTop:0}}>Create Ticket</h2>
      
      {/* Quick Reports Section */}
      <div className="card" style={{marginBottom:'1.5rem', background:'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', border:'1px solid #cbd5e1', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h3 style={{margin:0, fontSize:'1.5rem', fontWeight:'700', color:'#1e293b'}}>Quick Reports</h3>
          <p style={{margin:0, color:'#64748b', fontSize:'0.9rem'}}>
            Select your cubicle then click a quick report to create a ticket instantly
          </p>
        </div>

        {/* Cubicle Selection */}
        <div style={{marginBottom:'1.5rem'}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontWeight:'600', color:'#334155', fontSize:'1rem'}}>Select Cubicle</label>
          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'0.5rem'}}>
            {cubicles.map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedCubicle(num)}
                style={{
                  padding:'0.7rem',
                  borderRadius:'8px',
                  border: selectedCubicle === num ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                  background: selectedCubicle === num ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#ffffff',
                  color: selectedCubicle === num ? '#fff' : '#334155',
                  cursor:'pointer',
                  fontWeight: selectedCubicle === num ? '700' : '600',
                  transition:'all 0.2s ease',
                  fontSize:'0.95rem',
                  boxShadow: selectedCubicle === num ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Report Categories */}
        <div>
          {['Hardware', 'Software', 'Network', 'Access', 'Emergency', 'General'].map(category => {
            const categoryTemplates = quickTemplates.filter(t => t.category === category)
            if (categoryTemplates.length === 0) return null
            
            return (
              <div key={category} style={{marginBottom:'1rem'}}>
                <h4 style={{fontSize:'0.85rem', textTransform:'uppercase', color:'#64748b', marginBottom:'0.5rem', fontWeight:'700', letterSpacing:'1px'}}>
                  {category}
                </h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.5rem'}}>
                  {categoryTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn"
                      onClick={() => quickReport(template)}
                      style={{
                        textAlign:'left',
                        padding:'0.8rem 1rem',
                        fontSize:'0.875rem',
                        display:'flex',
                        alignItems:'center',
                        gap:'0.7rem',
                        background: template.priority === 'urgent' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 
                                   template.priority === 'high' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                                   category === 'Hardware' ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' :
                                   category === 'Software' ? 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' :
                                   category === 'Network' ? 'linear-gradient(135deg, #ddd6fe, #c4b5fd)' :
                                   category === 'Access' ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)' :
                                   'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                        border: template.priority === 'urgent' ? '1.5px solid #f87171' : 
                               template.priority === 'high' ? '1.5px solid #fbbf24' : 
                               category === 'Hardware' ? '1.5px solid #60a5fa' :
                               category === 'Software' ? '1.5px solid #818cf8' :
                               category === 'Network' ? '1.5px solid #a78bfa' :
                               category === 'Access' ? '1.5px solid #f472b6' :
                               '1.5px solid #9ca3af',
                        color: template.priority === 'urgent' ? '#991b1b' : 
                              template.priority === 'high' ? '#92400e' : '#1e293b',
                        fontWeight: '600',
                        transition:'all 0.2s ease',
                        boxShadow:'0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)'
                        e.currentTarget.style.borderWidth = '2px'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        e.currentTarget.style.borderWidth = '1.5px'
                      }}
                    >
                      <span style={{fontSize:'1.3rem'}}>{template.icon}</span>
                      <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {template.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Manual Form */}
      <h3 style={{marginBottom:'1rem', fontSize:'1.2rem'}}>Or Create Manually</h3>
      <form className="grid" onSubmit={submit}>
        <div>
          <label>Title</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Priority</label>
          <select className="select" value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label>Description</label>
          <textarea className="textarea" rows={6} value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        {error && <p className="badge red">{error}</p>}
        <div className="row" style={{justifyContent:'flex-end'}}>
          <button type="button" className="btn" onClick={() => navigate('/tickets')}>Cancel</button>
          <button className="btn primary" disabled={loading}>{loading?'Submitting…':'Create Ticket'}</button>
        </div>
      </form>
    </div>
  )
}
