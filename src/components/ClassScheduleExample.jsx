/**
 * Class Schedule Component Example
 * 
 * This is a starter component showing how to display class schedules
 * using the class_schedule database schema.
 * 
 * Features demonstrated:
 * - Fetching schedule data from Supabase
 * - Displaying weekly schedule in a grid
 * - Color-coded subjects
 * - Real-time updates
 */

import { useState, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM

export default function ClassScheduleExample() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('week') // 'week' or 'list'
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    fetchUserProfile()
    fetchSchedules()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('class-schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_schedules'
        },
        () => {
          fetchSchedules()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
      }
    }
  }

  async function fetchSchedules() {
    setLoading(true)
    
    try {
      let query = supabase
        .from('class_schedule_details')
        .select('*')
        .eq('is_active', true)

      // If user is a teacher, show only their classes
      if (userRole === 'teacher' && userId) {
        query = query.eq('teacher_id', userId)
      }
      
      // If user is a student, show enrolled classes
      if (userRole === 'user' && userId) {
        const { data: enrollments } = await supabase
          .from('student_class_view')
          .select('*')
          .eq('student_id', userId)
        
        setSchedules(enrollments || [])
        setLoading(false)
        return
      }

      const { data, error } = await query.order('day_of_week').order('start_time')
      
      if (error) throw error
      
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  function getScheduleForDayAndHour(day, hour) {
    return schedules.filter(schedule => {
      if (schedule.day_of_week !== day) return false
      
      const startHour = parseInt(schedule.start_time.split(':')[0])
      const endHour = parseInt(schedule.end_time.split(':')[0])
      
      return hour >= startHour && hour < endHour
    })
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  function calculateRowSpan(startTime, endTime) {
    const start = parseInt(startTime.split(':')[0])
    const end = parseInt(endTime.split(':')[0])
    const minutes = parseInt(endTime.split(':')[1])
    return (end - start) + (minutes > 0 ? 0.5 : 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📚 Class Schedule
        </h1>
        <p className="text-gray-600">
          {userRole === 'teacher' ? 'Your teaching schedule' : 
           userRole === 'user' ? 'Your enrolled classes' : 
           'All active classes'}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Week View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          List View
        </button>
      </div>

      {/* Empty State */}
      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No classes scheduled</p>
          {userRole === 'teacher' && (
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create New Class
            </button>
          )}
        </div>
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left font-semibold text-gray-700 w-24">
                  Time
                </th>
                {DAYS.slice(1, 6).map(day => (
                  <th key={day} className="border p-3 text-center font-semibold text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="h-20">
                  <td className="border p-2 text-sm text-gray-600 font-medium bg-gray-50">
                    {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                  </td>
                  {DAYS.slice(1, 6).map((day, dayIndex) => {
                    const classes = getScheduleForDayAndHour(dayIndex + 1, hour)
                    const firstClass = classes[0]
                    
                    if (firstClass && parseInt(firstClass.start_time.split(':')[0]) === hour) {
                      return (
                        <td
                          key={day}
                          className="border p-2 align-top"
                          rowSpan={Math.ceil(calculateRowSpan(firstClass.start_time, firstClass.end_time))}
                        >
                          <div
                            className="p-3 rounded-lg h-full text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            style={{ backgroundColor: firstClass.subject_color || '#3498db' }}
                          >
                            <div className="font-bold text-sm mb-1">
                              {firstClass.subject_code}
                            </div>
                            <div className="text-xs mb-1">
                              {firstClass.subject_name}
                            </div>
                            <div className="text-xs opacity-90">
                              📍 {firstClass.room}
                            </div>
                            <div className="text-xs opacity-90">
                              👤 {firstClass.teacher_name}
                            </div>
                            <div className="text-xs opacity-90 mt-1">
                              ⏰ {formatTime(firstClass.start_time)} - {formatTime(firstClass.end_time)}
                            </div>
                          </div>
                        </td>
                      )
                    } else if (!classes.length || parseInt(firstClass?.start_time.split(':')[0]) !== hour) {
                      return <td key={day} className="border bg-gray-50"></td>
                    }
                    return null
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {DAYS.slice(1, 6).map((day, dayIndex) => {
            const daySchedules = schedules.filter(s => s.day_of_week === dayIndex + 1)
            
            if (daySchedules.length === 0) return null
            
            return (
              <div key={day} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  {day}
                </h2>
                <div className="space-y-3">
                  {daySchedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-4 p-4 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      style={{ borderLeftColor: schedule.subject_color || '#3498db' }}
                    >
                      <div className="flex-shrink-0 text-center min-w-[100px]">
                        <div className="font-semibold text-gray-700">
                          {formatTime(schedule.start_time)}
                        </div>
                        <div className="text-sm text-gray-500">to</div>
                        <div className="font-semibold text-gray-700">
                          {formatTime(schedule.end_time)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800">
                          {schedule.subject_code} - {schedule.subject_name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          👤 {schedule.teacher_name} • 📍 {schedule.room}, {schedule.building}
                        </div>
                        {schedule.section && (
                          <div className="text-sm text-gray-500 mt-1">
                            Section: {schedule.section}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm text-gray-600">
                          {schedule.enrolled_count}/{schedule.max_students}
                        </div>
                        <div className="text-xs text-gray-500">students</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {[...new Set(schedules.map(s => ({ code: s.subject_code, color: s.subject_color })))]
            .map((subject, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: subject.color || '#3498db' }}
                ></div>
                <span className="text-sm text-gray-700">{subject.code}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
