import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import '../styles/design-system.css'
import '../styles/login.css'

// SVG Icons
const LockIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState({})
  const [validSession, setValidSession] = React.useState(false)

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 10) strength++
    if (pwd.length >= 14) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981']
    
    return { 
      strength, 
      label: labels[strength] || 'Very Weak', 
      color: colors[strength] || '#ef4444',
      percentage: (strength / 6) * 100
    }
  }

  // Validation functions
  const validatePassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    if (value.length > 100) return 'Password is too long'
    return ''
  }

  const validateConfirm = (value, pwd) => {
    if (!value) return 'Please confirm your password'
    if (value !== pwd) return 'Passwords do not match'
    return ''
  }

  React.useEffect(() => {
    // Check if we have a valid password recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired reset link. Please request a new one.')
          setLoading(false)
          return
        }

        if (!session) {
          setError('No active session. Please use the reset link from your email.')
          setLoading(false)
          return
        }

        // Check if this is a password recovery flow
        setValidSession(true)
        setLoading(false)
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Failed to verify reset link.')
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setSubmitting(true)

    // Validate inputs
    const passwordError = validatePassword(password)
    const confirmError = validateConfirm(confirm, password)
    
    if (passwordError || confirmError) {
      setValidationErrors({
        password: passwordError,
        confirm: confirmError
      })
      setSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess('Password updated successfully! Redirecting to login...')
      
      // Wait a bit then redirect
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error('Reset error:', err)
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card slide-up">
          <div className="login-header">
            <div className="login-icon">
              <div className="spinner"></div>
            </div>
            <h1>Echoverse Support</h1>
            <p>Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-header">
            <div className="login-icon">
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1>Invalid Reset Link</h1>
            <p>This password reset link is invalid or has expired</p>
          </div>
          
          <div className="form-container">
            {error && (
              <div className="alert error">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <button 
              className="btn primary lg" 
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>

        {/* Form */}
        <div className="form-container">
          <form onSubmit={handleReset} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <LockIcon />
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`input ${validationErrors.password ? 'error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  placeholder="Enter new password"
                  disabled={submitting}
                  autoFocus
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="error-text" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  {validationErrors.password}
                </span>
              )}
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Password strength:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getPasswordStrength(password).color }}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${getPasswordStrength(password).percentage}%`, 
                        height: '100%', 
                        backgroundColor: getPasswordStrength(password).color,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <LockIcon />
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`input ${validationErrors.confirm ? 'error' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm} 
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (validationErrors.confirm) {
                      setValidationErrors(prev => ({ ...prev, confirm: '' }))
                    }
                  }}
                  placeholder="Confirm new password"
                  disabled={submitting}
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {validationErrors.confirm && (
                <span className="error-text" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  {validationErrors.confirm}
                </span>
              )}
            </div>

            {error && (
              <div className="alert error slide-up">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="alert success slide-up">
                <CheckIcon />
                {success}
              </div>
            )}

            <div className="flex" style={{ gap: 'var(--space-3)' }}>
              <button 
                className="btn secondary" 
                type="button" 
                onClick={() => navigate('/login')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn primary lg" 
                type="submit" 
                disabled={submitting || !password || !confirm}
                style={{ flex: 1 }}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Updating...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
