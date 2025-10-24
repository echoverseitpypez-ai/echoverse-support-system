import React, { useState, useEffect } from 'react'
import { api } from '../lib/api.js'

export default function EmailSettings() {
  const [settings, setSettings] = useState({
    email_enabled: false,
    admin_emails: [],
    notify_on_ticket_created: true,
    notify_on_ticket_assigned: true,
    notify_on_ticket_updated: true,
    notify_on_ticket_resolved: true,
    mail_from_name: 'Echoverse Support'
  })
  
  const [newEmail, setNewEmail] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [testStatus, setTestStatus] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await api('/settings/email')
      setSettings(data)
    } catch (error) {
      console.error('Failed to load email settings:', error)
    }
  }

  async function saveSettings() {
    setLoading(true)
    setSaveStatus('')
    try {
      await api('/settings/email', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
      setSaveStatus('✅ Settings saved successfully!')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      setSaveStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function sendTestEmail() {
    if (!testEmail) {
      setTestStatus('❌ Please enter an email address')
      return
    }
    
    setLoading(true)
    setTestStatus('Sending test email...')
    try {
      const result = await api('/email/test', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail })
      })
      setTestStatus(result.message || '✅ Test email sent successfully!')
      setTimeout(() => setTestStatus(''), 5000)
    } catch (error) {
      setTestStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function addAdminEmail() {
    if (!newEmail) return
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      alert('Please enter a valid email address')
      return
    }
    
    // Check for duplicates
    if (settings.admin_emails.includes(newEmail)) {
      alert('This email is already in the list')
      return
    }
    
    setSettings({
      ...settings,
      admin_emails: [...settings.admin_emails, newEmail]
    })
    setNewEmail('')
  }

  function removeAdminEmail(email) {
    setSettings({
      ...settings,
      admin_emails: settings.admin_emails.filter(e => e !== email)
    })
  }

  function toggleNotification(key) {
    setSettings({
      ...settings,
      [key]: !settings[key]
    })
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>📧 Email Notification Settings</h3>
        <p className="muted" style={{ margin: 0 }}>
          Configure email notifications for ticket events
        </p>
      </div>

      {/* Master Toggle */}
      <div style={{ 
        padding: 16, 
        background: settings.email_enabled ? '#f0fdf4' : '#fef2f2', 
        border: `2px solid ${settings.email_enabled ? '#10b981' : '#ef4444'}`,
        borderRadius: 8,
        marginBottom: 24
      }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.email_enabled}
            onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
            style={{ marginRight: 12, width: 20, height: 20, cursor: 'pointer' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {settings.email_enabled ? '✅ Email Notifications Enabled' : '❌ Email Notifications Disabled'}
            </div>
            <div className="muted" style={{ fontSize: 14 }}>
              {settings.email_enabled 
                ? 'All configured email notifications will be sent' 
                : 'No emails will be sent regardless of other settings'}
            </div>
          </div>
        </label>
      </div>

      {/* Admin Emails Section */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Admin Email Recipients</h4>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
          These admins will receive notifications for new tickets and important events
        </p>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="email"
            placeholder="admin@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAdminEmail()}
            style={{ flex: 1 }}
          />
          <button 
            className="btn" 
            onClick={addAdminEmail}
            disabled={!newEmail}
          >
            + Add Email
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {settings.admin_emails.length === 0 ? (
            <div style={{ 
              padding: 16, 
              background: '#fef9c3', 
              border: '1px solid #fde047',
              borderRadius: 6,
              textAlign: 'center',
              fontSize: 14
            }}>
              ⚠️ No admin emails configured. Add at least one email to receive notifications.
            </div>
          ) : (
            settings.admin_emails.map((email, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6
                }}
              >
                <span style={{ fontSize: 14 }}>📧 {email}</span>
                <button
                  className="btn"
                  onClick={() => removeAdminEmail(email)}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '6px 12px',
                    fontSize: 12
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Notification Types</h4>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
          Choose which events trigger email notifications
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12,
            background: '#f9fafb',
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.notify_on_ticket_created}
              onChange={() => toggleNotification('notify_on_ticket_created')}
              disabled={!settings.email_enabled}
              style={{ marginRight: 12, width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>🎫 Ticket Created</div>
              <div className="muted" style={{ fontSize: 13 }}>Notify admins and creator when a new ticket is created</div>
            </div>
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12,
            background: '#f9fafb',
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.notify_on_ticket_assigned}
              onChange={() => toggleNotification('notify_on_ticket_assigned')}
              disabled={!settings.email_enabled}
              style={{ marginRight: 12, width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>👤 Ticket Assigned</div>
              <div className="muted" style={{ fontSize: 13 }}>Notify assignee and creator when a ticket is assigned</div>
            </div>
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12,
            background: '#f9fafb',
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.notify_on_ticket_updated}
              onChange={() => toggleNotification('notify_on_ticket_updated')}
              disabled={!settings.email_enabled}
              style={{ marginRight: 12, width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>🔄 Ticket Updated</div>
              <div className="muted" style={{ fontSize: 13 }}>Notify creator when ticket status changes</div>
            </div>
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 12,
            background: '#f9fafb',
            borderRadius: 6,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.notify_on_ticket_resolved}
              onChange={() => toggleNotification('notify_on_ticket_resolved')}
              disabled={!settings.email_enabled}
              style={{ marginRight: 12, width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>✅ Ticket Resolved</div>
              <div className="muted" style={{ fontSize: 13 }}>Notify creator when their ticket is resolved</div>
            </div>
          </label>
        </div>
      </div>

      {/* Sender Name */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Email Sender Name</h4>
        <input
          type="text"
          placeholder="Echoverse Support"
          value={settings.mail_from_name}
          onChange={(e) => setSettings({ ...settings, mail_from_name: e.target.value })}
          disabled={!settings.email_enabled}
          style={{ width: '100%', maxWidth: 400 }}
        />
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          This name will appear as the sender in notification emails
        </p>
      </div>

      {/* Test Email */}
      <div style={{ 
        padding: 16, 
        background: '#f0f9ff', 
        border: '1px solid #bae6fd',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>🧪 Test Email Configuration</h4>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
          Send a test email to verify your configuration is working
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            className="btn" 
            onClick={sendTestEmail}
            disabled={loading || !testEmail}
          >
            Send Test Email
          </button>
        </div>
        {testStatus && (
          <div style={{ 
            marginTop: 12, 
            padding: 12,
            background: testStatus.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${testStatus.startsWith('✅') ? '#10b981' : '#ef4444'}`,
            borderRadius: 6,
            fontSize: 14
          }}>
            {testStatus}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={saveSettings}
          disabled={loading}
          style={{ minWidth: 150 }}
        >
          {loading ? 'Saving...' : '💾 Save Settings'}
        </button>
        
        {saveStatus && (
          <span style={{ 
            fontSize: 14,
            color: saveStatus.startsWith('✅') ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}>
            {saveStatus}
          </span>
        )}
      </div>

      {/* Configuration Note */}
      <div style={{ 
        marginTop: 24,
        padding: 16,
        background: '#fffbeb',
        border: '1px solid #fde047',
        borderRadius: 8
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>📝 SMTP Configuration Required</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          Email notifications require SMTP credentials to be configured in your <code>.env.server.local</code> file:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li><code>MAIL_SERVER</code> - SMTP server (e.g., smtp.gmail.com)</li>
            <li><code>MAIL_PORT</code> - SMTP port (usually 587)</li>
            <li><code>MAIL_USERNAME</code> - Your email address</li>
            <li><code>MAIL_PASSWORD</code> - SMTP password or app password</li>
            <li><code>MAIL_FROM_EMAIL</code> - Sender email address</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
