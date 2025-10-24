# Team Chat System Setup Guide

## 🚀 Quick Start

### Step 1: Run Database Migration

Open your Supabase SQL Editor and run:
```sql
-- Copy and paste the content from:
db/team_chat_schema.sql
```

This creates:
- ✅ `team_chats` table (all chat rooms)
- ✅ `team_chat_messages` table (all messages)
- ✅ `team_chat_members` table (chat participants)
- ✅ Function to create/get direct chats
- ✅ Real-time triggers
- ✅ Security policies

### Step 2: Add Route to Your App

Add the Team Chat route to your router:

```jsx
// In your App.jsx or Routes.jsx
import TeamChat from './pages/TeamChat'

// Add this route:
<Route path="/team-chat" element={<TeamChat />} />
```

### Step 3: Add Navigation Link

Add a link to your navigation menu:

```jsx
// In your navigation component
<a href="/team-chat" className="nav-link">
  💬 Team Chat
</a>

// Or for React Router:
<Link to="/team-chat" className="nav-link">
  💬 Team Chat
</Link>
```

### Step 4: Add to Admin Dashboard Sidebar

Example integration in admin sidebar:

```jsx
// In src/pages/EnhancedAdminDashboard.jsx or similar

<div className="sidebar">
  <a href="#overview">📊 Dashboard</a>
  <a href="#tickets">🎫 Tickets</a>
  <a href="#management">⚙️ Management</a>
  
  {/* Add this */}
  <a href="/team-chat" className="sidebar-link">
    💬 Team Chat
  </a>
</div>
```

## ✨ Features

### 1. Direct Messaging
- ✅ One-on-one chats between team members
- ✅ Auto-creates chat room on first message
- ✅ No duplicate rooms created

### 2. Real-Time Communication
- ✅ Messages appear instantly
- ✅ Uses Supabase Realtime
- ✅ No refresh needed

### 3. Team Member List
- ✅ See all teachers, admins, and agents
- ✅ Click to start chatting
- ✅ Role badges (👑 Admin, 🎧 Agent, 👨‍🏫 Teacher)

### 4. Chat Interface
```
┌─────────────────────────────────────┐
│ SIDEBAR          │ MAIN CHAT AREA   │
│                  │                  │
│ 💬 Team Chat     │ Selected Chat    │
│ [+ New Chat]     │ Messages here    │
│                  │                  │
│ 👑 Admin User    │ [Type message]   │
│ 🎧 Agent User    │                  │
│ 👨‍🏫 Teacher      │                  │
└─────────────────────────────────────┘
```

### 5. Message Display
- Your messages: Purple gradient (right side)
- Others' messages: White with border (left side)
- Shows sender name and role
- Timestamps (Just now, 5m ago, Yesterday, etc.)

## 🎯 Usage Examples

### For Teachers
```
Teacher logs in
  ↓
Clicks "Team Chat"
  ↓
Clicks "New Chat"
  ↓
Selects an Admin
  ↓
Types question: "How do I handle this ticket?"
  ↓
Admin sees message instantly and replies
```

### For Admins
```
Admin needs to notify all agents
  ↓
Opens Team Chat
  ↓
Starts chat with each agent
  ↓
Sends important update
  ↓
Agents receive in real-time
```

### For Agents
```
Agent needs help from another agent
  ↓
Opens Team Chat
  ↓
Finds colleague
  ↓
Starts conversation
  ↓
Collaborate on solution
```

## 🔐 Security

### Row Level Security (RLS)
- Users can only see chats they're part of
- Users can only send to chats they're in
- Auto-enforced by database policies

### Role-Based Access
- Only staff roles can use team chat:
  - ✅ Teachers
  - ✅ Admins
  - ✅ Agents
- Regular users (role: 'user') are excluded

### Message Integrity
- sender_id automatically set to current user
- Can't impersonate others
- Can't send to chats you're not in

## 🎨 Customization

### Change Theme Colors

Edit `src/styles/team-chat.css`:

```css
/* Sidebar header gradient */
.sidebar-header {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}

/* Your message bubbles */
.message-me .message-bubble {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}

/* Send button */
.chat-send-btn {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}
```

### Change Sidebar Width

```css
.team-chat-container {
  grid-template-columns: 350px 1fr; /* Change 350px to your preferred width */
}
```

### Add Group Chats

