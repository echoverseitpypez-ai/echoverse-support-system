-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns to existing tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS sla_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update ticket status enum to include more statuses
ALTER TABLE tickets 
ALTER COLUMN status TYPE VARCHAR(20);

-- Update priority enum to include urgent
ALTER TABLE tickets 
ALTER COLUMN priority TYPE VARCHAR(20);

-- Create departments table if it doesn't exist
-- NOTE: your existing departments.id is integer. Keep integer to avoid FK issues.
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY, -- integer to match existing schema (uses sequences)
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id), -- MATCH: integer FK
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing profiles table (after teams exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Create ticket categories table
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES departments(id), -- MATCH: integer FK
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket activities table for audit trail
CREATE TABLE IF NOT EXISTS ticket_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT, -- For cloud storage URLs
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance ticket messages table
ALTER TABLE ticket_messages 
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'comment',
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);

-- Create ticket templates table
CREATE TABLE IF NOT EXISTS ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    title_template TEXT NOT NULL,
    description_template TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    category VARCHAR(100),
    department_id INTEGER REFERENCES departments(id), -- MATCH: integer FK
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SLA policies table
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    department_id INTEGER REFERENCES departments(id), -- MATCH: integer FK
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT FALSE,
    related_ticket_id UUID REFERENCES tickets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create user permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    permission VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- ticket, user, department, etc.
    resource_id UUID, -- specific resource ID or NULL for global
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission, resource_type, resource_id)
);

-- Create escalation rules table
CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id), -- MATCH: integer FK
    priority VARCHAR(20) NOT NULL,
    escalate_after_hours INTEGER NOT NULL,
    escalate_to_user_id UUID REFERENCES auth.users(id),
    escalate_to_team_id UUID REFERENCES teams(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create knowledge base articles table
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(100),
    tags TEXT[],
    author_id UUID NOT NULL REFERENCES auth.users(id),
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_due_date ON tickets(sla_due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(sender);

CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_created_at ON ticket_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_user_id ON ticket_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by ON ticket_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_templates_updated_at ON ticket_templates;
CREATE TRIGGER update_ticket_templates_updated_at 
    BEFORE UPDATE ON ticket_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sla_policies_updated_at ON sla_policies;
CREATE TRIGGER update_sla_policies_updated_at 
    BEFORE UPDATE ON sla_policies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('IT Support', 'Information Technology support and services'),
('Human Resources', 'HR related queries and support'),
('Finance', 'Financial and accounting support'),
('Facilities', 'Building and facilities management'),
('General', 'General inquiries and support')
ON CONFLICT DO NOTHING;

-- Insert default SLA policies
INSERT INTO sla_policies (name, priority, response_time_hours, resolution_time_hours) VALUES
('Urgent Priority SLA', 'urgent', 1, 4),
('High Priority SLA', 'high', 4, 24),
('Normal Priority SLA', 'normal', 8, 48),
('Low Priority SLA', 'low', 24, 72)
ON CONFLICT DO NOTHING;

-- Insert default ticket categories
INSERT INTO ticket_categories (name, description, color) VALUES
('Bug Report', 'Software bugs and technical issues', '#ff4444'),
('Feature Request', 'New feature or enhancement requests', '#44ff44'),
('Account Issue', 'User account related problems', '#4444ff'),
('Hardware Problem', 'Hardware failures and issues', '#ff8800'),
('Network Issue', 'Network connectivity problems', '#8800ff'),
('Security Concern', 'Security related issues', '#ff0080'),
('General Question', 'General inquiries and questions', '#888888')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_activities
CREATE POLICY "Users can view ticket activities for their accessible tickets" ON ticket_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_activities.ticket_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('admin', 'agent')
                )
            )
        )
    );

-- RLS policies for ticket_attachments
CREATE POLICY "Users can manage attachments for their accessible tickets" ON ticket_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_attachments.ticket_id
            AND (
                t.created_by = auth.uid()
                OR t.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('admin', 'agent')
                )
            )
        )
    );

-- RLS policies for notifications
CREATE POLICY "Users can only see their own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- Create views for common queries
CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
    t.id,
    t.ticket_number,
    t.title,
    t.status,
    t.priority,
    t.category,
    t.created_at,
    t.updated_at,
    t.sla_due_date,
    creator.full_name as creator_name,
    assignee.full_name as assignee_name,
    dept.name as department_name,
    CASE 
        WHEN t.sla_due_date IS NOT NULL AND t.sla_due_date < NOW() 
        THEN 'overdue'
        WHEN t.sla_due_date IS NOT NULL AND t.sla_due_date < NOW() + INTERVAL '2 hours'
        THEN 'due_soon'
        ELSE 'on_track'
    END as sla_status,
    (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) as message_count,
    (SELECT COUNT(*) FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachment_count
FROM tickets t
LEFT JOIN profiles creator ON t.created_by = creator.id
LEFT JOIN profiles assignee ON t.assigned_to = assignee.id
LEFT JOIN departments dept ON t.department_id = dept.id;

-- Grant permissions
GRANT SELECT ON ticket_summary TO authenticated;
GRANT ALL ON departments TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON ticket_categories TO authenticated;
GRANT ALL ON ticket_activities TO authenticated;
GRANT ALL ON ticket_attachments TO authenticated;
GRANT ALL ON ticket_templates TO authenticated;
GRANT ALL ON sla_policies TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON user_permissions TO authenticated;
GRANT ALL ON escalation_rules TO authenticated;
GRANT ALL ON kb_articles TO authenticated;