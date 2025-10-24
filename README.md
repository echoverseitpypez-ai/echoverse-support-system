# EchoVerse IT Support System

A comprehensive, enterprise-grade support and management system built with React 19, Node.js, Express, and Supabase. Features real-time updates, advanced analytics, class scheduling, team collaboration, file attachments, SLA tracking, and much more.

**Version:** 2.1.0  
**Last Updated:** October 23, 2025  
**Status:** ✅ Production Ready

## 🚀 Features

### Core Support System
- **Authentication & Authorization**: Multi-role support (Admin, Agent, Teacher, User)
- **Ticket Management**: Create, update, assign, and track tickets with full lifecycle management
- **Real-time Updates**: WebSocket integration for live notifications and presence
- **File Attachments**: Upload and manage ticket attachments (10MB limit)
- **Advanced Analytics**: Comprehensive dashboards with performance metrics
- **SLA Tracking**: Automated SLA monitoring and breach notifications
- **Bulk Operations**: Update multiple tickets simultaneously

### 🎓 Class Schedule System (NEW)
- **Academic Terms Management**: Semester/term organization (Fall 2025, Spring 2026)
- **Course Catalog**: Subject management with codes (CS101, MATH201)
- **Class Schedules**: Weekly recurring classes with time/location
- **Student Enrollments**: Track class registrations and capacity
- **Attendance Tracking**: Mark present/absent/late per session
- **Class Announcements**: Class-specific notifications
- **Office Hours**: Teacher availability schedules
- **Dual Timezone Support**: KST (Korean) and PH (Philippines) time display
- **Real-time Countdown**: Next class countdown timer on dashboard

### 💬 Team Collaboration
- **Team Chat**: Real-time team messaging with WebSocket
- **Public Team Chat**: Open communication channels
- **File Sharing**: Share files within chat conversations
- **Typing Indicators**: See when team members are typing
- **Online Presence**: Real-time user status tracking

### 📊 Enhanced Dashboards
- **Teacher Dashboard**: 
  - Today's schedule with countdown timer
  - Quick notes widget with local persistence
  - Dual timezone display (KST/PH)
  - Ticket statistics and management
  - Class schedule integration
- **Admin Dashboard**:
  - System-wide analytics and metrics
  - User management interface
  - Email settings configuration
  - Department and team management
  - Bulk operations panel

### Advanced Features
- **Priority & Category Management**: Flexible ticket categorization
- **Team & Department Support**: Organize users and tickets by teams/departments
- **Activity Logging**: Complete audit trail for all ticket activities
- **Search & Filtering**: Advanced search with multiple filters
- **Rate Limiting**: Built-in API rate limiting for security
- **Input Validation**: Comprehensive validation with Zod schemas
- **Responsive Design**: Modern, mobile-first UI design
- **Email Notifications**: Configurable email alerts for ticket updates
- **Session Management**: Server restart detection and handling

## 🏗️ Architecture

### Backend Stack
- **Node.js 18+** with **Express.js** - REST API server
- **Socket.io 4.8+** - Real-time WebSocket communication
- **Supabase 2.45+** - Database, authentication, and storage
- **Zod 3.23+** - Runtime type validation and schema validation
- **Multer** - File upload handling with size limits
- **Express Rate Limit** - API rate limiting for security
- **Nodemailer** - Email notification system
- **CORS** - Configurable cross-origin resource sharing

### Frontend Stack
- **React 19.2** - Modern user interface with latest features
- **React Router 6.27** - Client-side routing and navigation
- **Vite 5.4** - Lightning-fast build tool and dev server
- **Modern CSS** - Custom styling with CSS Grid/Flexbox and CSS variables
- **Custom Hooks** - Reusable logic for performance monitoring and data fetching

### Database
- **PostgreSQL** (via Supabase) with comprehensive schema
- **Row Level Security (RLS)** for data protection
- **Automatic timestamps** and audit trails
- **20+ Indexes** for optimized query performance
- **Views and Functions** for complex queries
- **Real-time Subscriptions** support

## 📁 Project Structure

