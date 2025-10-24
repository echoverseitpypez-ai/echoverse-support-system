import React from 'react'
import { supabase } from '../supabaseClient.js'
import EmailSettings from '../components/EmailSettings.jsx'

export default function Settings() {
  const [status, setStatus] = React.useState('')
  
  // System Settings State
  const [appName, setAppName] = React.useState('Echoverse Support')
  const [timezone, setTimezone] = React.useState('Asia/Seoul')
  const [autoCloseDays, setAutoCloseDays] = React.useState('7')
  const [saveMessage, setSaveMessage] = React.useState('')

  const ping = async () => {
    setStatus('Pinging…')
    const { data: { session } } = await supabase.auth.getSession()
    setStatus(session ? 'Auth OK' : 'No session')
  }
  
  // Load system settings from localStorage
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setAppName(settings.appName || 'Echoverse Support')
      setTimezone(settings.timezone || 'Asia/Seoul')
      setAutoCloseDays(settings.autoCloseDays || '7')
    }
  }, [])
  
  // Save system settings
  const saveSystemSettings = () => {
    const settings = {
      appName,
      timezone,
      autoCloseDays
    }
    localStorage.setItem('systemSettings', JSON.stringify(settings))
    setSaveMessage('Settings saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div>
      <h2 style={{marginTop:0}}>Settings (Admin)</h2>
      
      {/* System Health Check */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontWeight:600}}>System Health</div>
            <div className="muted">Auth/session quick check</div>
          </div>
          <button className="btn" onClick={ping}>Check Auth</button>
        </div>
        <p className="badge" style={{marginTop:10}}>{status || '—'}</p>
      </div>

      {/* Email Settings Component */}
      <EmailSettings />

      {/* System Settings */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{marginBottom: '1.5rem'}}>
          <h3 style={{margin: 0, marginBottom: '0.5rem'}}>⚙️ System Settings</h3>
          <p className="muted" style={{margin: 0}}>Configure app name, timezone, and auto-close rules.</p>
        </div>
        
        <div style={{display: 'grid', gap: '1.5rem'}}>
          {/* App Name */}
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b'}}>
              Application Name
            </label>
            <input
              type="text"
              className="input"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g., Echoverse Support"
              style={{width: '100%', maxWidth: '400px'}}
            />
            <p className="muted" style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>
              Displayed in the header and emails
            </p>
          </div>
          
          {/* Timezone */}
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b'}}>
              Default Timezone
            </label>
            <select
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{width: '100%', maxWidth: '400px'}}
            >
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="Asia/Manila">Asia/Manila (PHT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
              <option value="UTC">UTC</option>
            </select>
            <p className="muted" style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>
              System timezone for timestamps
            </p>
          </div>
          
          {/* Auto-Close Rules */}
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b'}}>
              Auto-Close Resolved Tickets After
            </label>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <input
                type="number"
                className="input"
                value={autoCloseDays}
                onChange={(e) => setAutoCloseDays(e.target.value)}
                min="1"
                max="30"
                style={{width: '100px'}}
              />
              <span style={{color: '#64748b', fontWeight: 500}}>days</span>
            </div>
            <p className="muted" style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>
              Automatically close resolved tickets after this many days (1-30)
            </p>
          </div>
          
          {/* Save Button & Message */}
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem'}}>
            <button 
              className="btn primary" 
              onClick={saveSystemSettings}
              style={{minWidth: '120px'}}
            >
              💾 Save Settings
            </button>
            {saveMessage && (
              <span style={{color: '#16a34a', fontWeight: 600, fontSize: '0.9rem'}}>
                ✓ {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Future: Integrations */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{fontWeight:600}}>🔌 Integrations</div>
        <p className="muted">Connect external services and APIs.</p>
        <p className="badge">Coming Soon</p>
      </div>
    </div>
  )
}
