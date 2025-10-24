import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { validateServerSession, startPeriodicValidation, stopPeriodicValidation } from './utils/sessionValidator'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import TeacherDashboard from './pages/TeacherDashboard'
import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard'
import AdminUsers from './pages/admin/Users'
import TicketList from './pages/tickets/TicketList'
import TicketDetail from './pages/tickets/TicketDetail'
import CreateTicket from './pages/tickets/CreateTicket'
import Settings from './pages/Settings'
import PublicTeamChat from './pages/PublicTeamChat'
import Layout from './ui/Layout'
import Protected from './routes/Protected'
import ErrorBoundary from './components/ErrorBoundary'
const Schedule = React.lazy(() => import('./pages/Schedule'))

export default function App() {
  const [sessionValid, setSessionValid] = React.useState(null)

  React.useEffect(() => {
    // Validate server session on app load
    validateServerSession().then(isValid => {
      setSessionValid(isValid)
      
      if (isValid) {
        // Start periodic validation to detect server restarts in real-time
        startPeriodicValidation()
      }
    })
    
    // Cleanup: stop periodic validation when component unmounts
    return () => {
      stopPeriodicValidation()
    }
  }, [])

  // Show loading while validating
  if (sessionValid === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <div className="spinner" style={{ 
          width: 40, 
          height: 40, 
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>Validating session...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/teacher" element={<Protected roles={['user','teacher']}><TeacherDashboard /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin','agent']}><EnhancedAdminDashboard /></Protected>} />
          <Route path="/admin/overview" element={<Protected roles={['admin','agent']}><EnhancedAdminDashboard /></Protected>} />
          <Route path="/admin/analytics" element={<Protected roles={['admin','agent']}><EnhancedAdminDashboard /></Protected>} />
          <Route path="/admin/management" element={<Protected roles={['admin','agent']}><EnhancedAdminDashboard /></Protected>} />
          <Route path="/admin/tickets" element={<Protected roles={['admin','agent']}><EnhancedAdminDashboard /></Protected>} />
          <Route path="/admin/users" element={<Protected roles={['admin','agent']}><AdminUsers /></Protected>} />

          <Route path="/team-chat" element={<Protected roles={['admin','agent','teacher']}><PublicTeamChat /></Protected>} />

          <Route path="/tickets" element={<Protected roles={['admin','agent','user','teacher']}><TicketList /></Protected>} />
          <Route path="/tickets/new" element={<Protected roles={['user','teacher']}><CreateTicket /></Protected>} />
          <Route path="/tickets/:id" element={<Protected roles={['admin','agent','user','teacher']}><TicketDetail /></Protected>} />

          <Route path="/schedule" element={<Protected roles={['teacher','admin']}><React.Suspense fallback={<div className="card">Loading schedule...</div>}><Schedule /></React.Suspense></Protected>} />

          <Route path="/settings" element={<Protected roles={['admin']}><Settings /></Protected>} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}
