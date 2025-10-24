# 🚀 Class Schedule Quick Start

A quick reference guide for the class schedule database.

---

## ⚡ Quick Deploy

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**
5. Copy all contents from `db/class_schedule_schema.sql`
6. Paste into the editor
7. Click **Run** (or press `Ctrl + Enter`)
8. Wait for "Success" message

### Option 2: Using the Deployment Script

```bash
node scripts/deploy-class-schedule.js
```

**Note:** This requires `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file.

---

## 📋 Tables Created

| Table | Purpose |
|-------|---------|
| `academic_terms` | Semesters/terms (Fall 2025, Spring 2026) |
| `subjects` | Course catalog (CS101, MATH201, etc.) |
| `class_schedules` | Weekly class schedule entries |
| `class_enrollments` | Student enrollment records |
| `class_sessions` | Individual class meetings |
| `attendance_records` | Attendance tracking per session |
| `class_announcements` | Class-specific announcements |
| `office_hours` | Teacher availability schedules |

---

## 🎯 Common Use Cases

### 1. Create Academic Term

```sql
INSERT INTO academic_terms (name, start_date, end_date, is_current)
VALUES ('Fall 2025', '2025-09-01', '2025-12-20', true);
```

### 2. Create Subject

```sql
INSERT INTO subjects (code, name, credits, color)
VALUES ('CS101', 'Intro to Computer Science', 3, '#3498db');
```

### 3. Create Class Schedule

```sql
INSERT INTO class_schedules (
    subject_id, teacher_id, academic_term_id,
    section, day_of_week, start_time, end_time,
    room, building, max_students
)
VALUES (
    '<subject-uuid>',
    '<teacher-uuid>',
    '<term-uuid>',
    'A',
    1, -- Monday
    '09:00',
    '10:30',
    'Room 101',
    'Science Building',
    30
);
```

### 4. Enroll Student

```sql
INSERT INTO class_enrollments (class_schedule_id, student_id)
VALUES ('<schedule-uuid>', '<student-uuid>');
```

### 5. Mark Attendance

```sql
INSERT INTO attendance_records (
    class_session_id, student_id, status
)
VALUES ('<session-uuid>', '<student-uuid>', 'present');
```

---

## 📊 Useful Views

### Get Full Schedule Details

```sql
SELECT * FROM class_schedule_details
WHERE is_active = true
ORDER BY day_of_week, start_time;
```

### Get Student's Classes

```sql
SELECT * FROM student_class_view
WHERE student_id = '<your-uuid>'
ORDER BY day_of_week, start_time;
```

### Get Teacher's Classes

```sql
SELECT * FROM class_schedule_details
WHERE teacher_id = '<your-uuid>'
ORDER BY day_of_week, start_time;
```

---

## 🔑 Day of Week Reference

| Number | Day |
|--------|-----|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

---

## 🎨 Subject Color Codes

Suggested colors for subjects:

```javascript
const subjectColors = {
  CS: '#3498db',      // Blue - Computer Science
  MATH: '#e74c3c',    // Red - Mathematics
  ENG: '#2ecc71',     // Green - English
  PHY: '#9b59b6',     // Purple - Physics
  CHEM: '#f39c12',    // Orange - Chemistry
  BIO: '#1abc9c',     // Teal - Biology
  HIST: '#95a5a6',    // Gray - History
  ART: '#e91e63',     // Pink - Arts
}
```

---

## 🔒 Access Control

| Role | Permissions |
|------|-------------|
| **Student** | View enrolled classes, view attendance, enroll |
| **Teacher** | Manage own classes, mark attendance, create sessions |
| **Admin/Agent** | Full access to all class data |

---

## 📱 JavaScript Integration

### Fetch Student Schedule

```javascript
const { data } = await supabase
  .from('student_class_view')
  .select('*')
  .eq('student_id', userId)
```

### Fetch Teacher Schedule

```javascript
const { data } = await supabase
  .from('class_schedule_details')
  .select('*')
  .eq('teacher_id', userId)
```

### Create Class

```javascript
const { data, error } = await supabase
  .from('class_schedules')
  .insert({
    subject_id: subjectId,
    teacher_id: teacherId,
    academic_term_id: termId,
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '10:30:00',
    room: 'Room 101',
    max_students: 30
  })
```

### Enroll Student

```javascript
const { error } = await supabase
  .from('class_enrollments')
  .insert({
    class_schedule_id: scheduleId,
    student_id: studentId
  })
```

---

## 🧪 Test Queries

### Check if tables exist

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%class%' OR table_name LIKE '%academic%';
```

### Count records

```sql
SELECT 
  'academic_terms' as table, COUNT(*) as count FROM academic_terms
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'class_schedules', COUNT(*) FROM class_schedules
UNION ALL
SELECT 'class_enrollments', COUNT(*) FROM class_enrollments;
```

---

## 🐛 Troubleshooting

### "Permission denied" error
→ Check user role in `profiles` table  
→ Verify RLS policies are enabled

### Can't see data
→ Ensure `is_active = true` on schedules  
→ Check enrollment status is 'enrolled'

### Foreign key errors
→ Verify UUIDs exist in parent tables  
→ Check teacher/student exist in `auth.users`

---

## 📚 Full Documentation

For complete details, see [CLASS_SCHEDULE_SETUP.md](./CLASS_SCHEDULE_SETUP.md)

---

**Schema File:** `db/class_schedule_schema.sql`  
**Created:** October 22, 2025
