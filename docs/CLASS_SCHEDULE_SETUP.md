# 📚 Class Schedule Database Setup Guide

## Overview

This guide will help you set up the class schedule database in Supabase for your ticket support system. The schema includes comprehensive features for managing academic schedules, enrollments, attendance, and more.

---

## 🎯 Features Included

### Core Tables
- **Academic Terms** - Manage semesters/terms (Fall 2025, Spring 2026, etc.)
- **Subjects** - Course catalog with codes, credits, and departments
- **Class Schedules** - Weekly class schedules with time, location, and capacity
- **Class Enrollments** - Student enrollment tracking with grades
- **Class Sessions** - Individual class meetings with topics and materials
- **Attendance Records** - Student attendance tracking per session
- **Class Announcements** - Important notifications for classes
- **Office Hours** - Teacher availability schedules

### Key Features
✅ **Row Level Security (RLS)** - Secure access control for all tables  
✅ **Automatic Timestamps** - Created and updated timestamps  
✅ **Enrollment Counting** - Automatic enrollment count updates  
✅ **Conflict Prevention** - Constraints to prevent scheduling conflicts  
✅ **Performance Indexes** - Optimized queries for common operations  
✅ **Helpful Views** - Pre-built views for common data needs  
✅ **Helper Functions** - Reusable functions for permissions checking  

---

## 🚀 Installation Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New query**

### Step 2: Run the Schema

1. Open the file: `db/class_schedule_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** or press `Ctrl + Enter`

### Step 3: Verify Installation

Run this query to check if tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'academic_terms',
    'subjects',
    'class_schedules',
    'class_enrollments',
    'class_sessions',
    'attendance_records',
    'class_announcements',
    'office_hours'
)
ORDER BY table_name;
```

You should see all 8 tables listed.

---

## 📊 Database Schema Overview

### Entity Relationship Diagram (Conceptual)

```
academic_terms
    ↓
class_schedules ←→ subjects ←→ departments (existing)
    ↓              ↓
    ↓          teacher (profiles/auth.users)
    ↓
class_enrollments ←→ students (auth.users)
    ↓
class_sessions
    ↓
attendance_records
```

### Table Details

#### 1. **academic_terms**
Manages academic terms/semesters.

**Key Fields:**
- `name` - "Fall 2025", "Spring 2026"
- `start_date`, `end_date` - Term duration
- `is_current` - Flag for active term

#### 2. **subjects**
Course catalog.

**Key Fields:**
- `code` - Course code (e.g., "CS101")
- `name` - Course name
- `department_id` - Links to existing departments
- `credits` - Credit hours
- `color` - UI display color

#### 3. **class_schedules**
Weekly class schedule entries.

**Key Fields:**
- `subject_id` - What is being taught
- `teacher_id` - Who is teaching
- `academic_term_id` - When it's offered
- `day_of_week` - 0=Sunday, 6=Saturday
- `start_time`, `end_time` - Class time
- `room`, `building` - Location
- `max_students`, `enrolled_count` - Capacity tracking
- `class_type` - lecture, lab, tutorial, online
- `meeting_link` - For online classes

#### 4. **class_enrollments**
Student enrollment records.

**Key Fields:**
- `class_schedule_id` - Which class
- `student_id` - Which student
- `enrollment_status` - enrolled, dropped, completed, waitlisted
- `grade` - Final grade
- `attendance_percentage` - Calculated attendance

#### 5. **class_sessions**
Individual class meeting records.

**Key Fields:**
- `class_schedule_id` - Parent schedule
- `session_date` - Specific date
- `status` - scheduled, completed, cancelled
- `topic` - What was covered
- `homework_assigned` - Assignments given
- `materials_link` - Course materials

#### 6. **attendance_records**
Attendance tracking.

**Key Fields:**
- `class_session_id` - Which session
- `student_id` - Which student
- `status` - present, absent, late, excused
- `check_in_time` - When they arrived

#### 7. **class_announcements**
Class-specific announcements.

**Key Fields:**
- `class_schedule_id` - Which class
- `title`, `content` - Announcement details
- `is_urgent` - Priority flag
- `expires_at` - Auto-hide date

#### 8. **office_hours**
Teacher availability.

