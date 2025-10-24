import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { clearServerSession } from '../utils/sessionValidator.js'
import { useUserRole } from '../hooks/useUserRole.js'

// SVG Icons
const Icons = {
  Dashboard: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
    </svg>
  ),
  Tickets: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 11-0-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Menu: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  User: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Overview: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Management: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

export default function ResponsiveLayout({ children }) {
  const { isTeacher, isAdmin: isAdminFromHook } = useUserRole()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [adminViewExpanded, setAdminViewExpanded] = useState(pathname.startsWith('/admin'))

  // Update admin view expansion based on current route
  useEffect(() => {
    setAdminViewExpanded(pathname.startsWith('/admin'))
  }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        fetchUserProfile(data.session.user.id)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) {
        fetchUserProfile(s.user.id)
      } else {
        setUserProfile(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', userId)
        .single()
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signOut = async () => {
    clearServerSession()
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', path: '/' }]
    
    let currentPath = ''
    segments.forEach(segment => {
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ label, path: currentPath })
    })
    
    return breadcrumbs
  }

  const NavLink = ({ to, icon: Icon, children, badge }) => (
    <Link 
      className={`nav-link ${pathname === to || pathname.startsWith(to + '/') ? 'active' : ''}`} 
      to={to}
    >
      <Icon />
      <span>{children}</span>
      {badge && <span className="badge info">{badge}</span>}
    </Link>
  )

  const hideNav = pathname === '/login'
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'agent'
  
  return (
    <div className={`app ${sidebarCollapsed ? 'collapsed' : ''} fade-in`} style={hideNav ? { display: 'block' } : undefined}>
      {!hideNav && (
        <>
          {/* Desktop Sidebar */}
          <aside className="sidebar">
              <div className="sidebar-header">
                <div className="brand">Echoverse Support</div>
                <p className="card-subtitle">Dual‑Portal Ticketing</p>
              </div>
              
              <nav>
                <div className="nav-section">
                  <h3 className="nav-section-title">Main</h3>
                  <div className="nav-links">
                    {isAdmin ? (
                      <>
                        <div className="nav-expandable">
                          <div 
                            className={`nav-link expandable ${pathname.startsWith('/admin') ? 'active' : ''}`}
                            onClick={() => setAdminViewExpanded(!adminViewExpanded)}
                          >
                            <Icons.Dashboard />
                            <span>Admin Dashboard</span>
                            <div className={`expand-icon ${adminViewExpanded ? 'expanded' : ''}`}>
                              <Icons.ChevronRight />
                            </div>
                          </div>
                          {adminViewExpanded && (
                            <div className="nav-sub-links">
                              <Link 
                                className={`nav-sub-link ${(pathname === '/admin' || pathname === '/admin/overview') ? 'active' : ''}`}
                                to="/admin/overview"
                              >
                                <Icons.Overview />
                                <span>Overview</span>
                              </Link>
                              <Link 
                                className={`nav-sub-link ${pathname === '/admin/analytics' ? 'active' : ''}`}
                                to="/admin/analytics"
                              >
                                <Icons.Analytics />
                                <span>Analytics</span>
                              </Link>
                              <Link 
                                className={`nav-sub-link ${pathname === '/admin/management' ? 'active' : ''}`}
                                to="/admin/management"
                              >
                                <Icons.Management />
                                <span>Management</span>
                              </Link>
                              <Link 
                                className={`nav-sub-link ${pathname === '/admin/tickets' ? 'active' : ''}`}
                                to="/admin/tickets"
                              >
                                <Icons.Tickets />
                                <span>Tickets</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <NavLink to="/teacher" icon={Icons.Dashboard}>Teacher Dashboard</NavLink>
                    )}
                    {!isAdmin && <NavLink to="/tickets" icon={Icons.Tickets}>Tickets</NavLink>}
                    {(isTeacher || isAdmin) && <NavLink to="/schedule" icon={Icons.Calendar}>Class Schedule</NavLink>}
                    {!isAdmin && (
                      <NavLink to="/tickets/new" icon={Icons.Plus}>New Ticket</NavLink>
                    )}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="nav-section">
                    <h3 className="nav-section-title">Administration</h3>
                    <div className="nav-links">
                      <NavLink to="/admin/users" icon={Icons.Users}>User Management</NavLink>
                      <NavLink to="/settings" icon={Icons.Settings}>Settings</NavLink>
                    </div>
                  </div>
                )}
                
                {(isAdmin || isTeacher) && (
                  <div className="nav-section">
                    <h3 className="nav-section-title">Communication</h3>
                    <div className="nav-links">
                      <NavLink to="/team-chat" icon={Icons.Chat}>Team Chat</NavLink>
                    </div>
                  </div>
                )}
                
                <div className="nav-section">
                  <h3 className="nav-section-title">Account</h3>
                  <div className="nav-links">
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); signOut(); }}>
                      <Icons.User />
                      <span>Sign Out</span>
                    </a>
                  </div>
                </div>
              </nav>
          </aside>
        </>
      )}
      
      {!hideNav && (
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
              <Icons.Menu />
            </button>
            <div className="breadcrumb">
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <span className="breadcrumb-separator">/</span>}
                  <Link to={crumb.path} style={{ color: index === getBreadcrumbs().length - 1 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <div className="topbar-right">
            {session && userProfile && (
              <div className="row">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                    {userProfile.full_name || 'User'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {userProfile.role || 'user'}
                  </div>
                </div>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--success))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  {(userProfile.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            {!session && pathname !== '/login' && <Link className="btn primary" to="/login">Login</Link>}
          </div>
        </header>
      )}
      
      <main className="main" style={hideNav ? { padding: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, width: '100%' } : undefined}>
        {children}
      </main>
    </div>
  )
}
