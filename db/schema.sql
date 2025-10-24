-- Echoverse Support initial schema for Supabase
-- Settings table for key/value configuration
create table if not exists public.settings (
  key text primary key,
  value text
);
-- Run via: npm run db:setup (requires SUPABASE_DB_URL in .env.db.local)

begin;

-- Extensions
create extension if not exists "pgcrypto" with schema public;

-- Helper: update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Departments
create table if not exists public.departments (
  id serial primary key,
  name text unique not null,
  description text
);

-- Profiles referencing auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','teacher','agent','admin')),
  department_id integer references public.departments(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile after user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to check staff role
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce((select role in ('admin','agent') from public.profiles where id = uid), false);
$$;

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_by uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  department_id integer references public.departments(id),
  last_message_at timestamptz
);
create index if not exists tickets_created_by_idx on public.tickets(created_by);
create index if not exists tickets_assigned_to_idx on public.tickets(assigned_to);
create index if not exists tickets_department_idx on public.tickets(department_id);
create trigger tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Ticket messages
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade,
  body text not null,
  attachments jsonb not null default '[]'::jsonb
);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages(ticket_id, created_at);

-- Policies for settings
alter table public.settings enable row level security;
create policy if not exists "Only admin can read/write settings"
  on public.settings
  for all
  to authenticated
  using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Row Level Security
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Departments policies
create policy if not exists "Departments are readable by authenticated"
  on public.departments
  for select
  to authenticated
  using (true);
create policy if not exists "Only staff manages departments"
  on public.departments
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Profiles policies
create policy if not exists "Read own profile or staff"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_staff(auth.uid()));

create policy if not exists "Insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy if not exists "Update own profile or staff"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_staff(auth.uid()))
  with check (auth.uid() = id or public.is_staff(auth.uid()));

create policy if not exists "Only staff can delete profiles"
  on public.profiles
  for delete
  to authenticated
  using (public.is_staff(auth.uid()));

-- Tickets policies
create policy if not exists "Read tickets where participant or staff"
  on public.tickets
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.is_staff(auth.uid())
  );

create policy if not exists "Users can create their own tickets"
  on public.tickets
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy if not exists "Update if participant or staff"
  on public.tickets
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.is_staff(auth.uid())
  )
  with check (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.is_staff(auth.uid())
  );

create policy if not exists "Only staff can delete tickets"
  on public.tickets
  for delete
  to authenticated
  using (public.is_staff(auth.uid()));

-- Ticket messages policies
create policy if not exists "Read messages for allowed tickets"
  on public.ticket_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_staff(auth.uid())
        )
    )
  );

create policy if not exists "Send messages if part of ticket"
  on public.ticket_messages
  for insert
  to authenticated
  with check (
    sender = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.created_by = auth.uid() or t.assigned_to = auth.uid() or public.is_staff(auth.uid())
        )
    )
  );

-- Seed default departments
insert into public.departments (name, description) values
  ('Support', 'General support'),
  ('IT', 'Technical support'),
  ('Billing', 'Payments and invoices')
  on conflict (name) do nothing;

commit;
