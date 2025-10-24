-- =====================================================
-- CLASS SCHEDULE DATABASE SCHEMA FOR SUPABASE
-- =====================================================
-- This schema adds class scheduling functionality to the ticket support system
-- Compatible with existing departments and profiles tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. ACADEMIC TERMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g., "Fall 2025", "Spring 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_term_dates CHECK (end_date > start_date)
);

-- =====================================================
-- 2. SUBJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., "CS101", "MATH201"
    name VARCHAR(200) NOT NULL, -- e.g., "Introduction to Programming"
    description TEXT,
    department_id INTEGER REFERENCES departments(id), -- Links to existing departments
    credits INTEGER DEFAULT 3,
    color VARCHAR(7) DEFAULT '#4A90E2', -- Hex color for UI display
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CLASS SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id), -- Teacher conducting the class
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id),
    section VARCHAR(10), -- e.g., "A", "B", "Lab-1"
    
    -- Schedule details
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Location
    room VARCHAR(50),
    building VARCHAR(100),
    location_notes TEXT,
    
    -- Capacity and enrollment
    max_students INTEGER DEFAULT 30,
    enrolled_count INTEGER DEFAULT 0,
    
    -- Meeting type
    class_type VARCHAR(50) DEFAULT 'lecture', -- lecture, lab, tutorial, workshop, online
    meeting_link TEXT, -- For online classes (Zoom, Teams, etc.)
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_class_times CHECK (end_time > start_time),
    CONSTRAINT valid_capacity CHECK (max_students > 0)
);

-- =====================================================
-- 4. CLASS ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enrollment_status VARCHAR(20) DEFAULT 'enrolled', -- enrolled, dropped, completed, waitlisted
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    dropped_date TIMESTAMPTZ,
    grade VARCHAR(5), -- Final grade: A, B, C, etc.
    attendance_percentage DECIMAL(5,2),
    notes TEXT,
    UNIQUE(class_schedule_id, student_id)
);

-- =====================================================
-- 5. CLASS SESSIONS TABLE (For tracking individual class meetings)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    actual_start_time TIME,
    actual_end_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    topic TEXT,
    notes TEXT,
    homework_assigned TEXT,
    materials_link TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ATTENDANCE RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'absent', -- present, absent, late, excused
    check_in_time TIMESTAMPTZ,
    notes TEXT,
    marked_by UUID REFERENCES auth.users(id), -- Teacher who marked attendance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_session_id, student_id)
);

-- =====================================================
-- 7. CLASS ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS class_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    posted_by UUID NOT NULL REFERENCES auth.users(id),
    is_urgent BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]'::jsonb
);