```
├── config/                  # Configuration files
│   ├── .env.example        # Environment templates
│   ├── .env.local          # Local environment config
│   ├── .env.db.local       # Database configuration
│   ├── .env.server.local   # Server configuration
│   └── README.md           # Config documentation
├── src/                     # Frontend React application
│   ├── components/         # Reusable React components
│   │   ├── ClassScheduleExample.jsx
│   │   ├── EmailSettings.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── TicketChat.jsx
│   ├── pages/              # Page components
│   │   ├── EnhancedAdminDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── Schedule.jsx
│   │   ├── TeamChat.jsx
│   │   ├── PublicTeamChat.jsx
│   │   └── Login.jsx
│   ├── hooks/              # Custom React hooks
│   │   ├── usePerformance.js
│   │   └── useWebSocket.js
│   ├── utils/              # Utility functions
│   │   ├── logger.js       # Centralized logging
│   │   └── sessionValidator.js
│   ├── config/             # Frontend configuration
│   │   └── constants.js    # Application constants
│   └── styles/             # CSS styles
├── server/                  # Backend Express server
│   ├── routes/             # API routes
│   │   ├── tickets.js
│   │   ├── users.js
│   │   ├── analytics.js
│   │   ├── attachments.js
│   │   ├── email.js
│   │   ├── settings.js
│   │   └── teachers.js
│   ├── middleware/         # Express middleware
│   │   └── security.js     # Rate limiting & sanitization
│   ├── services/           # Business logic
│   │   └── emailService.js
│   ├── websocket.js        # WebSocket server
│   └── index.js            # Main server file
├── scripts/                 # Utility scripts
│   ├── setup/              # Setup scripts
│   ├── create-admin.js     # Admin user creation
│   ├── manage-teachers.js  # Teacher management
│   └── run-sql.js          # Database setup
├── tests/                   # Test files
├── db/                      # Database schemas
│   ├── enhanced_schema.sql
│   ├── class_schedule_schema.sql
│   ├── team_chat_schema.sql
│   └── chat_schema.sql
├── docs/                    # Comprehensive documentation
│   ├── CLASS_SCHEDULE_SETUP.md
│   ├── CLASS_SCHEDULE_QUICKSTART.md
│   ├── email/              # Email setup guides
│   ├── chat/               # Chat system docs
│   ├── features/           # Feature documentation
│   └── deployment/         # Deployment guides
└── public/                  # Static assets
```

## 📦 Installation

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Supabase account** (free tier works)
- **Git** (for version control)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd "New Version ticket support"
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**

Copy example files from the `config/` directory:

```bash
# Copy example files
cp config/.env.example config/.env.local
cp config/.env.server.example config/.env.server.local
cp config/.env.db.example config/.env.db.local
```

Then edit the files with your actual configuration:

**`config/.env.server.local`** (Server environment):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_URL=http://localhost:3000
PORT=3001
```

**`config/.env.local`** (Client environment):
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

4. **Database Setup**

Run the enhanced database schema:
```bash
npm run db:setup
```

Or manually execute the SQL files in your Supabase SQL Editor:
- `db/enhanced_schema.sql` - Core ticket system
- `db/class_schedule_schema.sql` - Class scheduling system
- `db/team_chat_schema.sql` - Team chat functionality
- `db/chat_schema.sql` - Additional chat features

**Note:** See `docs/CLASS_SCHEDULE_SETUP.md` for detailed class schedule setup instructions.

5. **Create Admin User**
```bash
npm run admin:create
```

## 🚀 Running the Application

### Development Mode
```bash
# Run both client and server concurrently
npm run dev

# Or run separately
npm run react:client  # Client on http://localhost:3000
npm run dev:server    # Server on http://localhost:3001
```

**Access Points:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- WebSocket: `ws://localhost:3001`
- Network Access: `http://<your-ip>:3000` (LAN devices)

### Production Mode
```bash
npm run build
npm start
```

## 📖 API Documentation

### Authentication
All API endpoints (except public teacher signup) require authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Tickets API (`/api/tickets`)

