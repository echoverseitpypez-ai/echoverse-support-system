import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/public-team-chat.css'

export default function PublicTeamChat() {
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load current user
  useEffect(() => {
    loadCurrentUser()
  }, [])

  // Load messages and subscribe when user is ready
  useEffect(() => {
    if (currentUser?.id) {
      loadMessages()
      const subscription = subscribeToMessages()
      return () => {
        subscription()
      }
    }
  }, [currentUser])

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error loading profile:', profileError)
        return
      }

      console.log('Current user loaded:', profile)
      setCurrentUser(profile)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      console.log('Loading messages...')
      
      // Get last 50 messages
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      console.log('Raw messages from database:', data)

      if (!data || data.length === 0) {
        console.log('No messages found in database')
        setMessages([])
        setLoading(false)
        return
      }

      // Fetch profile for each message
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', msg.user_id)
            .single()

          if (profileError) {
            console.error('Error loading profile for user:', msg.user_id, profileError)
          }

          return {
            ...msg,
            profile: profile || { full_name: 'Unknown', role: 'user' }
          }
        })
      )

      console.log('Messages with profiles:', messagesWithProfiles)

      // Reverse to show oldest first
      const sortedMessages = messagesWithProfiles.reverse()
      console.log('Setting messages:', sortedMessages)
      setMessages(sortedMessages)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    console.log('Setting up real-time subscription...')
    
    const channel = supabase
      .channel('public-team-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages'
        },
        async (payload) => {
          console.log('✅ New message received via real-time:', payload)
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', payload.new.user_id)
            .single()

          const newMsg = {
            ...payload.new,
            profile: profile || { full_name: 'Unknown', role: 'user' }
          }

          console.log('Adding message to state:', newMsg)
          setMessages(prev => {
            // Don't add duplicate
            if (prev.some(m => m.id === newMsg.id)) {
              console.log('Message already exists, skipping')
              return prev
            }
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }

  const clearAllMessages = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admins can clear chat history')
      return
    }

    const confirmed = window.confirm(
      '⚠️ Are you sure you want to clear ALL chat messages?\n\nThis action cannot be undone!'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) throw error

      setMessages([])
      alert('✅ Chat history cleared successfully!')
      console.log('Chat cleared by admin:', currentUser.full_name)
    } catch (error) {
      console.error('Error clearing chat:', error)
      alert(`Failed to clear chat: ${error.message}`)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    if (!currentUser?.id) {
      alert('User not loaded. Please refresh the page.')
      return
    }

    const messageText = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update - show immediately
    const optimisticMsg = {
      id: tempId,
      user_id: currentUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
      profile: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        role: currentUser.role
      }
    }

    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('') // Clear input immediately
    setTimeout(scrollToBottom, 50)

    try {
      setSending(true)
      console.log('Sending message:', {
        user_id: currentUser.id,
        message: messageText
      })

      const { data, error } = await supabase
        .from('team_messages')
        .insert([{
          user_id: currentUser.id,
          message: messageText
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        // Remove optimistic message and restore input
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setNewMessage(messageText)
        throw error
      }

      console.log('Message sent successfully:', data)

      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...data, profile: optimisticMsg.profile } : m
      ))
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return '👑'
      case 'agent': return '🎧'
      case 'teacher': return '👨‍🏫'
      default: return '👤'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444'
      case 'agent': return '#3b82f6'
      case 'teacher': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div className="public-chat-loading">
        <div className="spinner"></div>
        <p>Loading team chat...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="public-chat-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="public-team-chat-page">
      <div className="public-chat-container">
        {/* Header */}
        <div className="public-chat-header">
          <div className="header-content">
            <div>
              <h2>💬 Team Chat</h2>
              <p>Public chat for all staff members</p>
            </div>
            {currentUser?.role === 'admin' && (
              <button 
                className="clear-chat-btn"
                onClick={clearAllMessages}
                title="Clear all chat history (Admin only)"
              >
                🗑️ Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="public-chat-messages" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === currentUser.id

              return (
                <div
                  key={msg.id}
                  className={`public-message ${isMe ? 'message-me' : 'message-other'}`}
                >
                  <div className="message-content">
                    {!isMe && (
                      <div className="message-sender">
                        <span className="sender-badge">{getRoleBadge(msg.profile.role)}</span>
                        <span className="sender-name">{msg.profile.full_name}</span>
                        <span className="sender-role" style={{ background: getRoleColor(msg.profile.role) }}>
                          {msg.profile.role}
                        </span>
                      </div>
                    )}
                    <div className="message-bubble">
                      {msg.message}
                    </div>
                    <div className="message-time">{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="public-chat-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            className="public-chat-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            maxLength={1000}
            autoFocus
          />
          <button
            type="submit"
            className="public-chat-send-btn"
            disabled={sending}
            title="Send message"
          >
            📤
          </button>
        </form>
      </div>
    </div>
  )
}