-- =====================================================
-- 8. OFFICE HOURS TABLE (For teachers)
-- =====================================================
CREATE TABLE IF NOT EXISTS office_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    meeting_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_office_hours CHECK (end_time > start_time)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher ON class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_term ON class_schedules(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_subject ON class_schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_schedules_active ON class_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_schedule ON class_enrollments(class_schedule_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(enrollment_status);

CREATE INDEX IF NOT EXISTS idx_class_sessions_schedule ON class_sessions(class_schedule_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(class_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

CREATE INDEX IF NOT EXISTS idx_office_hours_teacher ON office_hours(teacher_id);
CREATE INDEX IF NOT EXISTS idx_office_hours_day ON office_hours(day_of_week);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Reuse the existing update_updated_at_column function if it exists
-- Otherwise create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS '
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        ' LANGUAGE 'plpgsql';
    END IF;
END $$;

-- Apply triggers
DROP TRIGGER IF EXISTS update_academic_terms_updated_at ON academic_terms;
CREATE TRIGGER update_academic_terms_updated_at 
    BEFORE UPDATE ON academic_terms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_schedules_updated_at ON class_schedules;
CREATE TRIGGER update_class_schedules_updated_at 
    BEFORE UPDATE ON class_schedules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_sessions_updated_at ON class_sessions;
CREATE TRIGGER update_class_sessions_updated_at 
    BEFORE UPDATE ON class_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at 
    BEFORE UPDATE ON attendance_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_office_hours_updated_at ON office_hours;
CREATE TRIGGER update_office_hours_updated_at 
    BEFORE UPDATE ON office_hours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is a teacher
CREATE OR REPLACE FUNCTION is_teacher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('teacher', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is enrolled in a class
CREATE OR REPLACE FUNCTION is_enrolled_in_class(user_id UUID, schedule_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM class_enrollments 
        WHERE student_id = user_id 
        AND class_schedule_id = schedule_id 
        AND enrollment_status = 'enrolled'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's classes
CREATE OR REPLACE FUNCTION is_class_teacher(user_id UUID, schedule_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM class_schedules 
        WHERE id = schedule_id 
        AND teacher_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update enrollment count when students enroll/drop
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.enrollment_status = 'enrolled' THEN
        UPDATE class_schedules 
        SET enrolled_count = enrolled_count + 1 
        WHERE id = NEW.class_schedule_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.enrollment_status = 'enrolled' AND NEW.enrollment_status != 'enrolled' THEN
            UPDATE class_schedules 
            SET enrolled_count = enrolled_count - 1 
            WHERE id = NEW.class_schedule_id;
        ELSIF OLD.enrollment_status != 'enrolled' AND NEW.enrollment_status = 'enrolled' THEN
            UPDATE class_schedules 
            SET enrolled_count = enrolled_count + 1 
            WHERE id = NEW.class_schedule_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.enrollment_status = 'enrolled' THEN
        UPDATE class_schedules 
        SET enrolled_count = enrolled_count - 1 
        WHERE id = OLD.class_schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_count_trigger ON class_enrollments;
CREATE TRIGGER enrollment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON class_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ACADEMIC TERMS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view academic terms" ON academic_terms
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage academic terms" ON academic_terms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- SUBJECTS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view active subjects" ON subjects
    FOR SELECT USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'agent', 'teacher')
    ));

CREATE POLICY "Teachers and admins can manage subjects" ON subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent', 'teacher')
        )
    );

-- =====================================================
-- CLASS SCHEDULES POLICIES
-- =====================================================
CREATE POLICY "Users can view active class schedules" ON class_schedules
    FOR SELECT USING (
        is_active = true OR 
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Teachers can manage their own classes" ON class_schedules
    FOR ALL USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- CLASS ENROLLMENTS POLICIES
-- =====================================================
CREATE POLICY "Students can view their own enrollments" ON class_enrollments
    FOR SELECT USING (
        student_id = auth.uid() OR
        is_class_teacher(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Students can enroll themselves" ON class_enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own enrollments" ON class_enrollments
    FOR UPDATE USING (
        student_id = auth.uid() OR
        is_class_teacher(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Teachers and admins can delete enrollments" ON class_enrollments
    FOR DELETE USING (
        is_class_teacher(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- CLASS SESSIONS POLICIES
-- =====================================================
CREATE POLICY "Users can view sessions for their classes" ON class_sessions
    FOR SELECT USING (
        is_class_teacher(auth.uid(), class_schedule_id) OR
        is_enrolled_in_class(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Teachers can manage sessions for their classes" ON class_sessions
    FOR ALL USING (
        is_class_teacher(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- ATTENDANCE RECORDS POLICIES
-- =====================================================
CREATE POLICY "Students can view their own attendance" ON attendance_records
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM class_sessions cs
            JOIN class_schedules csched ON cs.class_schedule_id = csched.id
            WHERE cs.id = class_session_id 
            AND csched.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Teachers can manage attendance for their classes" ON attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM class_sessions cs
            JOIN class_schedules csched ON cs.class_schedule_id = csched.id
            WHERE cs.id = class_session_id 
            AND csched.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- CLASS ANNOUNCEMENTS POLICIES
-- =====================================================
CREATE POLICY "Users can view announcements for their classes" ON class_announcements
    FOR SELECT USING (
        is_class_teacher(auth.uid(), class_schedule_id) OR
        is_enrolled_in_class(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Teachers can manage announcements for their classes" ON class_announcements
    FOR ALL USING (
        is_class_teacher(auth.uid(), class_schedule_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- OFFICE HOURS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view office hours" ON office_hours
    FOR SELECT USING (is_active = true);

CREATE POLICY "Teachers can manage their own office hours" ON office_hours
    FOR ALL USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agent')
        )
    );

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: Complete class schedule with all details
CREATE OR REPLACE VIEW class_schedule_details AS
SELECT 
    cs.id,
    cs.section,
    s.code as subject_code,
    s.name as subject_name,
    s.credits,
    s.color as subject_color,
    cs.day_of_week,
    CASE cs.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    cs.start_time,
    cs.end_time,
    cs.room,
    cs.building,
    cs.class_type,
    cs.max_students,
    cs.enrolled_count,
    ROUND((cs.enrolled_count::DECIMAL / cs.max_students) * 100, 2) as capacity_percentage,
    cs.teacher_id,
    teacher.full_name as teacher_name,
    teacher.avatar_url as teacher_avatar,
    dept.name as department_name,
    at.name as term_name,
    cs.is_active,
    cs.meeting_link,
    cs.notes
FROM class_schedules cs
JOIN subjects s ON cs.subject_id = s.id
JOIN profiles teacher ON cs.teacher_id = teacher.id
LEFT JOIN departments dept ON s.department_id = dept.id
JOIN academic_terms at ON cs.academic_term_id = at.id;

-- View: Student's enrolled classes
CREATE OR REPLACE VIEW student_class_view AS
SELECT 
    ce.id as enrollment_id,
    ce.student_id,
    csd.*,
    ce.enrollment_status,
    ce.enrollment_date,
    ce.grade,
    ce.attendance_percentage
FROM class_enrollments ce
JOIN class_schedule_details csd ON ce.class_schedule_id = csd.id
WHERE ce.enrollment_status = 'enrolled';

-- View: Teacher's classes
CREATE OR REPLACE VIEW teacher_class_view AS
SELECT 
    teacher_id,
    COUNT(*) as total_classes,
    SUM(enrolled_count) as total_students,
    array_agg(DISTINCT subject_name) as subjects_taught
FROM class_schedule_details
WHERE is_active = true
GROUP BY teacher_id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON class_schedule_details TO authenticated;
GRANT SELECT ON student_class_view TO authenticated;
GRANT SELECT ON teacher_class_view TO authenticated;

GRANT ALL ON academic_terms TO authenticated;
GRANT ALL ON subjects TO authenticated;
GRANT ALL ON class_schedules TO authenticated;
GRANT ALL ON class_enrollments TO authenticated;
GRANT ALL ON class_sessions TO authenticated;
GRANT ALL ON attendance_records TO authenticated;
GRANT ALL ON class_announcements TO authenticated;
GRANT ALL ON office_hours TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - comment out if not needed)
-- =====================================================

-- Insert sample academic term
INSERT INTO academic_terms (name, start_date, end_date, is_current, description) VALUES
('Fall 2025', '2025-09-01', '2025-12-20', true, 'Fall semester 2025')
ON CONFLICT DO NOTHING;

-- Insert sample subjects (assuming departments exist)
-- Note: Update department_id values based on your actual departments
INSERT INTO subjects (code, name, description, credits, color) VALUES
('CS101', 'Introduction to Computer Science', 'Fundamentals of programming and computer science', 3, '#3498db'),
('MATH201', 'Calculus I', 'Differential and integral calculus', 4, '#e74c3c'),
('ENG101', 'English Composition', 'Academic writing and composition', 3, '#2ecc71'),
('PHY101', 'Physics I', 'Classical mechanics and thermodynamics', 4, '#9b59b6'),
('HIST101', 'World History', 'Survey of world history from ancient to modern times', 3, '#f39c12')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Class Schedule Schema created successfully!';
    RAISE NOTICE '📚 Tables created: academic_terms, subjects, class_schedules, class_enrollments, class_sessions, attendance_records, class_announcements, office_hours';
    RAISE NOTICE '🔒 RLS policies enabled for all tables';
    RAISE NOTICE '📊 Views created: class_schedule_details, student_class_view, teacher_class_view';
    RAISE NOTICE '⚡ Indexes and triggers configured';
END $$;
