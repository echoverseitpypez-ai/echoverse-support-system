import React, { useState, useEffect, useMemo, memo } from 'react'
import { supabase } from '../supabaseClient.js'
import { useNavigate } from 'react-router-dom'
import { useUserRole } from '../hooks/useUserRole.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { usePerformance } from '../hooks/usePerformance.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import { logger } from '../utils/logger.js'
import { PAGINATION } from '../config/constants.js'
import '../styles/design-system.css'

// SVG Icons
const TicketIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const AlertCircleIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

// Next Class Countdown Component
const NextClassCountdown = ({ nextClass }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 })

  useEffect(() => {
    // Safety check: make sure nextClass and startKST exist
    if (!nextClass || !nextClass.startKST) {
      return
    }

    const updateCountdown = () => {
      try {
        const now = new Date()
        const utc = now.getTime() + now.getTimezoneOffset() * 60000
        const nowKST = new Date(utc + 9 * 3600000)
        const currentHours = nowKST.getHours()
        const currentMinutes = nowKST.getMinutes()
        const currentSeconds = nowKST.getSeconds()
        const currentTotalMinutes = currentHours * 60 + currentMinutes + currentSeconds / 60
        
        const [classHours, classMinutes] = nextClass.startKST.split(':').map(Number)
        const classTotalMinutes = classHours * 60 + classMinutes
        
        let minutesLeft = classTotalMinutes - currentTotalMinutes
        
        // If negative, class is in the past or happening now
        if (minutesLeft < 0) {
          minutesLeft += 24 * 60 // Next day
        }
        
        const totalSeconds = Math.floor(minutesLeft * 60)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        
        setTimeLeft({ hours, minutes, seconds, total: totalSeconds })
      } catch (error) {
        logger.error('Countdown error:', error)
      }
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [nextClass])
  
  const isUrgent = timeLeft.total < 600 // Less than 10 minutes
  const isWarning = timeLeft.total < 1800 // Less than 30 minutes
  
  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: '1.5rem',
      borderRadius: '16px',
      background: isUrgent 
        ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
        : isWarning 
        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
        : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: isUrgent 
        ? '2px solid #ef4444' 
        : isWarning 
        ? '2px solid #f59e0b'
        : '2px solid #3b82f6',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      animation: isUrgent ? 'pulse 2s infinite' : 'none'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
      
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'}}>
        <div style={{flex: 1, minWidth: '250px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem'}}>
            <span style={{fontSize: '1.5rem'}}>⏰</span>
            <h3 style={{
              margin: 0, 
              fontSize: '1.1rem', 
              fontWeight: '700',
              color: isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#1e40af'
            }}>
              {timeLeft.hours < 2 ? 'Starting Soon' : 'First Class'}: {nextClass.title}
            </h3>
          </div>
          <div style={{
            fontSize: '0.9rem', 
            color: isUrgent ? '#7f1d1d' : isWarning ? '#78350f' : '#1e3a8a',
            fontWeight: '600'
          }}>
            🇰🇷 Starts at {nextClass.startKST} KST {nextClass.location && `• 📍 ${nextClass.location}`}
          </div>
        </div>
        
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div style={{textAlign: 'center', minWidth: '70px'}}>
            <div style={{
              fontSize: '2.5rem', 
              fontWeight: '900',
              fontFamily: 'monospace',
              color: isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb',
              lineHeight: 1
            }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.7rem', 
              fontWeight: '700',
              color: isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#1e40af',
              marginTop: '0.25rem'
            }}>
              HOURS
            </div>
          </div>
          
          <div style={{
            fontSize: '2rem', 
            fontWeight: '900',
            color: isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb'
          }}>:</div>
          
          <div style={{textAlign: 'center', minWidth: '70px'}}>
            <div style={{
              fontSize: '2.5rem', 
              fontWeight: '900',
              fontFamily: 'monospace',
              color: isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb',
              lineHeight: 1
            }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.7rem', 
              fontWeight: '700',
              color: isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#1e40af',
              marginTop: '0.25rem'
            }}>
              MINUTES
            </div>
          </div>
          
          <div style={{
            fontSize: '2rem', 
            fontWeight: '900',
            color: isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb'
          }}>:</div>
          
          <div style={{textAlign: 'center', minWidth: '70px'}}>
            <div style={{
              fontSize: '2.5rem', 
              fontWeight: '900',
              fontFamily: 'monospace',
              color: isUrgent ? '#dc2626' : isWarning ? '#d97706' : '#2563eb',
              lineHeight: 1
            }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.7rem', 
              fontWeight: '700',
              color: isUrgent ? '#991b1b' : isWarning ? '#92400e' : '#1e40af',
              marginTop: '0.25rem'
            }}>
              SECONDS
            </div>
          </div>
        </div>
      </div>
      
      {isUrgent && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#fee2e2',
          borderRadius: '8px',
          border: '1px solid #ef4444',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '700',
          color: '#991b1b'
        }}>
          ⚠️ Class starting in less than 10 minutes!
        </div>
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  const { measureFunction } = usePerformance('TeacherDashboard')
  const { isTeacher, userRole, loading: roleLoading } = useUserRole()
  const [tickets, setTickets] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  })
