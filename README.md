# Enhanced Ticket Support System

A comprehensive, modern ticket support system built with React, Node.js, Express, and Supabase. Features real-time updates, advanced analytics, file attachments, SLA tracking, and much more.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: Multi-role support (Admin, Agent, Teacher, User)
- **Ticket Management**: Create, update, assign, and track tickets
- **Real-time Updates**: WebSocket integration for live notifications
- **File Attachments**: Upload and manage ticket attachments
- **Advanced Analytics**: Comprehensive dashboards and reporting
- **SLA Tracking**: Automated SLA monitoring and breach notifications
- **Bulk Operations**: Update multiple tickets simultaneously

### Advanced Features
- **Priority & Category Management**: Flexible ticket categorization
- **Team & Department Support**: Organize users and tickets by teams/departments
- **Activity Logging**: Complete audit trail for all ticket activities
- **Search & Filtering**: Advanced search with multiple filters
- **Rate Limiting**: Built-in API rate limiting for security
- **Input Validation**: Comprehensive validation with Zod schemas
- **Responsive Design**: Modern, mobile-first UI design

## 🏗️ Architecture

### Backend Stack
- **Node.js** with **Express.js** - REST API server
- **Socket.io** - Real-time WebSocket communication
- **Supabase** - Database and authentication
- **Zod** - Runtime type validation
- **Multer** - File upload handling
- **Express Rate Limit** - API rate limiting

### Frontend Stack
- **React 19** - User interface
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Modern CSS** - Custom styling with CSS Grid/Flexbox

### Database
- **PostgreSQL** (via Supabase) with comprehensive schema
- **Row Level Security (RLS)** for data protection
- **Automatic timestamps** and audit trails

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
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── styles/             # CSS styles
├── server/                  # Backend Express server
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   └── services/           # Business logic
├── scripts/                 # Utility scripts
│   └── setup/              # Setup and configuration scripts
├── tests/                   # Test files
├── db/                      # Database schemas and migrations
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

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

Or manually execute `db/enhanced_schema.sql` in your Supabase SQL editor.

5. **Create Admin User**
```bash
npm run admin:create
```

## 🚀 Running the Application

### Development Mode
```bash
# Run both client and server
npm run dev

# Or run separately
npm run dev:client  # Client on http://localhost:3000
npm run dev:server  # Server on http://localhost:3001
```

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

### v2.0.0 (Enhanced Version)
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