The database already supports group chats! To add group chat creation:

```jsx
// Add this function to TeamChat.jsx
const createGroupChat = async (memberIds, chatName) => {
  const { data, error } = await supabase
    .from('team_chats')
    .insert([{
      created_by: currentUser.id,
      is_group: true,
      chat_name: chatName
    }])
    .select()
    .single()

  // Add all members
  const members = memberIds.map(id => ({
    chat_id: data.id,
    user_id: id
  }))

  await supabase
    .from('team_chat_members')
    .insert(members)

  return data
}
```

## 📊 Database Tables

### team_chats
```sql
- id: UUID
- chat_name: TEXT (optional, for group chats)
- is_group: BOOLEAN (false for direct messages)
- created_by: UUID (who started the chat)
- last_message_at: TIMESTAMPTZ (for sorting)
- last_message_preview: TEXT (for preview in list)
```

### team_chat_messages
```sql
- id: UUID
- chat_id: UUID (which chat)
- sender_id: UUID (who sent it)
- message: TEXT (content)
- created_at: TIMESTAMPTZ
- is_read: BOOLEAN
- read_by: UUID[] (array of user IDs who read it)
```

### team_chat_members
```sql
- id: UUID
- chat_id: UUID
- user_id: UUID (who is in the chat)
- joined_at: TIMESTAMPTZ
- is_active: BOOLEAN (for leaving chats)
```

## 🐛 Troubleshooting

### Messages Not Appearing
1. Check Supabase Realtime is enabled
2. Verify RLS policies: `SELECT * FROM team_chat_messages`
3. Check browser console for errors

### Can't Start Chat
1. Verify user role is teacher/admin/agent
2. Check function permissions: `GRANT EXECUTE ON FUNCTION get_or_create_direct_chat`
3. Verify both users exist in profiles table

### Sidebar Not Showing Chats
1. Check team_chat_members has entries
2. Verify is_active = true
3. Check RLS policies allow SELECT

### Styling Issues
1. Ensure `team-chat.css` is imported in `TeamChat.jsx`
2. Check for CSS conflicts
3. Verify class names match

## 🚀 Advanced Features (Future)

### Typing Indicators
```jsx
// Add to TeamChat.jsx
const [typingUsers, setTypingUsers] = useState([])

// Broadcast typing
const handleTyping = debounce(() => {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: currentUser.id, name: currentUser.full_name }
  })
}, 300)
```

### Read Receipts
```jsx
// Mark as read when viewing
useEffect(() => {
  if (activeChat && messages.length > 0) {
    const unreadMessages = messages.filter(m => 
      m.sender_id !== currentUser.id && !m.read_by?.includes(currentUser.id)
    )
    
    // Update read_by array
    unreadMessages.forEach(msg => {
      supabase
        .from('team_chat_messages')
        .update({ 
          read_by: [...(msg.read_by || []), currentUser.id] 
        })
        .eq('id', msg.id)
        .then(() => {})
    })
  }
}, [activeChat, messages])
```

### File Attachments
```sql
-- Add to team_chat_messages
ALTER TABLE team_chat_messages 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
```

### Message Search
```jsx
const searchMessages = async (query) => {
  const { data } = await supabase
    .from('team_chat_messages')
    .select('*, chat:chat_id(*)')
    .ilike('message', `%${query}%`)
    .limit(50)
  
  return data
}
```

## 📱 Mobile Responsive

The chat is mobile-friendly:
- Sidebar auto-hides on mobile
- Messages stack vertically
- Touch-friendly buttons
- Optimized for small screens

## ✅ Testing Checklist

- [ ] Database migration ran successfully
- [ ] Team Chat page accessible at `/team-chat`
- [ ] Navigation link works
- [ ] Can see team members list
- [ ] Can start new chat
- [ ] Messages send instantly
- [ ] Messages appear in real-time
- [ ] Role badges display correctly
- [ ] Timestamps show properly
- [ ] Multiple chats work
- [ ] Chat list updates
- [ ] Mobile view works

## 🎉 You're All Set!

Your team chat system is now ready. Teachers, admins, and agents can now communicate in real-time!

**Key URLs:**
- Team Chat: `/team-chat`
- Database: Supabase Dashboard → Table Editor → team_chats

**Need Help?**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies in Supabase
- Test with multiple user accounts
