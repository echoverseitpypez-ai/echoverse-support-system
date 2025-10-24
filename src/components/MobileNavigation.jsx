import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'

const MobileNavigation = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
      }
    }
    
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: profile?.role === 'admin' || profile?.role === 'agent' ? '/admin' : '/teacher',
      icon: '📊',
      roles: ['admin', 'agent', 'teacher']
    },
    {
      name: 'Tickets',
      href: '/tickets',
      icon: '🎫',
      roles: ['admin', 'agent', 'teacher', 'user']
    },
    {
      name: 'Create Ticket',
      href: '/tickets/new',
      icon: '➕',
      roles: ['teacher', 'user']
    },
    {
      name: 'Team Chat',
      href: '/team-chat',
      icon: '💬',
      roles: ['admin', 'agent', 'teacher']
    },
    {
      name: 'Schedule',
      href: '/schedule',
      icon: '📅',
      roles: ['teacher', 'admin']
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: '👥',
      roles: ['admin']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: '⚙️',
      roles: ['admin']
    }
  ]

  const filteredItems = navigationItems.filter(item => 
    profile && item.roles.includes(profile.role)
  )

  const isActive = (href) => {
    return location.pathname === href || 
           (href === '/admin' && location.pathname.startsWith('/admin'))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay open"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile sidebar */}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <div className="user-info">
            <div className="user-avatar">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{profile?.full_name || 'User'}</div>
              <div className="user-role">{profile?.role || 'user'}</div>
            </div>
          </div>
        </div>

        <div className="nav-links">
          {filteredItems.map((item) => (
            <button
              key={item.name}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.href)
                onClose()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="mobile-nav-footer">
          <button
            className="nav-link logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default MobileNavigation
