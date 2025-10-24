import React from 'react'
import { supabase } from '../supabaseClient.js'
import { useUserRole } from '../hooks/useUserRole.js'

// Utility: KST (UTC+9) to PH (UTC+8) is -1 hour; no DST for both.
const toPHTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  let phH = (h + 24 - 1) % 24
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(phH)}:${pad(m)}` // 24h HH:mm
}

const to12h = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}

const timeAddMinutes = (hhmm, minutes) => {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(((total % (24 * 60)) + (24 * 60)) % (24 * 60) / 60)
  const mm = ((total % 60) + 60) % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(hh)}:${pad(mm)}`
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function Schedule() {
  const { isTeacher, isAdmin, userRole, userId, loading: roleLoading } = useUserRole()
  const [items, setItems] = React.useState([])
  const [editingId, setEditingId] = React.useState(null)
  const [primaryTZ, setPrimaryTZ] = React.useState('KST') // UI preference only
  const [viewMode, setViewMode] = React.useState('list')
  const [query, setQuery] = React.useState('')
  const [clockWindow, setClockWindow] = React.useState(null)
  const [teachers, setTeachers] = React.useState([])
  const [selectedTeacherId, setSelectedTeacherId] = React.useState(null)
  const [form, setForm] = React.useState({
    title: '',
    day: 'Mon',
    startKST: '09:00',
    durationMin: 60,
    color: '#3b82f6',
    location: '',
    notes: ''
  })

  // Fetch all teachers if user is admin
  React.useEffect(() => {
    const fetchTeachers = async () => {
      if (isAdmin && !roleLoading) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'teacher')
            .order('full_name')
          
          if (error) throw error
          setTeachers(data || [])
          
          // Set first teacher as default selection if available
          if (data && data.length > 0 && !selectedTeacherId) {
            setSelectedTeacherId(data[0].id)
          }
        } catch (error) {
          console.error('Error fetching teachers:', error)
        }
      }
    }
    fetchTeachers()
  }, [isAdmin, roleLoading, selectedTeacherId])

  // Load schedule data from Supabase
  React.useEffect(() => {
    const loadSchedules = async () => {
      // Determine which user's schedule to load
      const targetUserId = isAdmin ? selectedTeacherId : userId
      
      if ((isTeacher || isAdmin) && targetUserId && !roleLoading) {
        try {
          const { data, error } = await supabase
            .from('class_schedules')
            .select(`
              id,
              day_of_week,
              start_time,
              end_time,
              room,
              building,
              notes,
              subjects (
                name,
                code,
                color
              )
            `)
            .eq('teacher_id', targetUserId)
            .eq('is_active', true)
          
          if (error) throw error
          
          // Transform Supabase data to match local format
          const transformedData = (data || []).map(item => {
            const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const startTime = item.start_time?.substring(0, 5) || '09:00'
            const endTime = item.end_time?.substring(0, 5) || '10:00'
            
            // Calculate duration
            const [startH, startM] = startTime.split(':').map(Number)
            const [endH, endM] = endTime.split(':').map(Number)
            const durationMin = (endH * 60 + endM) - (startH * 60 + startM)
            
            return {
              id: item.id,
              title: item.subjects?.name || 'Unknown Class',
              day: dayMap[item.day_of_week] || 'Mon',
              startKST: startTime,
              durationMin: durationMin > 0 ? durationMin : 60,
              color: item.subjects?.color || '#3b82f6',
              location: item.room ? `${item.room}${item.building ? ', ' + item.building : ''}` : '',
              notes: item.notes || ''
            }
          })
          
          setItems(transformedData)
        } catch (error) {
          console.error('Error loading schedule data:', error)
        }
      }
    }
    loadSchedules()
  }, [isTeacher, isAdmin, userId, selectedTeacherId, roleLoading])

  const resetForm = () => {
    setForm({ title: '', day: 'Mon', startKST: '09:00', durationMin: 60, color: '#3b82f6', location: '', notes: '' })
    setEditingId(null)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const payload = {
      id: editingId || crypto.randomUUID(),
      ...form,
      durationMin: Number(form.durationMin)
    }
    let next
    if (editingId) {
      next = items.map(it => it.id === editingId ? payload : it)
    } else {
      next = [...items, payload]
    }
    // sort by day index then KST time
    next.sort((a,b) => {
      const d = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      if (d !== 0) return d
      return a.startKST.localeCompare(b.startKST)
    })
    setItems(next)
    persist(next)
    resetForm()
  }

  const onEdit = (id) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    setForm({ title: it.title, day: it.day, startKST: it.startKST, durationMin: it.durationMin, color: it.color || '#3b82f6', location: it.location || '', notes: it.notes || '' })
    setEditingId(id)
  }

  const onDelete = (id) => {
    const next = items.filter(x => x.id !== id)
    setItems(next)
    persist(next)
    if (editingId === id) resetForm()
  }

  const grouped = React.useMemo(() => {
    const g = {}
    for (const d of DAYS) g[d] = []
    items.filter(it => !query || it.title.toLowerCase().includes(query.toLowerCase()))
         .forEach(it => g[it.day]?.push(it))
    return g
  }, [items, query])

  // Stats: total classes, total minutes, next upcoming (based on KST)
  const stats = React.useMemo(() => {
    const totalClasses = items.length
    const totalMinutes = items.reduce((a,b)=>a + Number(b.durationMin||0), 0)

    const dayIdx = (d) => ({Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[d]||1)
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset()*60000
    const nowKST = new Date(utc + 9*3600000)
    const curDow = ((nowKST.getDay()+6)%7)+1 // Mon=1..Sun=7
    const curHM = `${String(nowKST.getHours()).padStart(2,'0')}:${String(nowKST.getMinutes()).padStart(2,'0')}`

    const future = [...items].sort((a,b)=>{
      const d = dayIdx(a.day) - dayIdx(b.day)
      if (d!==0) return d
      return a.startKST.localeCompare(b.startKST)
    }).find(it => {
      const di = dayIdx(it.day)
      if (di > curDow) return true
      if (di === curDow && it.startKST >= curHM) return true
      return false
    }) || [...items].sort((a,b)=>{
      const d = dayIdx(a.day) - dayIdx(b.day)
      if (d!==0) return d
      return a.startKST.localeCompare(b.startKST)
    })[0]

    if (!future) return { totalClasses, totalMinutes, next: null }
    const endKST = timeAddMinutes(future.startKST, future.durationMin)
    const startPH = toPHTime(future.startKST)
    const endPH = toPHTime(endKST)
    const startPH12 = to12h(startPH)
    const endPH12 = to12h(endPH)
    return { totalClasses, totalMinutes, next: { ...future, endKST, startPH, endPH, startPH12, endPH12 } }
  }, [items])

  const DayPill = ({ label, count }) => (
    <div className="row" style={{ justifyContent:'space-between', width:'100%' }}>
      <strong>{label}</strong>
      <span className="badge info">{count}</span>
    </div>
  )

  const dayColors = {
    Mon:'#3b82f6', Tue:'#6366f1', Wed:'#a855f7', Thu:'#06b6d4', Fri:'#10b981', Sat:'#f59e0b', Sun:'#ef4444'
  }

  const TimeChip = ({ label }) => (
    <span className="pill">{label}</span>
  )

  const copyPH = (it) => {
    const endKST = timeAddMinutes(it.startKST, it.durationMin)
    const text = `PH ${to12h(toPHTime(it.startKST))}–${to12h(toPHTime(endKST))} (${it.title})`
    navigator.clipboard?.writeText(text)
  }

  // Open Korean Time in new window
  const openClockWindow = () => {
    // Close existing window if open
    if (clockWindow && !clockWindow.closed) {
      clockWindow.close()
      setClockWindow(null)
      return
    }

    // Open new popup window
    const width = 320
    const height = 240
    const left = window.screen.width - width - 50
    const top = 100
    
    const newWindow = window.open(
      '',
      'KSTClock',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`
    )

    if (newWindow) {
      // Write the clock HTML to the new window
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>🇰🇷 Korea Time (KST)</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .container {
              text-align: center;
              color: white;
              padding: 2rem;
            }
            .flag { font-size: 3rem; margin-bottom: 1rem; }
            .title {
              font-size: 1rem;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 1.5rem;
              opacity: 0.9;
            }
            .time {
              font-family: 'Courier New', monospace;
              font-size: 3rem;
              font-weight: 800;
              text-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
              margin-bottom: 0.5rem;
              background: rgba(255, 255, 255, 0.15);
              padding: 1rem 1.5rem;
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            .label {
              font-size: 0.9rem;
              opacity: 0.8;
              margin-bottom: 0.5rem;
            }
            .date {
              font-size: 0.85rem;
              opacity: 0.7;
              margin-top: 1rem;
            }
            .sync-status {
              margin-top: 1rem;
              padding: 0.5rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              font-size: 0.75rem;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
            }
            .pulse {
              animation: pulse 2s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="flag">🇰🇷</div>
            <div class="title">KOREA TIME</div>
            <div class="time" id="time">Loading...</div>
            <div class="label">KST (UTC+9)</div>
            <div class="date" id="date"></div>
            <div class="sync-status">
              <span id="sync-icon" class="pulse">🟡</span>
              <span id="sync-text">Syncing...</span>
            </div>
          </div>
          <script>
            let timeOffset = 0;
            
            // Sync time with online service
            async function syncTime() {
              try {
                document.getElementById('sync-icon').textContent = '🟡';
                document.getElementById('sync-text').textContent = 'Syncing...';
                
                const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul');
                const data = await response.json();
                const serverTime = new Date(data.datetime).getTime();
                timeOffset = serverTime - Date.now();
                
                document.getElementById('sync-icon').textContent = '🟢';
                document.getElementById('sync-text').textContent = 'Synced';
                console.log('✅ Time synced! Offset:', timeOffset + 'ms');
              } catch (error) {
                console.error('Time sync failed:', error);
                document.getElementById('sync-icon').textContent = '🔴';
                document.getElementById('sync-text').textContent = 'Using local time';
                timeOffset = 0;
              }
            }
            
            // Update clock display
            function updateClock() {
              const now = new Date(Date.now() + timeOffset);
              const utc = now.getTime() + now.getTimezoneOffset() * 60000;
              const kst = new Date(utc + 9 * 3600000);
              
              const hours = String(kst.getHours()).padStart(2, '0');
              const minutes = String(kst.getMinutes()).padStart(2, '0');
              const seconds = String(kst.getSeconds()).padStart(2, '0');
              
              document.getElementById('time').textContent = hours + ':' + minutes + ':' + seconds;
              
              const options = { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' };
              document.getElementById('date').textContent = kst.toLocaleDateString('en-US', options);
            }
            
            // Initial sync
            syncTime();
            
            // Re-sync every 30 minutes
            setInterval(syncTime, 30 * 60 * 1000);
            
            // Update clock every second
            setInterval(updateClock, 1000);
            updateClock();
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
      setClockWindow(newWindow)
    }
  }

  // Live clocks component (KST 24h, PH 12h) with online time sync
  const LiveClocks = () => {
    const [now, setNow] = React.useState(new Date())
    const [timeOffset, setTimeOffset] = React.useState(0) // Offset from server time
    const [syncStatus, setSyncStatus] = React.useState('syncing') // 'synced', 'syncing', 'error'
    const [lastSync, setLastSync] = React.useState(null)

    // Sync time with online service
    const syncTime = React.useCallback(async () => {
      try {
        setSyncStatus('syncing')
        const startTime = Date.now()
        
        // Fetch from WorldTimeAPI (free, no API key needed)
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul')
        const data = await response.json()
        
        const endTime = Date.now()
        const latency = (endTime - startTime) / 2 // Estimate one-way latency
        
        // Calculate offset: server time - local time + latency compensation
        const serverTime = new Date(data.datetime).getTime() + latency
        const offset = serverTime - endTime
        
        setTimeOffset(offset)
        setLastSync(new Date())
        setSyncStatus('synced')
        console.log(`✅ Time synced! Offset: ${offset}ms, Latency: ${latency.toFixed(0)}ms`)
      } catch (error) {
        console.error('Time sync failed:', error)
        setSyncStatus('error')
        // Fallback to local time
        setTimeOffset(0)
      }
    }, [])

    // Initial sync and periodic re-sync every 30 minutes
    React.useEffect(() => {
      syncTime()
      const syncInterval = setInterval(syncTime, 30 * 60 * 1000) // Re-sync every 30 min
      return () => clearInterval(syncInterval)
    }, [syncTime])

    // Update clock every second
    React.useEffect(() => {
      const t = setInterval(() => setNow(new Date(Date.now() + timeOffset)), 1000)
      return () => clearInterval(t)
    }, [timeOffset])
    const utc = now.getTime() + now.getTimezoneOffset()*60000
    const kst = new Date(utc + 9*3600000)
    const ph = new Date(utc + 8*3600000)
    const pad = (n)=>String(n).padStart(2,'0')
    const kstStr = `${pad(kst.getHours())}:${pad(kst.getMinutes())}:${pad(kst.getSeconds())}`
    const phH = ph.getHours()%12 || 12
    const phStr = `${phH}:${pad(ph.getMinutes())}:${pad(ph.getSeconds())} ${ph.getHours()>=12?'PM':'AM'}`
    const mkAngles = (d)=>({
      s: d.getSeconds()*6,
      m: d.getMinutes()*6 + d.getSeconds()*0.1,
      h: (d.getHours()%12)*30 + d.getMinutes()*0.5,
    })
    const aK = mkAngles(kst); const aP = mkAngles(ph)
    const ClockSVG = ({angles, accentColor}) => (
      <svg width="80" height="80" viewBox="0 0 100 100" style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.1)'}}>
        <defs>
          <linearGradient id={`clockGrad-${accentColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:accentColor, stopOpacity:0.2}} />
            <stop offset="100%" style={{stopColor:accentColor, stopOpacity:0.05}} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill={`url(#clockGrad-${accentColor})`} stroke={accentColor} strokeWidth="3"/>
        {[...Array(12)].map((_,i)=>{
          const angle = i*30; const r = 42; const isHour = i%3===0;
          const x1 = 50+r*Math.sin(angle*Math.PI/180); const y1 = 50-r*Math.cos(angle*Math.PI/180);
          const x2 = 50+(r-(isHour?6:3))*Math.sin(angle*Math.PI/180); const y2 = 50-(r-(isHour?6:3))*Math.cos(angle*Math.PI/180);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeWidth={isHour?2.5:1.5} opacity={0.5}/>
        })}
        <line x1="50" y1="50" x2="50" y2="22" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angles.h} 50 50)`}/>
        <line x1="50" y1="50" x2="50" y2="15" stroke="#475569" strokeWidth="3" strokeLinecap="round" transform={`rotate(${angles.m} 50 50)`}/>
        <line x1="50" y1="50" x2="50" y2="12" stroke={accentColor} strokeWidth="2" strokeLinecap="round" transform={`rotate(${angles.s} 50 50)`}/>
        <circle cx="50" cy="50" r="3" fill={accentColor} />
        <circle cx="50" cy="50" r="1.5" fill="#fff" />
      </svg>
    )
    // Sync status indicator
    const SyncIndicator = () => {
      const statusConfig = {
        synced: { icon: '🟢', text: 'Synced', color: '#10b981' },
        syncing: { icon: '🟡', text: 'Syncing...', color: '#f59e0b' },
        error: { icon: '🔴', text: 'Local time', color: '#ef4444' }
      }
      const config = statusConfig[syncStatus]
      const timeSinceSync = lastSync ? Math.floor((Date.now() - lastSync) / 1000) : null
      
      return (
        <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'6px 12px', background:'rgba(255,255,255,0.8)', borderRadius:'8px', fontSize:'0.8rem', boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
          <span>{config.icon}</span>
          <span style={{color:config.color, fontWeight:'600'}}>{config.text}</span>
          {syncStatus === 'synced' && timeSinceSync !== null && (
            <span style={{color:'#64748b', fontSize:'0.75rem'}}>({timeSinceSync}s ago)</span>
          )}
          <button 
            onClick={syncTime} 
            style={{marginLeft:'4px', padding:'2px 6px', background:'transparent', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', fontSize:'0.75rem', color:'#64748b'}}
            title="Sync now"
          >
            🔄
          </button>
        </div>
      )
    }

    return (
      <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h2 style={{margin:0, fontSize:'1.3rem', fontWeight:'700', color:'#1e293b'}}>⏰ Live Time</h2>
          <SyncIndicator />
        </div>
        <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
          <div className="stat-card" style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)', border:'2px solid #3b82f6', boxShadow:'0 4px 6px -1px rgba(59, 130, 246, 0.2)'}}>
            <div>
              <div className="stat-label" style={{color:'#1e40af', fontWeight:'600', fontSize:'0.95rem'}}>🇰🇷 Korea (KST)</div>
              <div className="stat-value" style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:'2rem', color:'#1e3a8a', fontWeight:'700'}}>{kstStr}</div>
              <div style={{color:'#3b82f6', fontSize:'0.85rem', marginTop:'4px'}}>24-hour format</div>
            </div>
            <ClockSVG angles={aK} accentColor="#3b82f6" />
          </div>
          <div className="stat-card" style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)', border:'2px solid #f59e0b', boxShadow:'0 4px 6px -1px rgba(245, 158, 11, 0.2)'}}>
            <div>
              <div className="stat-label" style={{color:'#92400e', fontWeight:'600', fontSize:'0.95rem'}}>🇵🇭 Philippines (PH)</div>
              <div className="stat-value" style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:'2rem', color:'#78350f', fontWeight:'700'}}>{phStr}</div>
              <div style={{color:'#d97706', fontSize:'0.85rem', marginTop:'4px'}}>12-hour format</div>
            </div>
            <ClockSVG angles={aP} accentColor="#f59e0b" />
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (roleLoading) {
    return (
      <div className="container">
        <div className="flex center" style={{ minHeight: '400px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }
  
  // Access control - only teachers and admins can access class schedule
  if (!isTeacher && !isAdmin) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ padding: '3rem' }}>
            <h2 style={{ color: 'var(--danger-600)', marginBottom: '1rem' }}>🔒 Access Restricted</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Class Schedule is only available for teachers and administrators.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {userRole ? `Your current role: ${userRole}` : 'Please contact an administrator for access.'}
            </p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="container schedule-page">
      {/* Open KST Clock Window Button */}
      <button
        onClick={openClockWindow}
        style={{
          position: 'fixed',
          right: '20px',
          top: '80px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: (clockWindow && !clockWindow.closed) ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={(clockWindow && !clockWindow.closed) ? 'Close KST Clock Window' : 'Open KST Clock Window'}
      >
        {(clockWindow && !clockWindow.closed) ? '✓' : '🇰🇷'}
      </button>
      
      <LiveClocks />
      
      {/* Admin: Teacher Selector */}
      {isAdmin && teachers.length > 0 && (
        <div style={{marginBottom:'2rem', background:'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)', borderRadius:'16px', border:'2px solid #f59e0b', padding:'1.5rem', boxShadow:'0 4px 6px -1px rgba(245, 158, 11, 0.3)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem'}}>
            <span style={{fontSize:'1.5rem'}}>👨‍🏫</span>
            <div style={{flex:1}}>
              <h3 style={{margin:0, fontSize:'1.2rem', fontWeight:'700', color:'#92400e'}}>Admin View: Teacher Schedules</h3>
              <p style={{margin:0, fontSize:'0.85rem', color:'#78350f', marginTop:'0.3rem'}}>Select a teacher to view their class schedule</p>
            </div>
          </div>
          <select 
            value={selectedTeacherId || ''}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            style={{
              width:'100%',
              padding:'1rem 1.2rem',
              border:'2px solid #f59e0b',
              borderRadius:'12px',
              fontSize:'1rem',
              fontWeight:'600',
              background:'#ffffff',
              color:'#92400e',
              cursor:'pointer',
              transition:'all 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#d97706'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
          >
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.full_name || teacher.email}
              </option>
            ))}
          </select>
          {selectedTeacherId && (
            <div style={{marginTop:'1rem', padding:'0.75rem 1rem', background:'rgba(245, 158, 11, 0.1)', borderRadius:'8px', fontSize:'0.85rem', color:'#78350f', fontWeight:'600'}}>
              📊 Viewing schedule for: {teachers.find(t => t.id === selectedTeacherId)?.full_name || 'Selected Teacher'}
            </div>
          )}
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card" style={{background:'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)', border:'2px solid #818cf8', boxShadow:'0 4px 6px -1px rgba(129, 140, 248, 0.2)'}}>
          <div style={{fontSize:'0.9rem', color:'#4338ca', fontWeight:'600', marginBottom:'0.5rem'}}>📚 Total Classes</div>
          <div className="stat-value" style={{fontSize:'3rem', color:'#312e81', fontWeight:'800'}}>{stats.totalClasses}</div>
        </div>
        <div className="stat-card" style={{background:'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)', border:'2px solid #10b981', boxShadow:'0 4px 6px -1px rgba(16, 185, 129, 0.2)'}}>
          <div style={{fontSize:'0.9rem', color:'#065f46', fontWeight:'600', marginBottom:'0.5rem'}}>⏱️ Total Minutes</div>
          <div className="stat-value" style={{fontSize:'3rem', color:'#064e3b', fontWeight:'800'}}>{stats.totalMinutes}</div>
          <div style={{color:'#059669', fontSize:'0.85rem', marginTop:'4px'}}>minutes / week</div>
        </div>
        <div className="stat-card" style={{background:'linear-gradient(135deg, #fce7f3 0%, #fef1f9 100%)', border:'2px solid #ec4899', boxShadow:'0 4px 6px -1px rgba(236, 72, 153, 0.2)'}}>
          <div style={{fontSize:'0.9rem', color:'#9f1239', fontWeight:'600', marginBottom:'0.5rem'}}>🎯 Next Class</div>
          {stats.next ? (
            <div style={{marginTop:6}}>
              <div style={{fontWeight:700, fontSize:'1.1rem', color:'#831843', marginBottom:'0.5rem'}}>{stats.next.title}</div>
              <div style={{display:'inline-block', padding:'4px 10px', background:'#ec4899', color:'#fff', borderRadius:'12px', fontSize:'0.85rem', fontWeight:'600', marginBottom:'0.5rem'}}>{stats.next.day}</div>
              <div style={{marginTop:6, display:'flex', gap:6, flexWrap:'wrap'}}>
                <span style={{padding:'4px 10px', background:'rgba(236, 72, 153, 0.15)', color:'#9f1239', borderRadius:'12px', fontSize:'0.8rem', fontWeight:'600'}}>KST {stats.next.startKST}–{stats.next.endKST}</span>
                <span style={{padding:'4px 10px', background:'rgba(236, 72, 153, 0.15)', color:'#9f1239', borderRadius:'12px', fontSize:'0.8rem', fontWeight:'600'}}>PH {stats.next.startPH12}–{stats.next.endPH12}</span>
              </div>
            </div>
          ) : (
            <div style={{color:'#be185d', fontSize:'0.95rem', marginTop:'0.5rem'}}>No classes scheduled</div>
          )}
        </div>
      </div>

      <div className="row" style={{ gap: '1rem', alignItems: 'stretch' }}>
        {/* Only show form for teachers */}
        {isTeacher && (
          <div style={{ flex: 1, minWidth: 360, background:'#ffffff', borderRadius:'16px', border:'1px solid #e5e7eb', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.08)', overflow:'hidden' }}>
            <div style={{background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding:'1.5rem', color:'#ffffff'}}>
              <h2 style={{fontSize:'1.3rem', fontWeight:'700', margin:0, marginBottom:'0.3rem'}}>📅 Class Schedule</h2>
              <p style={{fontSize:'0.85rem', margin:0, opacity:0.9}}>Create your class schedule • KST → PH automatic conversion</p>
            </div>
            <form onSubmit={onSubmit} style={{padding:'2rem'}}>
            {/* Class Info Section */}
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Class Information</label>
              <input 
                style={{
                  width:'100%', 
                  padding:'1rem 1.2rem', 
                  border:'1px solid #e2e8f0', 
                  borderRadius:'12px', 
                  fontSize:'1rem',
                  transition:'all 0.2s',
                  background:'#f9fafb',
                  fontWeight:'500'
                }}
                value={form.title} 
                onChange={e=>setForm(f=>({...f,title:e.target.value}))} 
                placeholder="Enter class name (e.g., Grade 3 English)" 
                required 
                onFocus={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#ffffff'}}
                onBlur={(e) => {e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f9fafb'}}
              />
            </div>
            
            {/* Schedule Section */}
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Day of Week</label>
              <select 
                style={{
                  width:'100%', 
                  padding:'1rem 1.2rem', 
                  border:'1px solid #e2e8f0', 
                  borderRadius:'12px', 
                  fontSize:'1rem',
                  background:'#f9fafb',
                  cursor:'pointer',
                  fontWeight:'600',
                  color:'#1e293b'
                }}
                value={form.day} 
                onChange={e=>setForm(f=>({...f,day:e.target.value}))}
              >
                {DAYS.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Time Inputs */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem'}}>
              <div>
                <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>⏰ Start Time (KST)</label>
                <input 
                  type="text" 
                  value={form.startKST} 
                  onChange={(e) => {
                    let val = e.target.value
                    val = val.replace(/[^0-9:]/g, '')
                    if (val.length <= 5) {
                      setForm(f => ({...f, startKST: val}))
                    }
                  }}
                  onBlur={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length >= 3) {
                      let h, m
                      if (val.length === 3) {
                        h = parseInt(val.substring(0, 1))
                        m = parseInt(val.substring(1, 3))
                      } else {
                        h = parseInt(val.substring(0, 2))
                        m = parseInt(val.substring(2, 4))
                      }
                      h = Math.min(23, Math.max(0, h || 0))
                      m = Math.min(59, Math.max(0, m || 0))
                      const startTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
                      setForm(f => ({...f, startKST: startTime}))
                    } else if (val.length === 0) {
                      setForm(f => ({...f, startKST: '09:00'}))
                    }
                  }}
                  placeholder="e.g., 1825"
                  style={{
                    width:'100%',
                    padding:'0.9rem 1.2rem',
                    border:'2px solid #cbd5e1',
                    borderRadius:'10px',
                    fontSize:'1.2rem',
                    fontWeight:'800',
                    textAlign:'center',
                    background:'#ffffff',
                    color:'#1e40af',
                    fontFamily:'monospace',
                    letterSpacing:'2px'
                  }}
                />
                <div style={{marginTop:'0.5rem', fontSize:'0.75rem', color:'#64748b', fontWeight:'600'}}>
                  🇵🇭 {to12h(toPHTime(form.startKST))}
                </div>
              </div>

              <div>
                <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>⏱️ End Time (KST)</label>
                <input 
                  type="text" 
                  value={(() => {
                    const endKST = timeAddMinutes(form.startKST, Number(form.durationMin)||0)
                    return endKST
                  })()} 
                  onChange={(e) => {
                    let val = e.target.value
                    val = val.replace(/[^0-9:]/g, '')
                    if (val.length <= 5) {
                      // Calculate new duration based on end time
                      const [startH, startM] = form.startKST.split(':').map(Number)
                      const startMinutes = startH * 60 + startM
                      
                      const parts = val.split(':')
                      if (parts.length === 2) {
                        const endH = parseInt(parts[0]) || 0
                        const endM = parseInt(parts[1]) || 0
                        const endMinutes = endH * 60 + endM
                        let duration = endMinutes - startMinutes
                        if (duration < 0) duration += 24 * 60
                        setForm(f => ({...f, durationMin: duration}))
                      }
                    }
                  }}
                  onBlur={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length >= 3) {
                      let h, m
                      if (val.length === 3) {
                        h = parseInt(val.substring(0, 1))
                        m = parseInt(val.substring(1, 3))
                      } else {
                        h = parseInt(val.substring(0, 2))
                        m = parseInt(val.substring(2, 4))
                      }
                      h = Math.min(23, Math.max(0, h || 0))
                      m = Math.min(59, Math.max(0, m || 0))
                      
                      // Calculate duration
                      const [startH, startM] = form.startKST.split(':').map(Number)
                      const startMinutes = startH * 60 + startM
                      const endMinutes = h * 60 + m
                      let duration = endMinutes - startMinutes
                      if (duration < 0) duration += 24 * 60
                      if (duration > 0) {
                        setForm(f => ({...f, durationMin: duration}))
                      }
                    }
                  }}
                  placeholder="e.g., 1855"
                  style={{
                    width:'100%',
                    padding:'0.9rem 1.2rem',
                    border:'2px solid #cbd5e1',
                    borderRadius:'10px',
                    fontSize:'1.2rem',
                    fontWeight:'800',
                    textAlign:'center',
                    background:'#ffffff',
                    color:'#dc2626',
                    fontFamily:'monospace',
                    letterSpacing:'2px'
                  }}
                />
                <div style={{marginTop:'0.5rem', fontSize:'0.75rem', color:'#64748b', fontWeight:'600'}}>
                  🇵🇭 {to12h(toPHTime(timeAddMinutes(form.startKST, Number(form.durationMin)||0)))}
                </div>
              </div>
            </div>
            
            <div style={{marginBottom:'1.5rem', padding:'0.75rem 1rem', background:'#f0fdf4', borderRadius:'10px', border:'1px solid #86efac', textAlign:'center'}}>
              <span style={{fontSize:'0.8rem', color:'#15803d', fontWeight:'700'}}>Duration: {form.durationMin} minutes</span>
            </div>
            
            {/* Duration Section */}
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Duration (Minutes)</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem'}}>
                {[30,45,60,90].map(n=> (
                  <button 
                    key={n} 
                    type="button" 
                    onClick={()=>setForm(f=>({...f,durationMin:n}))}
                    style={{
                      padding:'1rem',
                      borderRadius:'12px',
                      border: Number(form.durationMin)===n ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: Number(form.durationMin)===n ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f9fafb',
                      color: Number(form.durationMin)===n ? '#ffffff' : '#64748b',
                      fontSize:'1.1rem',
                      fontWeight:'700',
                      cursor:'pointer',
                      transition:'all 0.2s',
                      boxShadow: Number(form.durationMin)===n ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                  >{n}m</button>
                ))}
              </div>
            </div>
            {(() => {
              const liveEndKST = timeAddMinutes(form.startKST, Number(form.durationMin)||0)
              const liveStartPH12 = to12h(toPHTime(form.startKST))
              const liveEndPH12 = to12h(toPHTime(liveEndKST))
              return (
                <div style={{marginBottom:'1.5rem', padding:'1.25rem', background:'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius:'12px', border:'2px solid #3b82f6'}}>
                  <div style={{fontSize:'0.75rem', fontWeight:'700', color:'#1e40af', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>⏰ Class Time Preview</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div style={{padding:'1rem', background:'#ffffff', borderRadius:'10px', border:'1px solid #3b82f6'}}>
                      <div style={{fontSize:'0.7rem', color:'#64748b', marginBottom:'0.5rem', fontWeight:'600'}}>🇰🇷 KOREA TIME</div>
                      <div style={{marginBottom:'0.5rem'}}>
                        <div style={{fontSize:'0.65rem', color:'#94a3b8', fontWeight:'600', marginBottom:'0.2rem'}}>START</div>
                        <div style={{fontSize:'1.3rem', fontWeight:'800', color:'#1e40af', fontFamily:'monospace'}}>{form.startKST}</div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.65rem', color:'#94a3b8', fontWeight:'600', marginBottom:'0.2rem'}}>END</div>
                        <div style={{fontSize:'1.3rem', fontWeight:'800', color:'#1e40af', fontFamily:'monospace'}}>{liveEndKST}</div>
                      </div>
                      <div style={{fontSize:'0.65rem', color:'#94a3b8', marginTop:'0.5rem'}}>24-hour format</div>
                    </div>
                    <div style={{padding:'1rem', background:'#ffffff', borderRadius:'10px', border:'1px solid #f59e0b'}}>
                      <div style={{fontSize:'0.7rem', color:'#64748b', marginBottom:'0.5rem', fontWeight:'600'}}>🇵🇭 PHILIPPINES TIME</div>
                      <div style={{marginBottom:'0.5rem'}}>
                        <div style={{fontSize:'0.65rem', color:'#94a3b8', fontWeight:'600', marginBottom:'0.2rem'}}>START</div>
                        <div style={{fontSize:'1.3rem', fontWeight:'800', color:'#92400e', fontFamily:'monospace'}}>{liveStartPH12}</div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.65rem', color:'#94a3b8', fontWeight:'600', marginBottom:'0.2rem'}}>END</div>
                        <div style={{fontSize:'1.3rem', fontWeight:'800', color:'#92400e', fontFamily:'monospace'}}>{liveEndPH12}</div>
                      </div>
                      <div style={{fontSize:'0.65rem', color:'#94a3b8', marginTop:'0.5rem'}}>12-hour format</div>
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* Additional Details */}
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Location/Room (Optional)</label>
              <input 
                style={{
                  width:'100%', 
                  padding:'1rem 1.2rem', 
                  border:'1px solid #e2e8f0', 
                  borderRadius:'12px', 
                  fontSize:'1rem',
                  background:'#f9fafb',
                  fontWeight:'500'
                }}
                value={form.location} 
                onChange={e=>setForm(f=>({...f,location:e.target.value}))} 
                placeholder="e.g., Room 201, Building A"
                onFocus={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#ffffff'}}
                onBlur={(e) => {e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f9fafb'}}
              />
            </div>
            
            {/* Color Selection */}
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Class Color</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'0.75rem'}}>
                {['#3b82f6','#6366f1','#a855f7','#06b6d4','#10b981','#f59e0b','#ef4444'].map(c => (
                  <button 
                    key={c} 
                    type="button" 
                    onClick={()=>setForm(f=>({...f,color:c}))} 
                    style={{
                      height:'50px',
                      borderRadius:'12px',
                      background:c, 
                      border: form.color===c ? '3px solid #1e293b' : 'none',
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      color:'#fff',
                      fontSize:'1.3rem',
                      fontWeight:'700',
                      transition:'all 0.2s',
                      transform: form.color===c ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: form.color===c ? '0 8px 12px rgba(0,0,0,0.25)' : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {form.color===c ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div style={{marginBottom:'2rem'}}>
              <label style={{display:'block', marginBottom:'0.6rem', fontWeight:'700', color:'#1e293b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Notes (Optional)</label>
              <textarea 
                style={{
                  width:'100%', 
                  padding:'1rem 1.2rem', 
                  border:'1px solid #e2e8f0', 
                  borderRadius:'12px', 
                  fontSize:'0.95rem',
                  background:'#f9fafb',
                  resize:'vertical',
                  fontFamily:'inherit',
                  fontWeight:'500',
                  minHeight:'80px'
                }}
                value={form.notes} 
                onChange={e=>setForm(f=>({...f,notes:e.target.value}))} 
                placeholder="Add any additional details about this class..."
                onFocus={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#ffffff'}}
                onBlur={(e) => {e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f9fafb'}}
              ></textarea>
            </div>
            {/* Action Buttons */}
            <div style={{display:'flex', gap:'1rem'}}>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  style={{
                    flex:1,
                    padding:'1rem',
                    borderRadius:'12px',
                    border:'2px solid #e2e8f0',
                    background:'#ffffff',
                    color:'#64748b',
                    fontSize:'1rem',
                    fontWeight:'700',
                    cursor:'pointer',
                    transition:'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  ✕ Cancel
                </button>
              )}
              <button 
                type="submit"
                style={{
                  flex:2,
                  padding:'1rem',
                  borderRadius:'12px',
                  border:'none',
                  background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color:'#ffffff',
                  fontSize:'1rem',
                  fontWeight:'700',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  boxShadow:'0 4px 12px rgba(59, 130, 246, 0.4)'
                }}
                onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.5)'}}
                onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'}}
              >
                {editingId ? '✨ Update Class Schedule' : '➕ Add to Schedule'}
              </button>
            </div>
            
            {/* Search Bar */}
            <div style={{marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid #e5e7eb'}}>
              <input 
                style={{
                  width:'100%',
                  padding:'1rem 1.2rem', 
                  border:'1px solid #e2e8f0', 
                  borderRadius:'12px', 
                  fontSize:'0.95rem',
                  background:'#f9fafb',
                  fontWeight:'500'
                }}
                placeholder="🔍 Search your classes..." 
                value={query} 
                onChange={e=>setQuery(e.target.value)}
                onFocus={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#ffffff'}}
                onBlur={(e) => {e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f9fafb'}}
              />
            </div>
          </form>
          </div>
        )}

        <div style={{ flex: 1.2, minWidth: 420, background:'#ffffff', borderRadius:'16px', border:'1px solid #e5e7eb', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.08)', overflow:'hidden' }}>
          <div style={{background:'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding:'1.5rem', borderBottom:'1px solid #e5e7eb'}}>
            <h3 style={{fontSize:'1.3rem', fontWeight:'700', color:'#1e293b', margin:0, marginBottom:'0.3rem'}}>📊 Weekly Overview</h3>
            <p style={{color:'#64748b', margin:0, fontSize:'0.85rem'}}>Your schedule at a glance • KST and PH times</p>
          </div>
          <div style={{padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
            {DAYS.map(day => (
              <div key={day} style={{background:'#f9fafb', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden', transition:'all 0.2s ease'}}>
                <div style={{padding:'1rem 1.25rem', background:'#ffffff', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:dayColors[day]}} />
                    <strong style={{fontSize:'1rem', color:'#1e293b', fontWeight:'700'}}>{day}</strong>
                  </div>
                  <span style={{padding:'0.35rem 0.75rem', background:dayColors[day], color:'#ffffff', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700'}}>{grouped[day]?.length || 0}</span>
                </div>
                <div style={{padding:'1rem'}}>
                  {(grouped[day] || []).length === 0 && (
                    <div style={{padding:'1rem', textAlign:'center', color:'#94a3b8', fontSize:'0.9rem'}}>No classes scheduled</div>
                  )}
                  {(grouped[day] || []).map(it => {
                    const endKST = timeAddMinutes(it.startKST, it.durationMin)
                    const startPH = toPHTime(it.startKST)
                    const endPH = toPHTime(endKST)
                    const startPH12 = to12h(startPH)
                    const endPH12 = to12h(endPH)
                    return (
                      <div key={it.id} style={{background:'#ffffff', borderRadius:'10px', padding:'1rem', marginBottom:'0.75rem', border:'1px solid #e5e7eb', position:'relative', paddingLeft:'1.25rem', transition:'all 0.2s ease'}} onMouseEnter={(e)=>{e.currentTarget.style.boxShadow='0 4px 6px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor='#cbd5e1'}} onMouseLeave={(e)=>{e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#e5e7eb'}}>
                        <div style={{background: it.color || '#3b82f6', width:'4px', height:'calc(100% - 2rem)', position:'absolute', left:'0.5rem', top:'1rem', borderRadius:'4px'}} />
                        <div style={{marginBottom:'0.75rem'}}>
                          <div style={{fontWeight:'700', color:'#1e293b', fontSize:'1rem', marginBottom:'0.5rem'}}>{it.title}</div>
                          <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.5rem'}}>
                            <span style={{padding:'0.3rem 0.7rem', background:'#eff6ff', color:'#1e40af', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'600'}}>🇰🇷 {it.startKST}–{endKST}</span>
                            <span style={{padding:'0.3rem 0.7rem', background:'#fef3c7', color:'#92400e', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'600'}}>🇵🇭 {startPH12}–{endPH12}</span>
                            <span style={{padding:'0.3rem 0.7rem', background:'#f3f4f6', color:'#4b5563', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'600'}}>{it.durationMin} min</span>
                            {it.location && <span style={{padding:'0.3rem 0.7rem', background:`${it.color}15`, color:it.color, borderRadius:'6px', fontSize:'0.8rem', fontWeight:'600'}}>📍 {it.location}</span>}
                          </div>
                          {it.notes && <div style={{fontSize:'0.85rem', color:'#64748b', marginTop:'0.5rem', fontStyle:'italic'}}>"{it.notes}"</div>}
                        </div>
                        <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                          <button style={{padding:'0.5rem 0.9rem', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#ffffff', color:'#64748b', fontSize:'0.85rem', fontWeight:'600', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>copyPH(it)} onMouseEnter={(e)=>{e.currentTarget.style.background='#f8fafc'}} onMouseLeave={(e)=>{e.currentTarget.style.background='#ffffff'}}>Copy PH</button>
                          <button style={{padding:'0.5rem 0.9rem', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#ffffff', color:'#3b82f6', fontSize:'0.85rem', fontWeight:'600', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>onEdit(it.id)} onMouseEnter={(e)=>{e.currentTarget.style.background='#eff6ff'}} onMouseLeave={(e)=>{e.currentTarget.style.background='#ffffff'}}>Edit</button>
                          <button style={{padding:'0.5rem 0.9rem', borderRadius:'8px', border:'1px solid #fecaca', background:'#ffffff', color:'#dc2626', fontSize:'0.85rem', fontWeight:'600', cursor:'pointer', transition:'all 0.2s'}} onClick={()=>onDelete(it.id)} onMouseEnter={(e)=>{e.currentTarget.style.background='#fee2e2'}} onMouseLeave={(e)=>{e.currentTarget.style.background='#ffffff'}}>Delete</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
