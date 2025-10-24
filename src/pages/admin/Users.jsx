import React from 'react'
import { supabase } from '../../supabaseClient.js'
import { api } from '../../lib/api.js'
import '../../styles/enhanced-dashboard.css'

export default function AdminUsers() {
  const [list, setList] = React.useState([])
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState(null)
  const [showDeleteModal, setShowDeleteModal] = React.useState(null)
  const [editFullName, setEditFullName] = React.useState('')
  const [editRole, setEditRole] = React.useState('teacher')
  const [editNewPassword, setEditNewPassword] = React.useState('')
  const [filterRole, setFilterRole] = React.useState('all')
  const [newUserRole, setNewUserRole] = React.useState('teacher')

  // Reset password modal
  const [resetUser, setResetUser] = React.useState(null)
  const [resetPwd1, setResetPwd1] = React.useState('')
  const [resetPwd2, setResetPwd2] = React.useState('')
  const [resetError, setResetError] = React.useState('')
  const [resetting, setResetting] = React.useState(false)

  const refresh = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['teacher', 'agent', 'admin'])
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setList(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message)
    }
  }

  React.useEffect(() => { refresh() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Call server API to create user with role
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ 
          username, 
          password, 
          full_name: fullName,
          role: newUserRole 
        })
      })

      // Clear form and refresh
      setUsername('')
      setPassword('')
      setFullName('')
      setNewUserRole('teacher')
      await refresh()
      alert(`${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} account created successfully!`)
    } catch (error) {
      console.error('Error creating user:', error)
      setError(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const editUser = async (user) => {
    setEditingUser(user)
    setEditFullName(user.full_name || '')
    setEditRole(user.role || 'teacher')
    setEditNewPassword('')
  }

  const saveEdit = async () => {
    if (!editFullName.trim()) {
      setError('Full name is required')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Update profile fields (name, role)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          role: editRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (profileError) throw profileError

      // If new password provided, call admin password reset API
      if (editNewPassword.trim()) {
        await api(`/users/${editingUser.id}/password`, {
          method: 'POST',
          body: JSON.stringify({ password: editNewPassword.trim() })
        })
      }

      setEditingUser(null)
      setEditFullName('')
      setEditRole('teacher')
      setEditNewPassword('')
      await refresh()
      alert('Teacher updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      setError(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditFullName('')
    setEditRole('teacher')
    setEditNewPassword('')
    setError('')
  }

  const deleteUser = async (user) => {
    try {
      setLoading(true)
      setError('')

      // Use server API to delete auth user completely
      await api(`/users/${user.id}`, { method: 'DELETE' })

      setShowDeleteModal(null)
      await refresh()
      alert('Teacher account deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (user) => {
    setShowDeleteModal(user)
  }

  const openReset = (user) => {
    setResetUser(user)
    setResetPwd1('')
    setResetPwd2('')
    setResetError('')
  }

  const submitReset = async () => {
    try {
      setResetting(true)
      setResetError('')
      if (!resetPwd1 || resetPwd1.length < 6) throw new Error('Password must be at least 6 characters')
      if (resetPwd1 !== resetPwd2) throw new Error('Passwords do not match')
      await api(`/users/${resetUser.id}/password`, { method: 'POST', body: JSON.stringify({ password: resetPwd1 }) })
      setResetUser(null)
      alert('Password reset successfully')
    } catch (e) {
      setResetError(e.message || 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  // Filter users by role
  const filteredUsers = filterRole === 'all' 
    ? list 
    : list.filter(user => user.role === filterRole)

  const userCounts = {
    all: list.length,
    teacher: list.filter(u => u.role === 'teacher').length,
    admin: list.filter(u => u.role === 'admin').length,
    agent: list.filter(u => u.role === 'agent').length,
  }

  return (
    <div className="fade-in">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <a href="/admin" className="breadcrumb-link">📊 Dashboard</a>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">User Management</span>
      </div>

      <div className="row space-between mb-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage all user accounts for your support system.</p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="role-filter-tabs">
        <button 
          className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
          onClick={() => setFilterRole('all')}
        >
          👥 All Users <span className="tab-count">{userCounts.all}</span>
        </button>
        <button 
          className={`filter-tab ${filterRole === 'teacher' ? 'active' : ''}`}
          onClick={() => setFilterRole('teacher')}
        >
          👨‍🏫 Teachers <span className="tab-count">{userCounts.teacher}</span>
        </button>
        <button 
          className={`filter-tab ${filterRole === 'admin' ? 'active' : ''}`}
          onClick={() => setFilterRole('admin')}
        >
          👑 Admins <span className="tab-count">{userCounts.admin}</span>
        </button>
        <button 
          className={`filter-tab ${filterRole === 'agent' ? 'active' : ''}`}
          onClick={() => setFilterRole('agent')}
        >
          🎧 Agents <span className="tab-count">{userCounts.agent}</span>
        </button>
      </div>

      {/* Create User Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">➕ Add New User</h2>
          <p className="card-subtitle">Create a new user account with system access</p>
        </div>
        <form onSubmit={createUser}>
          <div className="grid cols-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input 
                className="input" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input 
                className="input" 
                type="password"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                required
              />
            </div>
          </div>
          <div className="grid cols-2">
            <div className="form-group">
              <label className="form-label">Full Name (optional)</label>
              <input 
                className="input" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter full name"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="input"
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
                disabled={loading}
                required
              >
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="admin">👑 Admin</option>
                <option value="agent">🎧 Agent</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="badge danger" style={{ marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}
          
          <button 
            className="btn primary" 
            type="submit" 
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Creating...
              </>
            ) : (
              <>
                ➕ Add {newUserRole === 'teacher' ? 'Teacher' : newUserRole === 'admin' ? 'Admin' : 'Agent'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {filterRole === 'all' && '👥 All Users'}
            {filterRole === 'teacher' && '👨‍🏫 Existing Teachers'}
            {filterRole === 'admin' && '👑 Existing Admins'}
            {filterRole === 'agent' && '🎧 Existing Agents'}
          </h2>
          <p className="card-subtitle">
            {filterRole === 'all' ? 'Manage all user accounts' : 
             filterRole === 'teacher' ? 'Manage your teacher accounts' :
             filterRole === 'admin' ? 'Manage your admin accounts' :
             'Manage your agent accounts'}
          </p>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>User ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(profile => (
                  <tr key={profile.id}>
                    <td>
                      {editingUser?.id === profile.id ? (
                        <div className="edit-mode-grid">
                          <input
                            className="input"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            placeholder="Full name"
                            disabled={loading}
                          />
                          <select
                            className="select"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            disabled={loading}
                          >
                            <option value="teacher">teacher</option>
                            <option value="agent">agent</option>
                            <option value="admin">admin</option>
                          </select>
                          <input
                            className="input"
                            type="password"
                            value={editNewPassword}
                            onChange={(e) => setEditNewPassword(e.target.value)}
                            placeholder="New password (optional)"
                            disabled={loading}
                          />
                          <div className="edit-actions">
                            <button
                              className="btn primary btn-save"
                              onClick={saveEdit}
                              disabled={loading || !editFullName.trim()}
                            >
                              ✓ Save
                            </button>
                            <button
                              className="btn btn-cancel"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 500 }}>
                          {profile.full_name || 'No name'}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUser?.id === profile.id ? (
                        <select
                          className="select"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          disabled={loading}
                        >
                          <option value="teacher">teacher</option>
                          <option value="agent">agent</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: profile.role === 'admin' ? 'var(--danger-bg)' : 'var(--success-bg)',
                            borderColor: profile.role === 'admin' ? 'var(--danger)' : 'var(--success)',
                            color: profile.role === 'admin' ? 'var(--danger)' : 'var(--success)'
                          }}
                        >
                          {profile.role}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', opacity: 0.7, fontFamily: 'monospace' }}>
                      {profile.id.substring(0, 8)}...
                    </td>
                    <td>
                      {editingUser?.id === profile.id ? null : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn ghost"
                            onClick={() => editUser(profile)}
                            disabled={loading}
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: 'var(--text-sm)',
                              color: 'var(--primary-500)'
                            }}
                            title="Edit"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {profile.role === 'teacher' && (
                            <button
                              className="btn ghost"
                              onClick={() => openReset(profile)}
                              disabled={loading}
                              style={{ padding: '4px 8px', fontSize: 'var(--text-sm)', color: 'var(--warning-600)' }}
                              title="Reset password"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v1h1a2 2 0 012 2v4a2 2 0 01-2 2H10a2 2 0 01-2-2v-4a2 2 0 012-2h1v-1c0-3.314 2.686-6 6-6" />
                              </svg>
                            </button>
                          )}
                          <button
                            className="btn ghost"
                            onClick={() => confirmDelete(profile)}
                            disabled={loading}
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: 'var(--text-sm)',
                              color: 'var(--danger)'
                            }}
                            title="Delete"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
            <p>No teachers found. Create your first teacher account above.</p>
          </div>
        )}
      </div>
      
      {/* Reset Password Modal (teachers only) */}
      {resetUser && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setResetUser(null)}
        >
          <div className="card" style={{ maxWidth: 420, width: '90%', margin: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Reset password</h3>
              <p className="card-subtitle">{resetUser.full_name || 'Teacher'}</p>
            </div>
            <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
              <input className="input" type="password" placeholder="New password" value={resetPwd1} onChange={(e)=>setResetPwd1(e.target.value)} />
              <input className="input" type="password" placeholder="Confirm password" value={resetPwd2} onChange={(e)=>setResetPwd2(e.target.value)} />
              {resetError && <div className="badge danger">{resetError}</div>}
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button className="btn ghost" onClick={()=>setResetUser(null)} disabled={resetting}>Cancel</button>
                <button className="btn primary" onClick={submitReset} disabled={resetting || !resetPwd1 || !resetPwd2}> {resetting ? 'Saving…' : 'Save'} </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDeleteModal(null)}
        >
          <div 
            className="card"
            style={{ 
              maxWidth: '400px',
              width: '90%',
              margin: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--danger)' }}>Delete Teacher</h3>
            </div>
            <div style={{ padding: 'var(--space-4)' }}>
              <p style={{ margin: '0 0 var(--space-4) 0' }}>
                Are you sure you want to delete <strong>{showDeleteModal.full_name || 'this teacher'}</strong>? 
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button
                  className="btn ghost"
                  onClick={() => setShowDeleteModal(null)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={() => deleteUser(showDeleteModal)}
                  disabled={loading}
                  style={{
                    backgroundColor: 'var(--danger)',
                    borderColor: 'var(--danger)',
                    color: 'white'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
