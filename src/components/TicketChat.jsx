import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ticket-chat.css'

export default function TicketChat({ ticketId, currentUser }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize chat room for ticket
  useEffect(() => {
    const initializeChatRoom = async () => {
      try {
        // Check if room exists for this ticket
        let { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('ticket_id', ticketId)
          .single()

        // Create room if it doesn't exist
        if (!room) {
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert([{ ticket_id: ticketId }])
            .select()
            .single()

          if (createError) throw createError
          room = newRoom

          // Add current user as participant
          await supabase
            .from('chat_participants')
            .insert([{ room_id: room.id, user_id: currentUser.id }])
        }

        setRoomId(room.id)
        loadMessages(room.id)
        subscribeToMessages(room.id)
      } catch (error) {
        console.error('Error initializing chat room:', error)
      } finally {
        setLoading(false)
      }
    }

    if (ticketId && currentUser?.id) {
      initializeChatRoom()
    }
  }, [ticketId, currentUser])

  // Load existing messages
  const loadMessages = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            profiles (full_name, role)
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Subscribe to real-time messages
  const subscribeToMessages = (roomId) => {
    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch sender details
          const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new,
            sender: {
              id: payload.new.sender_id,
              profiles: senderData
            }
          }

          setMessages(prev => [...prev, newMsg])
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !roomId || sending) return

    try {
      setSending(true)
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          sender_id: currentUser.id,
          message: newMessage.trim()
        }])

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Format timestamp
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

  // Get role badge
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
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="ticket-chat-container">
      <div className="chat-header">
        <h3>💬 Live Chat</h3>
        <p>Chat with support team in real-time</p>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id
            const profile = msg.sender?.profiles
            const role = profile?.role || 'user'
            const name = profile?.full_name || 'Unknown User'

            return (
              <div
                key={msg.id}
                className={`chat-message ${isMe ? 'message-me' : 'message-other'}`}
              >
                <div className="message-content">
                  {!isMe && (
                    <div className="message-sender">
                      <span className="sender-badge" style={{ color: getRoleColor(role) }}>
                        {getRoleBadge(role)}
                      </span>
                      <span className="sender-name">{name}</span>
                      <span className="sender-role" style={{ background: getRoleColor(role) }}>
                        {role}
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

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          maxLength={1000}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  )
}
