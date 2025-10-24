# Real-Time Chat Integration Guide

## 🚀 Setup Instructions

### 1. Run Database Migration

First, execute the SQL schema in your Supabase dashboard:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy and run: db/chat_schema.sql
```

This creates:
- ✅ `chat_rooms` table (one per ticket)
- ✅ `chat_messages` table (all messages)
- ✅ `chat_participants` table (who can see the chat)
- ✅ Real-time triggers and policies

### 2. Add Chat to Ticket Details Page

Example integration in your ticket details page:

```jsx
import React from 'react'
import TicketChat from '../components/TicketChat'

export default function TicketDetailsPage({ ticket, currentUser }) {
  return (
    <div className="ticket-details">
      {/* Your existing ticket info */}
      <div className="ticket-info">
        <h1>{ticket.title}</h1>
        <p>{ticket.description}</p>
      </div>

      {/* Add the chat component */}
      <TicketChat 
        ticketId={ticket.id} 
        currentUser={currentUser} 
      />
    </div>
  )
}
```

### 3. Get Current User Profile

The chat needs the current user's profile. Example:

```jsx
const [currentUser, setCurrentUser] = React.useState(null)

React.useEffect(() => {
  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser(profile)
    }
  }
  loadUser()
}, [])
```

### 4. Usage in Different Pages

#### Option A: In Ticket Details (Most Common)
```jsx
// src/pages/TicketDetails.jsx
<div className="ticket-layout">
  <div className="ticket-main">
    {/* Ticket info */}
  </div>
  <div className="ticket-sidebar">
    <TicketChat ticketId={ticketId} currentUser={currentUser} />
  </div>
</div>
```

#### Option B: Standalone Chat Page
```jsx
// src/pages/ChatPage.jsx
<div className="chat-page">
  <h1>Chat with Support</h1>
  <TicketChat ticketId={selectedTicketId} currentUser={currentUser} />
</div>
```

#### Option C: Admin Dashboard with Multiple Chats
```jsx
// src/pages/admin/ChatManagement.jsx
<div className="admin-chats">
  <div className="chat-list">
    {tickets.map(ticket => (
      <div key={ticket.id} onClick={() => setActiveTicket(ticket)}>
        Ticket #{ticket.id}
      </div>
    ))}
  </div>
  <div className="active-chat">
    {activeTicket && (
      <TicketChat ticketId={activeTicket.id} currentUser={currentUser} />
    )}
  </div>
</div>
```

## ✨ Features

### Real-Time Messaging
- ✅ Messages appear instantly for all participants
- ✅ Uses Supabase Realtime subscriptions
- ✅ No page refresh needed

### User Roles Display
- 👑 **Admin** - Red badge
- 🎧 **Agent** - Blue badge
- 👨‍🏫 **Teacher** - Green badge
- 👤 **User** - Gray badge

### Chat Bubbles
- ✅ **Your messages** - Purple gradient (right side)
- ✅ **Other messages** - White with border (left side)
- ✅ Sender name and role badge shown
- ✅ Timestamps (relative: "5m ago", "2h ago")

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only see their own chats
- ✅ Staff can view all chats
- ✅ Messages tied to ticket participants

## 🎨 Customization

### Change Colors
Edit `src/styles/ticket-chat.css`:

```css
/* Your message bubble color */
.message-me .message-bubble {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}

/* Other message bubble color */
.message-other .message-bubble {
  background: white;
  border: 1px solid #e5e7eb;
}
```

### Change Height
```css
.ticket-chat-container {
  height: 600px; /* Change this */
}
```

### Add Typing Indicators
```jsx
// In TicketChat.jsx, add:
const [typingUsers, setTypingUsers] = useState([])

// Broadcast when typing
const handleTyping = () => {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user: currentUser.full_name }
  })
}
```

## 📊 Database Tables

### chat_rooms
- `id` - UUID
- `ticket_id` - Links to tickets table
- `last_message_at` - When last message was sent

### chat_messages
- `id` - UUID
- `room_id` - Which chat room
- `sender_id` - Who sent it
- `message` - Text content
- `created_at` - Timestamp

### chat_participants
- `room_id` - Which chat room
- `user_id` - Who has access
- `joined_at` - When they joined

## 🔐 Security Policies

All tables use Row Level Security:
- Users can only see chats they're part of
- Users can only send to chats they're in
- Staff (admin/agent) can see all chats
- Messages auto-add sender to participants

## 🐛 Troubleshooting

### Messages Not Showing
1. Check Supabase Realtime is enabled
2. Verify RLS policies are correct
3. Check browser console for errors

### Can't Send Messages
1. Verify user is authenticated
2. Check user is participant in room
3. Verify sender_id matches current user

### Styling Issues
1. Make sure `ticket-chat.css` is imported
2. Check CSS specificity conflicts
3. Verify class names match

## 🚀 Next Steps

1. Run the SQL migration
2. Import TicketChat component
3. Pass ticketId and currentUser props
4. Test with multiple users
5. Customize colors/styling as needed

That's it! Your real-time chat is ready! 💬