**Key Fields:**
- `teacher_id` - Which teacher
- `day_of_week`, `start_time`, `end_time` - Schedule
- `location`, `meeting_link` - Where to meet

---

## 🔒 Security (Row Level Security)

### Access Control Rules

#### Students Can:
- ✅ View their own enrollments and grades
- ✅ View classes they're enrolled in
- ✅ View their attendance records
- ✅ Enroll in classes
- ✅ View class announcements for their classes
- ✅ View office hours

#### Teachers Can:
- ✅ View and manage their own classes
- ✅ View enrollment lists for their classes
- ✅ Mark attendance for their classes
- ✅ Create class sessions and announcements
- ✅ Manage their office hours
- ✅ View student information for enrolled students

#### Admins/Agents Can:
- ✅ Full access to all class-related data
- ✅ Create and modify academic terms
- ✅ Manage all subjects and schedules
- ✅ Override any restrictions

---

## 📝 Usage Examples

### Creating an Academic Term

```sql
INSERT INTO academic_terms (name, start_date, end_date, is_current, description)
VALUES (
    'Fall 2025',
    '2025-09-01',
    '2025-12-20',
    true,
    'Fall semester 2025'
);
```

### Creating a Subject

```sql
INSERT INTO subjects (code, name, description, department_id, credits, color)
VALUES (
    'CS101',
    'Introduction to Computer Science',
    'Fundamentals of programming and computer science',
    1, -- Replace with actual department ID
    3,
    '#3498db'
);
```

### Creating a Class Schedule

```sql
INSERT INTO class_schedules (
    subject_id,
    teacher_id,
    academic_term_id,
    section,
    day_of_week,
    start_time,
    end_time,
    room,
    building,
    max_students,
    class_type
)
VALUES (
    'subject-uuid-here',
    'teacher-uuid-here',
    'term-uuid-here',
    'A',
    1, -- Monday
    '09:00:00',
    '10:30:00',
    'Room 101',
    'Science Building',
    30,
    'lecture'
);
```

### Enrolling a Student

```sql
INSERT INTO class_enrollments (class_schedule_id, student_id, enrollment_status)
VALUES (
    'schedule-uuid-here',
    'student-uuid-here',
    'enrolled'
);
```

### Creating a Class Session

```sql
INSERT INTO class_sessions (
    class_schedule_id,
    session_date,
    status,
    topic,
    homework_assigned
)
VALUES (
    'schedule-uuid-here',
    '2025-09-08', -- First Monday
    'scheduled',
    'Introduction to Programming Concepts',
    'Read Chapter 1, complete exercises 1-5'
);
```

### Marking Attendance

```sql
INSERT INTO attendance_records (
    class_session_id,
    student_id,
    status,
    check_in_time,
    marked_by
)
VALUES (
    'session-uuid-here',
    'student-uuid-here',
    'present',
    NOW(),
    'teacher-uuid-here'
);
```

---

## 📊 Useful Queries

### Get Teacher's Schedule for a Day

```sql
SELECT * FROM class_schedule_details
WHERE teacher_id = 'teacher-uuid-here'
  AND day_of_week = 1 -- Monday
  AND is_active = true
ORDER BY start_time;
```

### Get Student's Weekly Schedule

```sql
SELECT * FROM student_class_view
WHERE student_id = 'student-uuid-here'
  AND enrollment_status = 'enrolled'
ORDER BY day_of_week, start_time;
```

### Get Attendance Report for a Class

```sql
SELECT 
    s.full_name as student_name,
    COUNT(*) FILTER (WHERE ar.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE ar.status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE ar.status = 'late') as late_count,
    ROUND(
        COUNT(*) FILTER (WHERE ar.status = 'present')::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 
        2
    ) as attendance_percentage
FROM class_enrollments ce
JOIN profiles s ON ce.student_id = s.id
LEFT JOIN attendance_records ar ON ar.student_id = ce.student_id
LEFT JOIN class_sessions cs ON ar.class_session_id = cs.id 
    AND cs.class_schedule_id = ce.class_schedule_id
WHERE ce.class_schedule_id = 'schedule-uuid-here'
  AND ce.enrollment_status = 'enrolled'
GROUP BY s.id, s.full_name
ORDER BY s.full_name;
```

### Check for Schedule Conflicts

