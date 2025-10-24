import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import '../styles/design-system.css'
import '../styles/login.css'

function slugify(input) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// SVG Icons
const UserIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

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

export default function Login() {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [tab, setTab] = React.useState('teacher')
  const [mode, setMode] = React.useState('signin') // signin | signup | forgot
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [rememberTeacher, setRememberTeacher] = React.useState(false)
  const [rememberPassword, setRememberPassword] = React.useState(false)
  const [pin, setPin] = React.useState('')
  const [hasSavedPw, setHasSavedPw] = React.useState(false)
  const [unlockPin, setUnlockPin] = React.useState('')
  
  // New features state
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [resetEmail, setResetEmail] = React.useState('')
  const [staySignedIn, setStaySignedIn] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState({})

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
  const validateName = (value) => {
    if (!value) return 'Name is required'
    if (value.length < 3) return 'Name must be at least 3 characters'
    if (value.length > 50) return 'Name is too long'
    return ''
  }

  const validatePassword = (value, isSignup = false) => {
    if (!value) return 'Password is required'
    if (isSignup && value.length < 6) return 'Password must be at least 6 characters'
    if (isSignup && value.length > 100) return 'Password is too long'
    return ''
  }

  const validateConfirm = (value, pwd) => {
    if (!value) return 'Please confirm your password'
    if (value !== pwd) return 'Passwords do not match'
    return ''
  }

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Please enter a valid email'
    return ''
  }

  // Check if user is already logged in
  // Small crypto helpers for encrypting the saved password with a user PIN
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)))
  const b64d = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
  async function deriveKey(pinStr, salt) {
    const keyMat = await crypto.subtle.importKey('raw', enc.encode(pinStr), {name:'PBKDF2'}, false, ['deriveKey'])
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, keyMat, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt'])
  }

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // User is already logged in, fetch their profile and redirect
        const { data: profiles } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
        const profile = profiles?.[0]
        if (profile) {
          if (profile.role === 'admin' || profile.role === 'agent') navigate('/admin')
          else navigate('/teacher')
          return
        }
      }
      // Prefill saved teacher name if present
      const savedRemember = localStorage.getItem('remember:teacher') === '1'
      const savedName = localStorage.getItem('remember:teacher:name') || ''
      setRememberTeacher(savedRemember)
      if (savedRemember && savedName) setName(savedName)
      setHasSavedPw(localStorage.getItem('remember:teacher:hasPw') === '1')
      setLoading(false)
    }
    checkUser()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setError('')
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const emailError = validateEmail(resetEmail)
      if (emailError) {
        setError(emailError)
        setSubmitting(false)
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess('Password reset link sent! Check your email.')
      setTimeout(() => {
        setMode('signin')
        setResetEmail('')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  const signIn = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setSubmitting(true)

    // Validate inputs
    const nameError = validateName(name)
    const passwordError = validatePassword(password)
    
    if (nameError || passwordError) {
      setValidationErrors({
        name: nameError,
        password: passwordError
      })
      setSubmitting(false)
      return
    }

    try {
      const slug = slugify(name)
      const emailFormats = [
        `${slug}@echoverse.local`,
        `${slug}@echoverse.dev`,
        `${name}@echoverse.local`, // legacy fallback
        `${name}@echoverse.dev`,
      ]

      let loginData = null
      let loginError = null

      for (const email of emailFormats) {
        const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          // Set session duration based on staySignedIn
          ...(staySignedIn && { 
            data: { persistent: true }
          })
        }
      })
        if (!error && data.user) { loginData = data; loginError = null; break }
        else loginError = error
      }

      if (loginError && !loginData) throw new Error(loginError.message)

      const data = loginData
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
      // Handle remember me (teacher)
      if (tab === 'teacher') {
        if (rememberTeacher) {
          localStorage.setItem('remember:teacher','1')
          localStorage.setItem('remember:teacher:name', name)
        } else {
          localStorage.removeItem('remember:teacher')
          localStorage.removeItem('remember:teacher:name')
        }
        // Optional: remember password encrypted with a PIN
        if (rememberPassword && pin && password) {
          try {
            const salt = crypto.getRandomValues(new Uint8Array(16))
            const iv = crypto.getRandomValues(new Uint8Array(12))
            const key = await deriveKey(pin, salt)
            const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(password))
            localStorage.setItem('remember:teacher:hasPw','1')
            localStorage.setItem('remember:teacher:pw', b64(ct))
            localStorage.setItem('remember:teacher:pwIV', b64(iv))
            localStorage.setItem('remember:teacher:pwSalt', b64(salt))
          } catch {}
        } else if (!rememberPassword) {
          localStorage.removeItem('remember:teacher:hasPw')
          localStorage.removeItem('remember:teacher:pw')
          localStorage.removeItem('remember:teacher:pwIV')
          localStorage.removeItem('remember:teacher:pwSalt')
        }
      }

      const profile = profiles?.[0]
      if (profileError) throw new Error(`Profile error: ${profileError.message}`)

      if (tab === 'admin' && !(profile?.role === 'admin' || profile?.role === 'agent')) {
        throw new Error('This account is not an admin.')
      }
      
      setSuccess('Welcome back! Redirecting...')
      
      setTimeout(() => {
        if (tab === 'teacher' && (profile?.role === 'admin' || profile?.role === 'agent')) {
          navigate('/admin')
        } else if (profile?.role === 'admin' || profile?.role === 'agent') {
          navigate('/admin')
        } else {
          navigate('/teacher')
        }
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const signUp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setValidationErrors({})
    setSubmitting(true)

    // Validation
    const nameError = validateName(name)
    const passwordError = validatePassword(password, true)
    const confirmError = validateConfirm(confirm, password)
    
    if (nameError || passwordError || confirmError) {
      setValidationErrors({
        name: nameError,
        password: passwordError,
        confirm: confirmError
      })
      setSubmitting(false)
      return
    }

    try {
      const resp = await fetch('/auth/teachers/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      
      // Get response text first
      const text = await resp.text()
      
      // Try to parse as JSON
      let body
      try {
        body = text ? JSON.parse(text) : {}
      } catch (e) {
        console.error('Failed to parse response:', text)
        throw new Error('Invalid response from server. Is the server running?')
      }
      
      if (!resp.ok) {
        throw new Error(body?.error || `Signup failed (${resp.status})`)
      }
      
      if (!body.login_email) {
        throw new Error('Invalid response: missing login email')
      }
      
      setSuccess('Account created successfully! Signing you in...')
      
      // Wait a bit to show success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Immediately sign in using returned login_email
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: body.login_email, 
        password 
      })
      
      if (error) throw new Error(error.message)
      
      // Route based on role (should be teacher)
      const { data: profiles } = await supabase.from('profiles').select('role').eq('id', data.user.id)
      const profile = profiles?.[0]
      
      if (profile?.role === 'admin' || profile?.role === 'agent') {
        navigate('/admin')
      } else {
        navigate('/teacher')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err.message || 'Network error: Is the server running on port 3001?')
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
            <p>Loading your dashboard...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1>Echoverse Support</h1>
          <p>Streamlined support ticket management</p>
        </div>

        {/* Tab Selector */}
        <div className="tab-selector">
          <button 
            type="button" 
            className={`tab-button ${tab === 'teacher' ? 'active' : ''}`} 
            onClick={() => setTab('teacher')}
          >
            <UserIcon />
            Teacher Portal
          </button>
          <button 
            type="button" 
            className={`tab-button ${tab === 'admin' ? 'active' : ''}`} 
            onClick={() => setTab('admin')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Portal
          </button>
        </div>

        {/* Form Content */}
        <div className="form-container">
          <div className="form-header">
            <h2>
              {mode === 'signin' && `Sign in to ${tab} portal`}
              {mode === 'signup' && 'Create your teacher account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p>
              {mode === 'signin' && 'Enter your credentials to continue'}
              {mode === 'signup' && 'Join the support team today'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
            </p>
          </div>

          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address
                </label>
                <input 
                  className="input" 
                  type="email"
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={submitting}
                  autoFocus
                />
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
                  onClick={() => setMode('signin')}
                  disabled={submitting}
                >
                  Back
                </button>
                <button 
                  className="btn primary lg" 
                  type="submit" 
                  disabled={submitting || !resetEmail}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          ) : mode === 'signin' ? (
            <form onSubmit={signIn} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <UserIcon />
                  {tab === 'admin' ? 'Username' : 'Teacher name'}
                </label>
                <input 
                  className={`input ${validationErrors.name ? 'error' : ''}`}
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  placeholder={tab === 'admin' ? 'Enter your username' : 'Enter your name'}
                  disabled={submitting}
                  autoFocus
                />
                {validationErrors.name && (
                  <span className="error-text" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                    {validationErrors.name}
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <LockIcon />
                  Password
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
                    placeholder="Enter your password"
                    disabled={submitting}
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

              {tab === 'teacher' && (
                <div className="column" style={{ gap: 6, margin:'8px 0 0 0' }}>
                  <label className="row" style={{ justifyContent:'space-between' }}>
                    <span className="form-label" style={{display:'flex', alignItems:'center', gap:8, margin:0}}>
                      <input type="checkbox" checked={rememberTeacher} onChange={e=>setRememberTeacher(e.target.checked)} />
                      Remember name on this device
                    </span>
                  </label>

                  <label className="row" style={{ justifyContent:'space-between' }}>
                    <span className="form-label" style={{display:'flex', alignItems:'center', gap:8, margin:0}}>
                      <input type="checkbox" checked={staySignedIn} onChange={e=>setStaySignedIn(e.target.checked)} />
                      Stay signed in (longer session)
                    </span>
                  </label>

                  <label className="row" style={{ justifyContent:'space-between' }}>
                    <span className="form-label" style={{display:'flex', alignItems:'center', gap:8, margin:0}}>
                      <input type="checkbox" checked={rememberPassword} onChange={e=>setRememberPassword(e.target.checked)} />
                      Remember password with a PIN (device-only)
                    </span>
                  </label>
                  {rememberPassword && (
                    <div className="row" style={{ gap:8 }}>
                      <input className="input" style={{maxWidth:140}} placeholder="Set PIN" value={pin} onChange={e=>setPin(e.target.value)} type="password" />
                      <span className="help-text">We encrypt your password locally using this PIN.</span>
                    </div>
                  )}

                  {hasSavedPw && (
                    <div className="row" style={{ gap:8 }}>
                      <input className="input" style={{maxWidth:140}} placeholder="Unlock PIN" value={unlockPin} onChange={e=>setUnlockPin(e.target.value)} type="password" />
                      <button type="button" className="btn" onClick={async ()=>{
                        try {
                          const salt = b64d(localStorage.getItem('remember:teacher:pwSalt')||'')
                          const iv = b64d(localStorage.getItem('remember:teacher:pwIV')||'')
                          const ct = b64d(localStorage.getItem('remember:teacher:pw')||'')
                          const key = await deriveKey(unlockPin, salt)
                          const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct)
                          setPassword(dec.decode(pt))
                        } catch { setError('Invalid PIN for saved password') }
                      }}>Use saved password</button>
                    </div>
                  )}
                </div>
              )}

              <button 
                className="btn primary lg" 
                type="submit" 
                disabled={submitting || !name || !password}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              
              <div className="form-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn ghost" 
                    onClick={() => setMode('forgot')}
                    disabled={submitting}
                    style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                  >
                    Forgot password?
                  </button>
                  <button 
                    type="button" 
                    className="btn ghost" 
                    onClick={() => setMode('signup')}
                    disabled={submitting}
                  >
                    New here? Create account
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={signUp} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <UserIcon />
                  {tab === 'admin' ? 'Username' : 'Teacher name'}
                </label>
                <input 
                  className={`input ${validationErrors.name ? 'error' : ''}`}
                  value={name} 
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  placeholder={tab === 'admin' ? 'Enter your username' : 'Enter your full name'}
                  disabled={submitting}
                  autoFocus
                />
                {validationErrors.name && (
                  <span className="error-text" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                    {validationErrors.name}
                  </span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <LockIcon />
                  Password
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
                    placeholder="Create a secure password"
                    disabled={submitting}
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
                  Confirm password
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
                    placeholder="Confirm your password"
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
                  onClick={() => setMode('signin')}
                  disabled={submitting}
                >
                  Back
                </button>
                <button 
                  className="btn primary lg" 
                  type="submit" 
                  disabled={submitting || !name || !password || !confirm}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner"></div>
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