**GET /api/tickets** - List tickets with advanced filtering
```http
GET /api/tickets?page=1&limit=20&search=bug&status=open&priority=high
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)  
- `search` - Search in title and description
- `status` - Filter by status (open, in_progress, pending, resolved, closed)
- `priority` - Filter by priority (low, normal, high, urgent)
- `category` - Filter by category
- `assigned_to` - Filter by assigned user ID
- `department_id` - Filter by department ID
- `sortBy` - Sort field (created_at, updated_at, priority, status, title)
- `sortOrder` - Sort order (asc, desc)

**POST /api/tickets** - Create ticket
```json
{
  "title": "Bug in login system",
  "description": "Users cannot log in with valid credentials",
  "priority": "high",
  "category": "Bug Report",
  "department_id": "uuid",
  "tags": ["login", "authentication"],
  "due_date": "2023-12-31T23:59:59Z"
}
```

**GET /api/tickets/:id** - Get ticket details
Returns full ticket with messages, activities, and attachments.

**PATCH /api/tickets/:id** - Update ticket
```json
{
  "title": "Updated title",
  "status": "in_progress", 
  "priority": "urgent",
  "assigned_to": "user-uuid",
  "resolution": "Fixed by updating authentication service"
}
```

**POST /api/tickets/:id/messages** - Add message/comment
```json
{
  "body": "This has been assigned to the development team",
  "is_internal": false,
  "message_type": "comment"
}
```

#### Analytics API (`/api/analytics`)

**GET /api/analytics/dashboard** - Dashboard overview
Returns user-specific dashboard data including ticket counts, recent tickets, urgent items.

**GET /api/analytics/performance** - Performance metrics
```http
GET /api/analytics/performance?timeframe=30d
```
Returns resolution times, response times, agent performance.

**GET /api/analytics/trends** - Trend analysis  
```http
GET /api/analytics/trends?period=weekly
```
Returns ticket trends by priority, status, and department.

#### Attachments API (`/api/attachments`)

**POST /api/attachments/:ticketId/upload** - Upload files
```http
POST /api/attachments/ticket-uuid/upload
Content-Type: multipart/form-data

files: [File objects]
```

**GET /api/attachments/:ticketId/download/:attachmentId** - Download file

**DELETE /api/attachments/:ticketId/attachments/:attachmentId** - Delete attachment

**GET /api/attachments/:ticketId/attachments** - List ticket attachments

#### User Management (`/api/users`)

**GET /api/users** - List users (admin/agent only)

**POST /api/users** - Create user (admin only)
```json
{
  "username": "john.doe",
  "password": "secure_password",
  "full_name": "John Doe",
  "role": "agent",
  "department_id": "uuid"
}
```

**PATCH /api/users/:id** - Update user (admin only)

**DELETE /api/users/:id** - Delete user (admin only)

### Bulk Operations

**PATCH /api/tickets/bulk/update** - Bulk update tickets
```json
{
  "ticket_ids": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "status": "resolved",
    "assigned_to": "agent-uuid"
  }
}
```

### SLA Endpoints

**GET /api/tickets/analytics/summary** - Ticket analytics summary
**GET /api/tickets/sla/status** - SLA status overview

## 🔧 WebSocket Events

### Client → Server Events

- `join_ticket` - Join ticket room for real-time updates
- `leave_ticket` - Leave ticket room  
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `update_presence` - Update user online status

### Server → Client Events

- `ticket_updated` - Ticket was updated
- `new_message` - New message added to ticket
- `ticket_assigned` - Ticket assigned to user
- `new_ticket` - New ticket created (staff only)
- `new_notification` - New notification for user
- `sla_breach` - SLA breach warning
- `files_uploaded` - Files uploaded to ticket
- `user_typing` - Another user is typing
- `user_presence_updated` - User online status changed
- `system_announcement` - System-wide announcement

## 🎨 UI Components

### Dashboard Components
- **StatCard** - Metric display cards
- **PriorityChart** - Priority distribution chart
- **StatusChart** - Status distribution visualization
- **RecentTickets** - Recent ticket list
- **SLAStatus** - SLA monitoring widget

### Styling Classes
- **Priority badges**: `.priority-badge.urgent/high/normal/low`
- **Status badges**: `.status-badge.open/in_progress/pending/resolved/closed`
- **Charts**: `.chart-card`, `.priority-chart`, `.status-chart`
- **Loading states**: `.loading-spinner`, `.dashboard-loading`

## 🔒 Security Features

### API Security
- **Rate limiting** on all endpoints
- **Input sanitization** and validation
- **Role-based access control**
- **JWT token authentication**
- **Audit logging** for all actions

### Database Security
- **Row Level Security (RLS)** policies
- **Parameterized queries** (via Supabase)
- **Encrypted connections**

### File Upload Security
- **File type validation**
- **File size limits** (10MB max)
- **Secure file storage**
- **Access control** on downloads

## 📊 Database Schema

### Core Tables
- **tickets** - Main ticket data with SLA tracking
- **ticket_messages** - Comments and communication
- **ticket_activities** - Complete audit trail
- **ticket_attachments** - File attachments
- **profiles** - User profiles with roles
- **departments** - Organization structure
- **teams** - User groupings
- **notifications** - User notifications

### Enhancement Tables
- **ticket_categories** - Configurable categories
- **sla_policies** - SLA rules and timeframes
- **escalation_rules** - Automatic escalation logic
- **ticket_templates** - Reusable ticket templates
- **user_permissions** - Granular permissions
- **kb_articles** - Knowledge base articles

### Class Schedule Tables (8 tables)
- **academic_terms** - Semester/term management
- **subjects** - Course catalog
- **class_schedules** - Weekly class schedules
- **class_enrollments** - Student registrations
- **class_sessions** - Individual class meetings
- **attendance_records** - Attendance tracking
- **class_announcements** - Class notifications
- **office_hours** - Teacher availability

### Chat System Tables
- **team_chat_messages** - Team chat messages
- **team_chat_participants** - Chat participants
- **chat_rooms** - Chat room management
- **chat_files** - Shared files in chat

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Integration tests  
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Test Coverage
- API endpoint tests
- WebSocket connection tests
- Authentication flow tests
- File upload/download tests
- Database operation tests

## 📈 Performance Optimization

### Database
- **Indexed queries** on frequently accessed columns
- **Efficient joins** with proper foreign keys
- **Query optimization** for large datasets
- **Connection pooling** via Supabase

### API
- **Response caching** for analytics
- **Pagination** for large result sets
- **Rate limiting** to prevent abuse
- **Compressed responses**

### Frontend  
- **Code splitting** with React Router
- **Lazy loading** of components
- **Optimized re-renders** with proper state management
- **Responsive images** and assets

## 🚀 Deployment

### Environment Variables
Set the following in your production environment:
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
CLIENT_URL=https://your-domain.com
PORT=3001
NODE_ENV=production
```

### Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Recommended Hosting
- **Vercel** or **Netlify** for frontend
- **Railway**, **Render**, or **Heroku** for backend
- **Supabase** for database and authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation above
- Review the database schema in `db/enhanced_schema.sql`

## 🔄 Version History

### v2.1.0 (Current - October 2025)
- ✅ **Class Schedule System** - Complete academic scheduling with 8 tables
- ✅ **Team Chat** - Real-time team collaboration with file sharing
- ✅ **Enhanced Teacher Dashboard** - Today's schedule, countdown timer, quick notes
- ✅ **Dual Timezone Support** - KST and PH time display
- ✅ **Code Quality Improvements** - Centralized logging, constants, security fixes
- ✅ **Session Management** - Server restart detection
- ✅ **Email Notifications** - Configurable email alerts
- ✅ **Performance Monitoring** - Custom hooks for performance tracking
- ✅ **Security Enhancements** - Environment validation, request limits, CORS hardening

### v2.0.0 (Enhanced Version - September 2025)
- ✅ Advanced analytics and dashboards
- ✅ Real-time WebSocket communication  
- ✅ File attachment system
- ✅ SLA tracking and monitoring
- ✅ Bulk operations
- ✅ Enhanced security and validation
- ✅ Modern responsive UI
- ✅ Comprehensive API documentation

### v1.0.0 (Initial Version)
- Basic ticket CRUD operations
- User authentication
- Simple dashboard
- Basic role management

## 📚 Additional Documentation

For detailed information on specific features:

### Class Schedule System
- 📖 **Setup Guide**: `docs/CLASS_SCHEDULE_SETUP.md`
- 🚀 **Quick Start**: `docs/CLASS_SCHEDULE_QUICKSTART.md`
- 📋 **Overview**: `README_CLASS_SCHEDULE.md`
- 🎯 **Deployment**: `CLASS_SCHEDULE_DEPLOYMENT.md`