const navigate = useNavigate()

// Class schedule state (from Schedule page stored in localStorage)
const [scheduleToday, setScheduleToday] = useState([])
const [nextClass, setNextClass] = useState(null)

// Quick Notes, To-do, Sticky Notes
const [quickNotes, setQuickNotes] = useState('')
const [todos, setTodos] = useState([])
const [newTodo, setNewTodo] = useState('')
const [stickyNotes, setStickyNotes] = useState([])
const [newSticky, setNewSticky] = useState('')

// Popup windows state
const [scheduleWindow, setScheduleWindow] = useState(null)
const [notesWindow, setNotesWindow] = useState(null)
const [todoWindow, setTodoWindow] = useState(null)
const [stickyWindow, setStickyWindow] = useState(null)

// Filters, search, sorting, pagination
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300) // Debounce search for 300ms
const [statusFilter, setStatusFilter] = useState('all')
const [priorityFilter, setPriorityFilter] = useState('all')
const [sortBy, setSortBy] = useState('newest')
const [page, setPage] = useState(1)
const PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE

const filteredTickets = useMemo(() => {
  if (!Array.isArray(tickets) || tickets.length === 0) return []
  
  let data = tickets
  
  // Apply filters
  if (debouncedSearch.trim()) {
    const q = debouncedSearch.trim().toLowerCase()
    data = data.filter(t => 
      (t.title || '').toLowerCase().includes(q) || 
      (t.description || '').toLowerCase().includes(q)
    )
  }
  
  if (statusFilter !== 'all') {
    data = data.filter(t => t.status === statusFilter)
  }
  
  if (priorityFilter !== 'all') {
    data = data.filter(t => t.priority === priorityFilter)
  }
  
  // Sort the data
  const priorityRank = { urgent: 4, high: 3, normal: 2, low: 1 }
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'oldest':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      case 'priority':
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0)
      case 'status':
        return String(a.status || '').localeCompare(String(b.status || ''))
      default:
        return 0
    }
  })
}, [tickets, debouncedSearch, statusFilter, priorityFilter, sortBy])

const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
const currentPage = Math.min(page, totalPages)
const pageItems = useMemo(() => {
  const start = (currentPage - 1) * PAGE_SIZE
  return filteredTickets.slice(start, start + PAGE_SIZE)
}, [filteredTickets, currentPage])

