# Seed Data Guide

## Overview

This project includes a comprehensive data seeding system to preload your Supabase database with initial data for development and testing purposes.

## Quick Start

Run the seed script:

```bash
npm run db:seed
```

## What Gets Seeded?

The seed script loads data from CSV files located in `db/csv/`:

1. **Departments** (`departments.csv`)
   - Support, IT, and Billing departments
   - Foundation for ticket categorization

2. **Profiles** (`profiles.csv`)
   - User profiles with roles (admin, user, agent, teacher)
   - Links users to departments
   - **Note:** Users must exist in `auth.users` before profiles can be created

3. **Settings** (`settings.csv`)
   - Application-wide configuration
   - App name, timezone, SMTP settings, etc.

4. **Tickets** (`tickets.csv`)
   - Sample support tickets
   - Different statuses and priorities

5. **Ticket Messages** (`ticket_messages.csv`)
   - Messages within tickets
   - Attachments support (as JSON arrays)

## Prerequisites

### Environment Variables

Ensure your `.env.local` file contains:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Recommended for seeding (provides admin access)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Using the `SUPABASE_SERVICE_ROLE_KEY` allows the script to:
- Bypass Row Level Security (RLS) policies
- Insert profiles directly
- Perform admin operations

Without the service role key, seeding may fail for certain operations due to RLS restrictions.

### Where to Find Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the keys:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## CSV File Format

### departments.csv
```csv
id,name,description
1,Support,General support
2,IT,Technical support
```

### profiles.csv
```csv
id,full_name,avatar_url,role,department_id,created_at,updated_at
11111111-1111-1111-1111-111111111111,Admin User,,admin,1,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z
```

### tickets.csv
```csv
id,created_at,updated_at,title,description,status,priority,created_by,assigned_to,department_id,last_message_at
8b7a1d58-7c48-4c2e-9f76-aaaaaaaaaaaa,2025-01-05T10:00:00Z,2025-01-05T10:00:00Z,Printer not working,The printer in C12 is jammed,open,normal,22222222-2222-2222-2222-222222222222,11111111-1111-1111-1111-111111111111,2,
```

### ticket_messages.csv
```csv
id,created_at,ticket_id,sender,body,attachments
f9d9c8b7-1a2b-4c3d-8e9f-bbbbbbbbbbbb,2025-01-05T10:05:00Z,8b7a1d58-7c48-4c2e-9f76-aaaaaaaaaaaa,22222222-2222-2222-2222-222222222222,Please check again,[]
```

### settings.csv
```csv
key,value
app_name,Echoverse Support
timezone,UTC
```

## Adding Custom Seed Data

1. Edit the CSV files in `db/csv/`
2. Follow the column headers exactly
3. Use ISO 8601 format for timestamps (e.g., `2025-01-05T10:00:00Z`)
4. Use empty strings for NULL values
5. For JSON fields (like `attachments`), use valid JSON array/object notation

## Seed Order

The script seeds tables in this order to respect foreign key constraints:

1. Departments (no dependencies)
2. Profiles (depends on auth.users)
3. Settings (no dependencies)
4. Tickets (depends on profiles/departments)
5. Ticket Messages (depends on tickets/profiles)

## Troubleshooting

### Error: "Missing Supabase credentials"

**Solution:** Check your `.env.local` file has the required Supabase URL and keys.

### Error: "violates foreign key constraint"

**Solution:** Ensure:
- Users exist in `auth.users` before creating profiles
- Department IDs in profiles/tickets match existing departments
- Ticket IDs in messages match existing tickets

### Profiles not seeding

**Solution:** 
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of anon key
- Or create users through Supabase Auth first, then seed profiles

### Data already exists

The seed script uses `upsert` operations with conflict resolution:
- Existing records are updated, not duplicated
- Safe to run multiple times

## Production Considerations

⚠️ **Warning:** This seed script is intended for **development and testing only**.

For production:
- Never commit `.env.local` with service role keys to version control
- Use Supabase migrations instead of seed scripts
- Create users through proper authentication flows
- Use secure methods for initial data setup

## Script API

You can also import and use individual seed functions:

```javascript
import { seedDepartments, seedProfiles } from './scripts/seed-data.js';

// Seed only departments
await seedDepartments();
```

Available functions:
- `seedAll()` - Seeds everything
- `seedDepartments()`
- `seedProfiles()`
- `seedSettings()`
- `seedTickets()`
- `seedTicketMessages()`

## Support

If you encounter issues:
1. Check Supabase dashboard for error logs
2. Verify RLS policies aren't blocking inserts
3. Ensure CSV data matches table schema
4. Review the console output for specific error messages