### Recent Improvements
- 📝 **Changes Applied**: `CHANGES_APPLIED.md` - Code review fixes
- 🎯 **Action Plan**: `ACTION_PLAN.md` - Development roadmap
- 🔧 **Fixes Summary**: `FIXES_SUMMARY.md` - Path and configuration fixes
- 📊 **Dashboard Enhancements**: `DASHBOARD_ENHANCEMENTS.md`

### Email System
- 📧 **Email Setup**: `docs/email/SETUP_EMAIL_NOTIFICATIONS.md`
- ⚙️ **Admin Settings**: `docs/email/EMAIL_ADMIN_SETTINGS.md`
- 🧪 **Testing**: `docs/email/test-email-integration.md`

### Chat System
- 💬 **Team Chat**: `docs/chat/TEAM_CHAT_DEBUG.md`
- 🔧 **Troubleshooting**: `docs/features/REALTIME_TROUBLESHOOTING.md`

## 🛠️ Code Quality & Maintenance

### Recent Code Improvements (October 2025)
- ✅ **Centralized Logging**: `src/utils/logger.js` - Environment-aware logging
- ✅ **Application Constants**: `src/config/constants.js` - No more magic numbers
- ✅ **Environment Validation**: Server startup checks for required variables
- ✅ **Request Size Limits**: 10MB limit to prevent DOS attacks
- ✅ **CORS Hardening**: Production-ready CORS configuration
- ✅ **Console Log Cleanup**: Replaced 69+ console.log statements
- ✅ **Path Organization**: All config files in `config/` directory

### Remaining Console Logs
The following files still contain console.log statements (69 total):
- `src/pages/EnhancedAdminDashboard.jsx` - 24 statements
- `src/pages/PublicTeamChat.jsx` - 15 statements
- `src/pages/TeamChat.jsx` - 12 statements
- `src/utils/performanceTest.js` - 11 statements (intentional for testing)
- `src/pages/Schedule.jsx` - 2 statements
- `server/` files - 16 statements (mostly error logging)

**Note**: Server console.logs are intentional for production logging.

## 🔐 Security Best Practices

### Implemented Security Measures
- ✅ Environment variable validation on startup
- ✅ Request size limits (10MB)
- ✅ Rate limiting on all API endpoints
- ✅ Input sanitization and validation
- ✅ Row Level Security (RLS) on database
- ✅ JWT token authentication
- ✅ CORS configuration for production
- ✅ File type and size validation
- ✅ Audit logging for all actions

### Configuration Files
All sensitive configuration files are in the `config/` directory and gitignored:
- `config/.env.local`
- `config/.env.server.local`
- `config/.env.db.local`
- `config/.env.email.local`

## 🧪 Available Scripts

```bash
# Development
npm run dev              # Run both client and server
npm run react:client     # Run only React client
npm run dev:server       # Run only Express server

# Production
npm run build            # Build for production
npm start                # Start production server
npm run preview          # Preview production build

# Database
npm run db:setup         # Setup database schema
npm run supabase:ping    # Test Supabase connection

# User Management
npm run admin:create     # Create admin user
npm run manage:teachers  # Manage teacher accounts
npm run migrate:teacher-role  # Migrate teacher roles
```

## 🌐 Network Access

The application is configured for LAN access:
- Server listens on `0.0.0.0` (all network interfaces)
- Vite dev server has `host: true` for network exposure
- CORS allows development origins by default
- Network IP displayed on server startup

**Access from other devices:**
```
http://<your-computer-ip>:3000
```

## 📊 Performance Features

- **Code Splitting**: React Router lazy loading
- **Optimized Re-renders**: React.memo and useMemo
- **Database Indexes**: 20+ indexes for fast queries
- **Connection Pooling**: Via Supabase
- **Response Caching**: For analytics endpoints
- **Pagination**: All list endpoints support pagination
- **WebSocket**: Efficient real-time updates

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: CSS variables for theming
- **Loading States**: Skeleton screens and spinners
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: User feedback for actions
- **Keyboard Shortcuts**: Ctrl+Enter for quick actions
- **Accessibility**: ARIA labels and semantic HTML