const exportCSV = () => {
  const rows = [
    ['id','title','status','priority','created_at'],
    ...filteredTickets.map(t => [t.id, t.title, t.status, t.priority, t.created_at])
  ]
  const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tickets.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const resetFilters = () => {
  setSearch('')
  setStatusFilter('all')
  setPriorityFilter('all')
  setSortBy('newest')
  setPage(1)
}

const refresh = () => { loadDashboardData() }

  // Load user data and tickets
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (!roleLoading && mounted) {
        await loadDashboardData()
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, [roleLoading, navigate])

  // Load notes, todos, sticky notes from localStorage
  useEffect(() => {
    const user = supabase.auth.getUser().then(({data}) => {
      if (data?.user?.id) {
        const userId = data.user.id
        const savedNotes = localStorage.getItem(`quickNotes:${userId}`)
        const savedTodos = localStorage.getItem(`todos:${userId}`)
        const savedStickies = localStorage.getItem(`stickyNotes:${userId}`)
        
        if (savedNotes) setQuickNotes(savedNotes)
        if (savedTodos) setTodos(JSON.parse(savedTodos))
        if (savedStickies) setStickyNotes(JSON.parse(savedStickies))
      }
    })
  }, [])

  // Save quick notes to localStorage
  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if (data?.user?.id) {
        localStorage.setItem(`quickNotes:${data.user.id}`, quickNotes)
      }
    })
  }, [quickNotes])

  // Save todos to localStorage
  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if (data?.user?.id) {
        localStorage.setItem(`todos:${data.user.id}`, JSON.stringify(todos))
      }
    })
  }, [todos])

  // Save sticky notes to localStorage
  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if (data?.user?.id) {
        localStorage.setItem(`stickyNotes:${data.user.id}`, JSON.stringify(stickyNotes))
      }
    })
  }, [stickyNotes])

  // Time helpers (match Schedule page)
  const toPHTime = (hhmm) => {
    const [h, m] = String(hhmm||'00:00').split(':').map(Number)
    const phH = (h + 24 - 1) % 24; const pad=(n)=>String(n).padStart(2,'0')
    return `${pad(phH)}:${pad(m)}`
  }
  const to12h = (hhmm) => { const [h,m]=String(hhmm||'00:00').split(':').map(Number); const ap=h>=12?'PM':'AM'; const h12=h%12||12; return `${h12}:${String(m).padStart(2,'0')} ${ap}` }
  const timeAddMinutes = (hhmm, minutes) => {
    const [h,m]=String(hhmm||'00:00').split(':').map(Number); const total=h*60+m+(minutes||0);
    const hh=Math.floor((((total%(24*60))+(24*60))%(24*60))/60); const mm=(((total%60)+60)%60); const pad=(n)=>String(n).padStart(2,'0');
    return `${pad(hh)}:${pad(mm)}`
  }

  // Popup window functions
  const openSchedulePopup = () => {
    if (scheduleWindow && !scheduleWindow.closed) {
      scheduleWindow.close()
      setScheduleWindow(null)
      return
    }

    const width = 400
    const height = 500
    const left = window.screen.width - width - 50
    const top = 100
    
    const newWindow = window.open('', 'SchedulePopup', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)
    
    if (newWindow) {
      const scheduleHTML = scheduleToday.map(cls => {
        const endKST = timeAddMinutes(cls.startKST, cls.durationMin)
        return `
          <div style="background: rgba(255,255,255,0.15); border-left: 4px solid ${cls.color || '#fff'}; border-radius: 10px; padding: 0.75rem; margin-bottom: 0.75rem;">
            <div style="font-weight: 700; margin-bottom: 0.25rem;">${cls.title}</div>
            <div style="font-size: 0.85rem; opacity: 0.9;">🇰🇷 ${cls.startKST} – ${endKST} • 🇵🇭 ${to12h(toPHTime(cls.startKST))} – ${to12h(toPHTime(endKST))}</div>
            ${cls.location ? `<div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem;">📍 ${cls.location}</div>` : ''}
          </div>
        `
      }).join('')

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>📅 Today's Schedule</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 1.5rem;
              min-height: 100vh;
            }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 0.9rem; opacity: 0.9; margin-bottom: 1.5rem; }
            .empty { text-align: center; padding: 2rem 0; opacity: 0.7; }
          </style>
        </head>
        <body>
          <h1>📅 Today's Schedule</h1>
          <div class="subtitle">${scheduleToday.length} ${scheduleToday.length === 1 ? 'class' : 'classes'} today</div>
          ${scheduleToday.length === 0 ? '<div class="empty">No classes scheduled today</div>' : scheduleHTML}
        </body>
        </html>
      `)
      newWindow.document.close()
      setScheduleWindow(newWindow)
    }
  }

  const openNotesPopup = () => {
    if (notesWindow && !notesWindow.closed) {
      notesWindow.close()
      setNotesWindow(null)
      return
    }

    const width = 450
    const height = 400
    const left = window.screen.width - width - 50
    const top = 100
    
    const newWindow = window.open('', 'NotesPopup', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`)
    
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>📝 Quick Notes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 1.5rem;
              min-height: 100vh;
            }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 0.9rem; opacity: 0.9; margin-bottom: 1.5rem; }
            textarea {
              width: 100%;
              height: 250px;
              padding: 1rem;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.3);
              background: rgba(255,255,255,0.2);
              color: white;
              font-size: 1rem;
              font-family: inherit;
              resize: none;
            }
            textarea::placeholder { color: rgba(255,255,255,0.6); }
          </style>
        </head>
        <body>
          <h1>📝 Quick Notes</h1>
          <div class="subtitle">Jot down quick thoughts</div>
          <textarea id="notes" placeholder="Type your notes here...">${quickNotes}</textarea>
          <script>
            const textarea = document.getElementById('notes');
            textarea.addEventListener('input', (e) => {
              try {
                window.opener.postMessage({ type: 'updateNotes', value: e.target.value }, '*');
              } catch(err) { logger.error(err); }
            });
          </script>
        </body>
        </html>
      `)
      newWindow.document.close()
      setNotesWindow(newWindow)
    }
  }

  const openTodoPopup = () => {
    if (todoWindow && !todoWindow.closed) {
      todoWindow.close()
      setTodoWindow(null)
      return
    }

    const width = 400
    const height = 500
    const left = window.screen.width - width - 50
    const top = 100
    
    const newWindow = window.open('', 'TodoPopup', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)
    
    if (newWindow) {
      const todosHTML = todos.map(todo => `
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.15); border-radius: 8px; margin-bottom: 0.5rem;">
          <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="window.opener.postMessage({type:'toggleTodo', id:${todo.id}}, '*')" style="cursor: pointer;">
          <span style="flex: 1; text-decoration: ${todo.done ? 'line-through' : 'none'}; opacity: ${todo.done ? '0.6' : '1'};">${todo.text}</span>
          <button onclick="window.opener.postMessage({type:'deleteTodo', id:${todo.id}}, '*')" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.2rem; opacity: 0.7;">×</button>
        </div>
      `).join('')

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>✅ To-Do List</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              padding: 1.5rem;
              min-height: 100vh;
            }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 0.9rem; opacity: 0.9; margin-bottom: 1.5rem; }
            .add-task { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
            input[type="text"] {
              flex: 1;
              padding: 0.75rem;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
              background: rgba(255,255,255,0.2);
              color: white;
              font-size: 0.95rem;
            }
            input::placeholder { color: rgba(255,255,255,0.6); }
            button {
              padding: 0.75rem 1.25rem;
              border-radius: 8px;
              border: none;
              background: rgba(255,255,255,0.3);
              color: white;
              cursor: pointer;
              font-weight: 700;
              font-size: 1rem;
            }
            .empty { text-align: center; padding: 1rem; opacity: 0.7; }
          </style>
        </head>
        <body>
          <h1>✅ To-Do List</h1>
          <div class="subtitle">${todos.filter(t => !t.done).length} pending</div>
          <div class="add-task">
            <input type="text" id="newTask" placeholder="Add a task..." onkeypress="if(event.key==='Enter') addTask()">
            <button onclick="addTask()">+</button>
          </div>
          <div id="todoList">${todos.length === 0 ? '<div class="empty">No tasks yet</div>' : todosHTML}</div>
          <script>
            function addTask() {
              const input = document.getElementById('newTask');
              if (input.value.trim()) {
                window.opener.postMessage({ type: 'addTodo', text: input.value }, '*');
                input.value = '';
              }
            }
          </script>
        </body>
        </html>
      `)
      newWindow.document.close()
      setTodoWindow(newWindow)
    }
  }

  const openStickyPopup = () => {
    if (stickyWindow && !stickyWindow.closed) {
      stickyWindow.close()
      setStickyWindow(null)
      return
    }

    const width = 400
    const height = 500
    const left = window.screen.width - width - 50
    const top = 100
    
    const newWindow = window.open('', 'StickyPopup', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)
    
    if (newWindow) {
      const stickiesHTML = stickyNotes.map(note => `
        <div style="position: relative; padding: 0.75rem; background: rgba(255,255,255,0.9); color: #333; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="padding-right: 1.5rem; font-size: 0.9rem;">${note.text}</div>
          <button onclick="window.opener.postMessage({type:'deleteSticky', id:${note.id}}, '*')" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; color: #666; cursor: pointer; font-size: 1.2rem; font-weight: bold;">×</button>
        </div>
      `).join('')

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>📌 Sticky Notes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
              color: white;
              padding: 1.5rem;
              min-height: 100vh;
            }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .subtitle { font-size: 0.9rem; opacity: 0.9; margin-bottom: 1.5rem; }
            .add-note { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
            input[type="text"] {
              flex: 1;
              padding: 0.75rem;
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.3);
              background: rgba(255,255,255,0.2);
              color: white;
              font-size: 0.95rem;
            }
            input::placeholder { color: rgba(255,255,255,0.6); }
            button {
              padding: 0.75rem 1.25rem;
              border-radius: 8px;
              border: none;
              background: rgba(255,255,255,0.3);
              color: white;
              cursor: pointer;
              font-weight: 700;
              font-size: 1rem;
            }
            .empty { text-align: center; padding: 1rem; opacity: 0.7; }
          </style>
        </head>
        <body>
          <h1>📌 Sticky Notes</h1>
          <div class="subtitle">${stickyNotes.length} ${stickyNotes.length === 1 ? 'note' : 'notes'}</div>
          <div class="add-note">
            <input type="text" id="newNote" placeholder="Add a sticky note..." onkeypress="if(event.key==='Enter') addNote()">
            <button onclick="addNote()">+</button>
          </div>
          <div id="notesList">${stickyNotes.length === 0 ? '<div class="empty">No sticky notes</div>' : stickiesHTML}</div>
          <script>
            function addNote() {
              const input = document.getElementById('newNote');
              if (input.value.trim()) {
                window.opener.postMessage({ type: 'addSticky', text: input.value }, '*');
                input.value = '';
              }
            }
          </script>
        </body>
        </html>
      `)
      newWindow.document.close()
      setStickyWindow(newWindow)
    }
  }

  // Listen for messages from popup windows
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'updateNotes') {
        setQuickNotes(event.data.value)
      } else if (event.data.type === 'addTodo') {
        setTodos(prev => [...prev, { id: Date.now(), text: event.data.text, done: false }])
      } else if (event.data.type === 'toggleTodo') {
        setTodos(prev => prev.map(t => t.id === event.data.id ? { ...t, done: !t.done } : t))
      } else if (event.data.type === 'deleteTodo') {
        setTodos(prev => prev.filter(t => t.id !== event.data.id))
      } else if (event.data.type === 'addSticky') {
        setStickyNotes(prev => [...prev, { id: Date.now(), text: event.data.text, color: '#ffd93d' }])
      } else if (event.data.type === 'deleteSticky') {
        setStickyNotes(prev => prev.filter(n => n.id !== event.data.id))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Refresh todo popup when todos change
  useEffect(() => {
    if (todoWindow && !todoWindow.closed) {
      const todosHTML = todos.map(todo => `
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.15); border-radius: 8px; margin-bottom: 0.5rem;">
          <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="window.opener.postMessage({type:'toggleTodo', id:${todo.id}}, '*')" style="cursor: pointer;">
          <span style="flex: 1; text-decoration: ${todo.done ? 'line-through' : 'none'}; opacity: ${todo.done ? '0.6' : '1'};">${todo.text}</span>
          <button onclick="window.opener.postMessage({type:'deleteTodo', id:${todo.id}}, '*')" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.2rem; opacity: 0.7;">×</button>
        </div>
      `).join('')

      const listDiv = todoWindow.document.getElementById('todoList')
      const subtitle = todoWindow.document.querySelector('.subtitle')
      if (listDiv) {
        listDiv.innerHTML = todos.length === 0 ? '<div class="empty">No tasks yet</div>' : todosHTML
      }
      if (subtitle) {
        subtitle.textContent = `${todos.filter(t => !t.done).length} pending`
      }
    }
  }, [todos, todoWindow])

  // Refresh sticky popup when sticky notes change
  useEffect(() => {
    if (stickyWindow && !stickyWindow.closed) {
      const stickiesHTML = stickyNotes.map(note => `
        <div style="position: relative; padding: 0.75rem; background: rgba(255,255,255,0.9); color: #333; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="padding-right: 1.5rem; font-size: 0.9rem;">${note.text}</div>
          <button onclick="window.opener.postMessage({type:'deleteSticky', id:${note.id}}, '*')" style="position: absolute; top: 0.5rem; right: 0.5rem; background: transparent; border: none; color: #666; cursor: pointer; font-size: 1.2rem; font-weight: bold;">×</button>
        </div>
      `).join('')

      const listDiv = stickyWindow.document.getElementById('notesList')
      const subtitle = stickyWindow.document.querySelector('.subtitle')
      if (listDiv) {
        listDiv.innerHTML = stickyNotes.length === 0 ? '<div class="empty">No sticky notes</div>' : stickiesHTML
      }
      if (subtitle) {
        subtitle.textContent = `${stickyNotes.length} ${stickyNotes.length === 1 ? 'note' : 'notes'}`
      }
    }
  }, [stickyNotes, stickyWindow])

  const loadDashboardData = measureFunction(async () => {
    try {
      setLoading(true)
      
      // Check authentication with retry logic
      let user = null
      let attempts = 0
      const maxAttempts = 3
      
      while (!user && attempts < maxAttempts) {
        const { data: { user: userData }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          logger.error(`Auth attempt ${attempts + 1} failed:`, authError.message)
          if (attempts === maxAttempts - 1) {
            throw new Error(`Authentication failed after ${maxAttempts} attempts: ${authError.message}`)
          }
          // Wait 500ms before retry
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
          continue
        }
        
        user = userData
        break
      }
      
      if (!user) {
        logger.warn('No authenticated user found after retries')
        navigate('/login')
        return
      }

      // Load profile and tickets in parallel for better performance
      const [profileResult, ticketsResult] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('tickets')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Limit for performance
      ])
      
      // Handle profile data
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        setProfile(profileResult.value.data)
      } else if (profileResult.status === 'rejected') {
        logger.error('Failed to load profile:', profileResult.reason)
      }
      
      // Handle tickets data
      let ticketsData = []
      if (ticketsResult.status === 'fulfilled' && ticketsResult.value.data) {
        ticketsData = ticketsResult.value.data
        setTickets(ticketsData)
      } else if (ticketsResult.status === 'rejected') {
        logger.error('Failed to load tickets:', ticketsResult.reason)
        setTickets([])
      }

      // Load and process class schedule (only for teachers)
      if (isTeacher) {
        try {
          const saved = window.localStorage.getItem(`classSchedules:${user.id}`)
          if (saved) {
            const items = JSON.parse(saved)
            const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
            const now = new Date()
            const utc = now.getTime() + now.getTimezoneOffset() * 60000
            const nowKST = new Date(utc + 9 * 3600000)
            const todayIdx = ((nowKST.getDay() + 6) % 7) // 0..6
            const curHM = `${String(nowKST.getHours()).padStart(2,'0')}:${String(nowKST.getMinutes()).padStart(2,'0')}`
            const todayName = DAYS[todayIdx]
            const todays = items.filter(it => it.day === todayName).sort((a,b) => a.startKST.localeCompare(b.startKST))
            
            setScheduleToday(todays)
            
            const upcoming = todays.find(it => it.startKST >= curHM) || todays[0]
            if (upcoming) {
              const endKST = timeAddMinutes(upcoming.startKST, upcoming.durationMin)
              setNextClass({
                title: upcoming.title,
                startKST: upcoming.startKST,
                endKST: endKST,
                location: upcoming.location,
                durationMin: upcoming.durationMin,
                primary: `KST ${upcoming.startKST}–${endKST}`,
                secondary: `PH ${to12h(toPHTime(upcoming.startKST))}–${to12h(toPHTime(endKST))}`
              })
            } else {
              setNextClass(null)
            }
          } else {
            setScheduleToday([])
            setNextClass(null)
          }
        } catch (scheduleError) {
          logger.error('Error processing schedule data:', scheduleError)
          setScheduleToday([])
          setNextClass(null)
        }
      }

      // Calculate stats
      const ticketStats = (ticketsData || []).reduce((acc, ticket) => {
        acc.total++
        switch (ticket.status) {
          case 'open': acc.open++; break
          case 'in_progress': acc.inProgress++; break
          case 'resolved': acc.resolved++; break
          case 'closed': acc.closed++; break
        }
        return acc
      }, { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 })

      setStats(ticketStats)
    } catch (error) {
      logger.error('Error loading dashboard data:', error)
      // Show user-friendly error message
      setTickets([])
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, 'loadDashboardData')

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'primary'
      case 'in_progress': return 'warning'
      case 'resolved': return 'success'
      case 'closed': return 'gray'
      default: return 'gray'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger'
      case 'high': return 'warning'
      case 'normal': return 'primary'
      case 'low': return 'gray'
      default: return 'gray'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  if (loading || roleLoading) {
    return (
      <div className="container">
        <div className="flex center" style={{ minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

// Toolbar component (inline) - Memoized for performance
  const Toolbar = memo(({ profile, nextClass, todayCount, onSearch, onNew, onSchedule, onRefresh }) => {
    const [now, setNow] = useState(new Date())
    useEffect(() => { 
      const t = setInterval(() => setNow(new Date()), 1000) // Update every 1 second for real-time clock
      return () => clearInterval(t) 
    }, [])
    const utc = now.getTime() + now.getTimezoneOffset()*60000
    const kst = new Date(utc + 9*3600000)
    const ph = new Date(utc + 8*3600000)
    const pad = (n)=>String(n).padStart(2,'0')
    const kstStr = `${pad(kst.getHours())}:${pad(kst.getMinutes())}:${pad(kst.getSeconds())}`
    const phH = ph.getHours()%12 || 12
    const phStr = `${phH}:${pad(ph.getMinutes())}:${pad(ph.getSeconds())} ${ph.getHours()>=12?'PM':'AM'}`
    const initial = (profile?.full_name||'T').charAt(0).toUpperCase()
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap'}}>
          {/* Left Section - Welcome */}
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px'}}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: '800',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              {initial}
            </div>
            <div>
              <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem'}}>
                Welcome back, {profile?.full_name || 'Teacher'}
              </div>
              <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: '500'}}>
                Manage your tickets and requests
              </div>
            </div>
          </div>

          {/* Center Section - Time Clocks */}
          <div style={{display: 'flex', gap: '1rem', flex: '0 1 auto'}}>
            <div style={{
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '12px',
              border: '1px solid #3b82f6',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '0.7rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem'}}>KST</div>
              <div style={{fontSize: '1.1rem', fontWeight: '800', color: '#1e40af', fontFamily: 'monospace'}}>{kstStr}</div>
            </div>
            <div style={{
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '1px solid #f59e0b',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '0.7rem', fontWeight: '700', color: '#92400e', marginBottom: '0.25rem'}}>PH</div>
              <div style={{fontSize: '1.1rem', fontWeight: '800', color: '#92400e', fontFamily: 'monospace'}}>{phStr}</div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div style={{display: 'flex', gap: '0.75rem', flex: '0 1 auto', flexWrap: 'wrap'}}>
            {isTeacher && (
              <button 
                onClick={onSchedule}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                📅 Class Schedule
              </button>
            )}
            <button 
              onClick={onRefresh}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              🔄 Refresh
            </button>
            <button 
              onClick={onNew}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <PlusIcon /> New Ticket
            </button>
          </div>
        </div>
      </div>
    )
  })

  return (
    <ErrorBoundary>
      <div className="container fade-in">
        {/* Teacher toolbar */}
        <Toolbar profile={profile} nextClass={nextClass} todayCount={scheduleToday.length} onSearch={(v)=>{ setSearch(v); setPage(1) }} onNew={()=>navigate('/tickets/new')} onSchedule={()=>navigate('/schedule')} onRefresh={refresh} />

        {/* Next Class Countdown */}
        {nextClass && <NextClassCountdown nextClass={nextClass} />}

      {/* Stats Cards */}
      <div className="grid cols-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            margin: '0 auto var(--space-3)', 
            background: 'var(--primary-100)', 
            borderRadius: 'var(--radius-xl)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-600)'
          }}>
            <TicketIcon />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#000000 !important', fontWeight: '900' }}>
            {loading ? '—' : stats.total}
          </h3>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Total Tickets</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            margin: '0 auto var(--space-3)', 
            background: 'var(--warning-100)', 
            borderRadius: 'var(--radius-xl)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--warning-600)'
          }}>
            <ClockIcon />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#000000 !important', fontWeight: '900' }}>
            {loading ? '—' : (stats.open + stats.inProgress)}
          </h3>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Active Tickets</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            margin: '0 auto var(--space-3)', 
            background: 'var(--success-100)', 
            borderRadius: 'var(--radius-xl)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--success-600)'
          }}>
            <CheckCircleIcon />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#000000 !important', fontWeight: '900' }}>
            {loading ? '—' : stats.resolved}
          </h3>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Resolved</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            margin: '0 auto var(--space-3)', 
            background: 'var(--danger-100)', 
            borderRadius: 'var(--radius-xl)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--danger-600)'
          }}>
            <AlertCircleIcon />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#000000 !important', fontWeight: '900' }}>
            {loading ? '—' : stats.open}
          </h3>
          <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Need Attention</p>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Today's Schedule Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)', color: '#1e293b', minHeight: '300px', position: 'relative' }}>
          <button
            onClick={openSchedulePopup}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            {scheduleWindow && !scheduleWindow.closed ? '✓ Opened' : '🪟 Pop Out'}
          </button>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>📅 Today's Schedule</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>
              {scheduleToday.length} {scheduleToday.length === 1 ? 'class' : 'classes'} today
            </p>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {scheduleToday.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', opacity: 0.7 }}>
                  <p>No classes scheduled today</p>
                  <button 
                    onClick={() => navigate('/schedule')} 
                    style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem 1rem', 
                      background: 'rgba(255,255,255,0.2)', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      cursor: 'pointer' 
                    }}
                  >
                    Add Schedule
                  </button>
                </div>
              ) : (
                scheduleToday.map((cls, idx) => {
                  const endKST = timeAddMinutes(cls.startKST, cls.durationMin)
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(255,255,255,0.5)', 
                        borderRadius: '10px', 
                        padding: '0.75rem', 
                        marginBottom: '0.75rem',
                        borderLeft: `4px solid ${cls.color || '#6366f1'}`
                      }}
                    >
                      <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{cls.title}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                        🇰🇷 {cls.startKST} – {endKST} • 🇵🇭 {to12h(toPHTime(cls.startKST))} – {to12h(toPHTime(endKST))}
                      </div>
                      {cls.location && <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>📍 {cls.location}</div>}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Notes Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fecaca 100%)', color: '#1e293b', minHeight: '300px', position: 'relative' }}>
          <button
            onClick={openNotesPopup}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            {notesWindow && !notesWindow.closed ? '✓ Opened' : '🪟 Pop Out'}
          </button>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>📝 Quick Notes</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>Jot down quick thoughts</p>
            <textarea
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="Type your notes here..."
              style={{
                width: '100%',
                height: '180px',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.6)',
                color: '#1e293b',
                fontSize: '0.9rem',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* To-Do List Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e293b', minHeight: '300px', position: 'relative' }}>
          <button
            onClick={openTodoPopup}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            {todoWindow && !todoWindow.closed ? '✓ Opened' : '🪟 Pop Out'}
          </button>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>✅ To-Do List</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>
              {todos.filter(t => !t.done).length} pending
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTodo.trim()) {
                      setTodos([...todos, { id: Date.now(), text: newTodo, done: false }])
                      setNewTodo('')
                    }
                  }}
                  placeholder="Add a task..."
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.6)',
                    color: '#1e293b',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={() => {
                    if (newTodo.trim()) {
                      setTodos([...todos, { id: Date.now(), text: newTodo, done: false }])
                      setNewTodo('')
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.8)',
                    color: '#1e293b',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
              {todos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.7 }}>No tasks yet</div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.5)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => {
                        setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.6 : 1 }}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        opacity: 0.7
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sticky Notes Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#1e293b', minHeight: '300px', position: 'relative' }}>
          <button
            onClick={openStickyPopup}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#1e293b',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            {stickyWindow && !stickyWindow.closed ? '✓ Opened' : '🪟 Pop Out'}
          </button>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>📌 Sticky Notes</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>
              {stickyNotes.length} {stickyNotes.length === 1 ? 'note' : 'notes'}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newSticky}
                  onChange={(e) => setNewSticky(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newSticky.trim()) {
                      setStickyNotes([...stickyNotes, { id: Date.now(), text: newSticky, color: '#ffd93d' }])
                      setNewSticky('')
                    }
                  }}
                  placeholder="Add a sticky note..."
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.6)',
                    color: '#1e293b',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={() => {
                    if (newSticky.trim()) {
                      setStickyNotes([...stickyNotes, { id: Date.now(), text: newSticky, color: '#ffd93d' }])
                      setNewSticky('')
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.8)',
                    color: '#1e293b',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
              {stickyNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.7 }}>No sticky notes</div>
              ) : (
                stickyNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      position: 'relative',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#333',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ paddingRight: '1.5rem', fontSize: '0.9rem' }}>{note.text}</div>
                    <button
                      onClick={() => setStickyNotes(stickyNotes.filter(n => n.id !== note.id))}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="card-header">
          <div className="flex between" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 className="card-title">Your Support Tickets</h2>
              <p className="card-subtitle">Track and manage all your support requests</p>
            </div>
            <div className="row" style={{ gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                aria-label="Search tickets"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search title or description"
                style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }}
              />
              <select aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }}>
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }} style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }}>
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <select aria-label="Sort tickets" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '8px' }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <button className="btn ghost sm" onClick={resetFilters}>Reset</button>
              <button className="btn primary sm" onClick={exportCSV}>Export CSV</button>
              <button className="btn ghost sm" onClick={refresh}>Refresh</button>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto var(--space-4)', 
              background: 'var(--gray-100)', 
              borderRadius: 'var(--radius-2xl)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--gray-400)'
            }}>
              <TicketIcon />
            </div>
            <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--gray-700)' }}>No tickets yet</h3>
            <p style={{ color: 'var(--gray-500)', margin: '0 0 var(--space-4) 0' }}>
              Create your first support ticket to get help with any issues
            </p>
            <button 
              className="btn primary"
              onClick={() => navigate('/tickets/new')}
            >
              <PlusIcon />
              Create Your First Ticket
            </button>
          </div>
        ) : (
          filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-6)' }}>
              <h3 style={{ margin: 0, color: 'var(--gray-700)' }}>No matching tickets</h3>
              <p style={{ color: 'var(--gray-500)', marginTop: 'var(--space-2)' }}>Try adjusting your filters or search.</p>
              <button className="btn ghost" onClick={resetFilters} style={{ marginTop: 'var(--space-4)' }}>Reset Filters</button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>
                            {ticket.title}
                          </div>
                          {ticket.description && (
                            <div style={{ 
                              fontSize: 'var(--text-sm)', 
                              color: 'var(--gray-500)', 
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {ticket.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                      <td>
                        <button 
                          className="btn ghost sm"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          title="View ticket"
                        >
                          <EyeIcon />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex between" style={{ marginTop: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length}
                </div>
                <div className="row" style={{ gap: '6px' }}>
                  <button className="btn ghost sm" disabled={currentPage === 1} onClick={() => setPage(1)}>First</button>
                  <button className="btn ghost sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                  <span style={{ alignSelf: 'center' }}>Page {currentPage} / {totalPages}</span>
                  <button className="btn ghost sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                  <button className="btn ghost sm" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last</button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}