```sql
SELECT cs1.*, cs2.id as conflicting_schedule_id
FROM class_schedules cs1
JOIN class_schedules cs2 ON 
    cs1.teacher_id = cs2.teacher_id
    AND cs1.day_of_week = cs2.day_of_week
    AND cs1.id != cs2.id
    AND cs1.academic_term_id = cs2.academic_term_id
WHERE (
    (cs1.start_time, cs1.end_time) OVERLAPS (cs2.start_time, cs2.end_time)
)
AND cs1.is_active = true
AND cs2.is_active = true;
```

---

## 🔧 Integration with Existing System

### Using Existing Tables

The schema integrates with your existing tables:

1. **`auth.users`** - Used for teacher_id and student_id references
2. **`profiles`** - Links to user profiles for names and roles
3. **`departments`** - Subjects can be assigned to departments

### Role Integration

The schema respects your existing roles:
- `admin` - Full access to all class management
- `agent` - Full access to all class management
- `teacher` - Can manage their own classes
- `user` - Can enroll and view their own schedules

You may want to add a `student` role if needed:

```sql
-- Update the profiles role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user','student','teacher','agent','admin'));
```

---

## 🎨 Frontend Integration Tips

### Fetching Student's Schedule

```javascript
import { supabase } from './supabaseClient'

async function getStudentSchedule(studentId) {
  const { data, error } = await supabase
    .from('student_class_view')
    .select('*')
    .eq('student_id', studentId)
    .eq('enrollment_status', 'enrolled')
    .order('day_of_week')
    .order('start_time')
  
  if (error) {
    console.error('Error fetching schedule:', error)
    return null
  }
  
  return data
}
```

### Fetching Teacher's Classes

```javascript
async function getTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from('class_schedule_details')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')
  
  if (error) {
    console.error('Error fetching classes:', error)
    return null
  }
  
  return data
}
```

### Real-time Subscriptions

Enable real-time updates for class schedules:

```javascript
// Subscribe to class schedule changes
const scheduleSubscription = supabase
  .channel('class-schedules')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'class_schedules'
    },
    (payload) => {
      console.log('Schedule updated:', payload)
      // Refresh your UI
    }
  )
  .subscribe()
```

---

## 🧪 Testing the Setup

### 1. Test Basic Operations

```sql
-- Create a test term
INSERT INTO academic_terms (name, start_date, end_date, is_current)
VALUES ('Test Term', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', true)
RETURNING *;

-- Create a test subject
INSERT INTO subjects (code, name, credits)
VALUES ('TEST101', 'Test Subject', 3)
RETURNING *;
```

### 2. Test RLS Policies

Login as different users and verify:
- Students can only see their own enrollments
- Teachers can manage their own classes
- Admins have full access

### 3. Test Constraints

Try to insert invalid data and verify constraints work:
```sql
-- Should fail: end_time before start_time
INSERT INTO class_schedules (
    subject_id, teacher_id, academic_term_id,
    day_of_week, start_time, end_time
)
VALUES (
    'subject-id', 'teacher-id', 'term-id',
    1, '10:00:00', '09:00:00'
);
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "relation already exists"
**Solution:** Tables might already exist. Drop them first:
```sql
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS class_announcements CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS office_hours CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS academic_terms CASCADE;
```

#### Issue: "foreign key constraint violated"
**Solution:** Ensure referenced tables exist (departments, auth.users, profiles)

#### Issue: RLS blocking queries
**Solution:** Check your user's role in the profiles table:
```sql
SELECT role FROM profiles WHERE id = auth.uid();
```

---

## 📈 Next Steps

1. **Create a Schedule UI** - Build React components to display schedules
2. **Add Calendar View** - Integrate with calendar libraries (FullCalendar, React Big Calendar)
3. **Email Notifications** - Send reminders for upcoming classes
4. **Mobile App** - Create mobile views for students/teachers
5. **Analytics Dashboard** - Track attendance, enrollment trends
6. **Export Features** - Allow exporting schedules to PDF/iCal

---

## 🤝 Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all tables were created successfully
3. Ensure RLS policies are enabled
4. Check user roles in the profiles table

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Created:** October 22, 2025  
**Version:** 1.0  
**Schema File:** `db/class_schedule_schema.sql`
