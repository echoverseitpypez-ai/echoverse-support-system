import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/team-chat.css'

export default function TeamChat() {
  const [currentUser, setCurrentUser] = useState(null)
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Load current user
  useEffect(() => {
    loadCurrentUser()
  }, [])

  // Load chats when user is ready
  useEffect(() => {
    if (currentUser?.id) {
      loadChats()
      loadTeamMembers()
    }
  }, [currentUser])

  // Subscribe to messages when active chat changes
  useEffect(() => {
    if (activeChat?.id) {
      loadMessages(activeChat.id)
      const subscription = subscribeToMessages(activeChat.id)
      return () => {
        subscription()
      }
    }
  }, [activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting auth user:', userError)
        return
      }
      
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      console.log('Loading profile for user:', user.id)
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error loading profile:', profileError)
        return
      }
      
      if (!profile) {
        console.error('No profile found for user:', user.id)
        return
      }

      console.log('Profile loaded successfully:', profile)
      setCurrentUser(profile)
    } catch (error) {
      console.error('Unexpected error loading user:', error)
    }
  }

  const loadChats = async () => {
    try {
      setLoading(true)
      
      // Get all chats where user is a member
      const { data: memberChats, error } = await supabase
        .from('team_chat_members')
        .select(`
          chat_id,
          team_chats (
            id,
            chat_name,
            is_group,
            created_by,
            last_message_at,
            last_message_preview
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)

      if (error) throw error

      // Get member details for each chat
      const chatsWithMembers = await Promise.all(
        memberChats.map(async (mc) => {
          const chat = mc.team_chats
          
          // Get all members
          const { data: members } = await supabase
            .from('team_chat_members')
            .select(`
              user_id,
              profiles (id, full_name, role)
            `)
            .eq('chat_id', chat.id)
            .eq('is_active', true)

          return {
            ...chat,
            members: members || []
          }
        })
      )

      // Sort by last message
      chatsWithMembers.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at) : new Date(0)
        const bTime = b.last_message_at ? new Date(b.last_message_at) : new Date(0)
        return bTime - aTime
      })

      setChats(chatsWithMembers)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['teacher', 'admin', 'agent'])
        .neq('id', currentUser.id)

      if (error) {
        console.error('Error fetching profiles:', error)
        throw error
      }
      
      console.log('Raw team members from database:', data)
      
      // Filter out any entries without proper full_name
      const validMembers = (data || []).filter(m => {
        const hasName = m.full_name && m.full_name.trim() !== ''
        if (!hasName) {
          console.log('Filtering out user without name:', m)
        }
        return hasName
      })
      
      console.log('Valid team members after filter:', validMembers)
      setTeamMembers(validMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
    }
  }

  const loadMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            profiles (full_name, role)
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = (chatId) => {
    const channel = supabase
      .channel(`team-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
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

  const startDirectChat = async (memberId) => {
    try {
      console.log('Starting direct chat with:', memberId)
      
      // Use the database function to get or create direct chat
      const { data, error } = await supabase
        .rpc('get_or_create_direct_chat', {
          user1_id: currentUser.id,
          user2_id: memberId
        })

      if (error) {
        console.error('RPC error:', error)
        throw error
      }

      console.log('Chat ID from RPC:', data)

      // Load the chat
      const { data: chatData, error: chatError } = await supabase
        .from('team_chats')
        .select('*')
        .eq('id', data)
        .single()

      if (chatError) {
        console.error('Error loading chat data:', chatError)
        throw chatError
      }

      console.log('Chat data loaded:', chatData)

      // Get members with their profile data
      const { data: members, error: membersError } = await supabase
        .from('team_chat_members')
        .select('user_id')
        .eq('chat_id', data)
        .eq('is_active', true)

      if (membersError) {
        console.error('Error loading members:', membersError)
        throw membersError
      }

      console.log('Chat members (user IDs):', members)

      // Fetch profile data for each member
      const memberIds = members?.map(m => m.user_id) || []
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', memberIds)

      if (profilesError) {
        console.error('Error loading member profiles:', profilesError)
      }

      console.log('Member profiles:', profiles)

      // Combine members with their profiles
      const membersWithProfiles = members?.map(member => ({
        user_id: member.user_id,
        profiles: profiles?.find(p => p.id === member.user_id)
      })) || []

      console.log('Members with profiles combined:', membersWithProfiles)

      const chat = {
        ...chatData,
        members: membersWithProfiles
      }

      console.log('Setting active chat:', chat)
      setActiveChat(chat)
      setShowNewChat(false)
      loadChats() // Refresh chat list
    } catch (error) {
      console.error('Error starting chat:', error)
      alert(`Failed to start chat: ${error.message}`)
    }
  }

  const handleInputClick = () => {
    if (!activeChat) {
      setShowNewChat(true)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat || sending) return

    // Validate we have necessary data
    if (!currentUser?.id) {
      alert('User not loaded. Please refresh the page.')
      return
    }

    if (!activeChat?.id) {
      alert('Please select a chat first.')
      return
    }

    try {
      setSending(true)
      const { data, error } = await supabase
        .from('team_chat_messages')
        .insert([{
          chat_id: activeChat.id,
          sender_id: currentUser.id,
          message: newMessage.trim()
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to send message')
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const getChatName = (chat) => {
    if (!chat) return 'No Chat Selected'
    if (chat.chat_name) return chat.chat_name
    
    // For direct chats, show other person's name
    const otherMember = chat.members?.find(m => m.user_id !== currentUser.id)
    return otherMember?.profiles?.full_name || 'Unknown User'
  }

  const getChatAvatar = (chat) => {
    const otherMember = chat.members?.find(m => m.user_id !== currentUser.id)
    const role = otherMember?.profiles?.role || 'user'
    
    switch (role) {
      case 'admin': return '👑'
      case 'agent': return '🎧'
      case 'teacher': return '👨‍🏫'
      default: return '👤'
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
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
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
      <div className="team-chat-loading">
        <div className="spinner"></div>
        <p>Loading chats...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="team-chat-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
        <small style={{color: '#9ca3af', marginTop: '0.5rem'}}>
          If this takes too long, please refresh the page
        </small>
      </div>
    )
  }

  return (
    <div className="team-chat-page">
      <div className="team-chat-container">
        {/* Sidebar - Chat List */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>💬 Team Chat</h2>
            <button 
              className="new-chat-btn"
              onClick={() => setShowNewChat(!showNewChat)}
            >
              ➕ New Chat
            </button>
          </div>

          {showNewChat && (
            <div className="new-chat-panel">
              <h3>Start a conversation</h3>
              <div className="team-members-list">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="team-member-item"
                    onClick={() => startDirectChat(member.id)}
                  >
                    <span className="member-avatar">{getRoleBadge(member.role)}</span>
                    <div className="member-info">
                      <span className="member-name">{member.full_name}</span>
                      <span className="member-role" style={{ color: getRoleColor(member.role) }}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="chats-list">
            {chats.length === 0 ? (
              <div className="no-chats">
                <p>No chats yet</p>
                <small>Start a new conversation!</small>
              </div>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => setActiveChat(chat)}
                >
                  <div className="chat-avatar">{getChatAvatar(chat)}</div>
                  <div className="chat-info">
                    <div className="chat-header-row">
                      <span className="chat-name">{getChatName(chat)}</span>
                      {chat.last_message_at && (
                        <span className="chat-time">
                          {formatTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>
                    {chat.last_message_preview && (
                      <p className="chat-preview">{chat.last_message_preview}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {activeChat && activeChat.id ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <span className="header-avatar">{getChatAvatar(activeChat)}</span>
                  <div>
                    <h3>{getChatName(activeChat)}</h3>
                    <p className="chat-members">
                      {activeChat.members?.map(m => m.profiles?.full_name).filter(Boolean).join(', ') || 'Loading...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  const profile = msg.sender?.profiles
                  const role = profile?.role || 'user'
                  const name = profile?.full_name || 'Unknown'

                  return (
                    <div
                      key={msg.id}
                      className={`chat-message ${isMe ? 'message-me' : 'message-other'}`}
                    >
                      <div className="message-content">
                        {!isMe && (
                          <div className="message-sender">
                            <span className="sender-badge">{getRoleBadge(role)}</span>
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
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <h2>💬 Select a chat to start messaging</h2>
              <p>Choose a conversation from the list or start a new one</p>
            </div>
          )}

          {/* Input form always visible at bottom */}
          <form className="chat-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder={activeChat ? "Type your message..." : "Click here to start a chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onClick={handleInputClick}
              disabled={sending}
              maxLength={1000}
              style={{ cursor: !activeChat ? 'pointer' : 'text' }}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || sending || !activeChat}
              title={!activeChat ? "Select a chat first" : "Send message"}
            >
              {sending ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
