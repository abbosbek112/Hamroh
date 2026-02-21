-- =========================================================================================
-- 🚀 HAMROH AI - SUPABASE DATABASE SCHEMA
-- =========================================================================================
-- This file contains the complete database schema for Hamroh AI application.
-- Run this in your Supabase SQL Editor to set up all tables, RLS policies, and triggers.
-- =========================================================================================

-- =========================================================================================
-- 1. USERS TABLE (Public profile linked to Auth)
-- =========================================================================================
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text not null,
  username text unique not null,
  avatar text,
  role text default 'user', -- 'user' | 'admin'
  xp int default 0,
  level int default 1,
  streak int default 0,
  focus_minutes int default 0,
  bio text,
  phone_number text,
  age int,
  badges jsonb default '[]', -- Array of strings ['badge_id_1', 'badge_id_2']
  selected_badge_id text,
  theme text default 'light',
  language text default 'uz',
  status text default 'Active', -- 'Active' | 'Banned'
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) for users
alter table public.users enable row level security;

-- Drop existing policies if they exist (for re-running schema)
drop policy if exists "Public profiles are viewable by everyone" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Admins can update any profile" on public.users;
drop policy if exists "Users can delete own profile" on public.users;
drop policy if exists "Admins can delete any profile" on public.users;

-- RLS Policies for users table
create policy "Public profiles are viewable by everyone" 
  on public.users for select 
  using (true);

create policy "Users can insert their own profile" 
  on public.users for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.users for update 
  using (auth.uid() = id);

-- Admin can update any profile
create policy "Admins can update any profile" 
  on public.users for update 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can delete their own profile (for cleanup during registration)
create policy "Users can delete own profile" 
  on public.users for delete 
  using (auth.uid() = id);

-- Admins can delete any profile
create policy "Admins can delete any profile" 
  on public.users for delete 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- =========================================================================================
-- 2. ROUTINE TASKS TABLE (Intizom)
-- =========================================================================================
create table if not exists public.routine_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  time time not null, -- HH:MM
  completed boolean default false,
  date date not null, -- YYYY-MM-DD
  created_at timestamptz default now()
);

-- Enable RLS for routine_tasks
alter table public.routine_tasks enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own routine tasks" on public.routine_tasks;
drop policy if exists "Users can insert own routine tasks" on public.routine_tasks;
drop policy if exists "Users can update own routine tasks" on public.routine_tasks;
drop policy if exists "Users can delete own routine tasks" on public.routine_tasks;

-- RLS Policies for routine_tasks
create policy "Users can view own routine tasks" 
  on public.routine_tasks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own routine tasks" 
  on public.routine_tasks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own routine tasks" 
  on public.routine_tasks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own routine tasks" 
  on public.routine_tasks for delete 
  using (auth.uid() = user_id);

-- =========================================================================================
-- 3. TODOS TABLE (Intizom)
-- =========================================================================================
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  difficulty text default 'EASY', -- 'EASY', 'MEDIUM', 'HARD'
  deadline timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS for todos
alter table public.todos enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own todos" on public.todos;
drop policy if exists "Users can insert own todos" on public.todos;
drop policy if exists "Users can update own todos" on public.todos;
drop policy if exists "Users can delete own todos" on public.todos;

-- RLS Policies for todos
create policy "Users can view own todos" 
  on public.todos for select 
  using (auth.uid() = user_id);

create policy "Users can insert own todos" 
  on public.todos for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own todos" 
  on public.todos for update 
  using (auth.uid() = user_id);

create policy "Users can delete own todos" 
  on public.todos for delete 
  using (auth.uid() = user_id);

-- =========================================================================================
-- 4. JOURNAL ENTRIES TABLE (Intizom)
-- =========================================================================================
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  mood text,
  ai_comment text,
  created_at timestamptz default now()
);

-- Enable RLS for journal_entries
alter table public.journal_entries enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own journal entries" on public.journal_entries;
drop policy if exists "Users can insert own journal entries" on public.journal_entries;
drop policy if exists "Users can update own journal entries" on public.journal_entries;
drop policy if exists "Users can delete own journal entries" on public.journal_entries;

-- RLS Policies for journal_entries
create policy "Users can view own journal entries" 
  on public.journal_entries for select 
  using (auth.uid() = user_id);

create policy "Users can insert own journal entries" 
  on public.journal_entries for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own journal entries" 
  on public.journal_entries for update 
  using (auth.uid() = user_id);

create policy "Users can delete own journal entries" 
  on public.journal_entries for delete 
  using (auth.uid() = user_id);

-- =========================================================================================
-- 5. FOCUS HISTORY TABLE (Intizom)
-- =========================================================================================
create table if not exists public.focus_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  minutes int not null,
  date date default CURRENT_DATE,
  unique(user_id, date) -- One entry per user per day
);

-- Enable RLS for focus_history
alter table public.focus_history enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own focus history" on public.focus_history;
drop policy if exists "Users can insert own focus history" on public.focus_history;
drop policy if exists "Users can update own focus history" on public.focus_history;
drop policy if exists "Users can delete own focus history" on public.focus_history;

-- RLS Policies for focus_history
create policy "Users can view own focus history" 
  on public.focus_history for select 
  using (auth.uid() = user_id);

create policy "Users can insert own focus history" 
  on public.focus_history for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own focus history" 
  on public.focus_history for update 
  using (auth.uid() = user_id);

create policy "Users can delete own focus history" 
  on public.focus_history for delete 
  using (auth.uid() = user_id);

-- =========================================================================================
-- 6. COMMUNITY GROUPS TABLE
-- =========================================================================================
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  members_count int default 1,
  member_ids jsonb default '[]', -- List of user IDs for quick lookup (denormalized)
  pinned_message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz default now()
);

-- Ensure pinned_message_id exists (safe for re-run)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'groups'
      and column_name = 'pinned_message_id'
      and table_schema = 'public'
  ) then
    alter table public.groups add column pinned_message_id uuid references public.messages(id) on delete set null;
  end if;
end $$;

-- Enable RLS for groups
alter table public.groups enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can view groups" on public.groups;
drop policy if exists "Authenticated users can create groups" on public.groups;
drop policy if exists "Group owners can update their groups" on public.groups;
drop policy if exists "Group owners can delete their groups" on public.groups;

-- RLS Policies for groups
create policy "Anyone can view groups" 
  on public.groups for select 
  using (true);

create policy "Authenticated users can create groups" 
  on public.groups for insert 
  with check (auth.uid() is not null and auth.uid() = owner_id);

create policy "Group owners can update their groups" 
  on public.groups for update 
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Group owners can delete their groups" 
  on public.groups for delete 
  using (auth.uid() = owner_id);

-- =========================================================================================
-- 7. MESSAGES TABLE (Groups & DMs)
-- =========================================================================================
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade, -- Null if DM
  receiver_id uuid references public.users(id) on delete cascade, -- Null if Group
  text text not null,
  read_at timestamptz,
  reactions jsonb default '{}', -- { "👍": 5 }
  reply_to jsonb, -- { id, text, sender }
  is_system boolean default false,
  created_at timestamptz default now(),
  -- Ensure either group_id or receiver_id is set, but not both
  constraint messages_group_or_dm check (
    (group_id is null and receiver_id is not null) or
    (group_id is not null and receiver_id is null)
  )
);

-- Ensure read_at exists (safe for re-run)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'messages'
      and column_name = 'read_at'
      and table_schema = 'public'
  ) then
    alter table public.messages add column read_at timestamptz;
  end if;
end $$;

-- Enable RLS for messages
alter table public.messages enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view relevant messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can update own messages" on public.messages;
drop policy if exists "Users can delete own messages" on public.messages;
drop policy if exists "Receivers can mark read" on public.messages;

-- RLS Policies for messages
-- Users can view messages in groups they're members of or DMs they're part of
create policy "Users can view relevant messages" 
  on public.messages for select 
  using (
    auth.uid() is not null and (
      -- Group messages: user must be in member_ids JSONB array or be owner
      (group_id is not null and (
        exists (
          select 1 from public.groups 
          where groups.id = group_id 
          and (
            -- Check if user ID (as text) is in member_ids JSONB array
            -- Supabase JS client UUID'larni text formatida saqlaydi
            (member_ids::jsonb @> jsonb_build_array(auth.uid()::text))
            or owner_id = auth.uid()
          )
        )
      )) or
      -- Direct messages: user must be sender or receiver
      (receiver_id is not null and (
        sender_id = auth.uid() or receiver_id = auth.uid()
      ))
    )
  );

create policy "Users can send messages" 
  on public.messages for insert 
  with check (auth.uid() is not null and auth.uid() = sender_id);

create policy "Users can update own messages" 
  on public.messages for update 
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- Allow DM receivers to mark messages as read
create policy "Receivers can mark read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "Users can delete own messages" 
  on public.messages for delete 
  using (
    auth.uid() = sender_id or
    -- Group owner can delete messages in their group
    (group_id is not null and exists (
      select 1 from public.groups 
      where groups.id = group_id 
      and owner_id = auth.uid()
    ))
  );

-- =========================================================================================
-- 8. ADMIN / MARKETING TABLES
-- =========================================================================================

-- DEALS TABLE
create table if not exists public.deals (
  id uuid default gen_random_uuid() primary key,
  client_name text not null,
  campaign_title text,
  amount numeric,
  start_date date,
  end_date date,
  status text default 'Active',
  type text,
  logo_color text,
  created_at timestamptz default now()
);

-- Enable RLS for deals (Admin only)
alter table public.deals enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can view deals" on public.deals;
drop policy if exists "Admins can manage deals" on public.deals;

create policy "Anyone can view deals" 
  on public.deals for select 
  using (true);

create policy "Admins can manage deals" 
  on public.deals for all 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ACTIVE ADS TABLE
create table if not exists public.active_ads (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references public.deals(id) on delete set null,
  title text,
  description text,
  image text,
  link text,
  views int default 0,
  clicks int default 0,
  status text default 'Running',
  target_audience text default 'All',
  created_at timestamptz default now()
);

-- Enable RLS for active_ads
alter table public.active_ads enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Anyone can view active ads" on public.active_ads;
drop policy if exists "Admins can manage active ads" on public.active_ads;

create policy "Anyone can view active ads" 
  on public.active_ads for select 
  using (true);

create policy "Admins can manage active ads" 
  on public.active_ads for all 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- EXPENSES TABLE
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text,
  description text,
  date date default CURRENT_DATE,
  created_at timestamptz default now()
);

-- Enable RLS for expenses (Admin only)
alter table public.expenses enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Admins can manage expenses" on public.expenses;

create policy "Admins can manage expenses" 
  on public.expenses for all 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- =========================================================================================
-- 9. SUPPORT TICKETS & MESSAGES
-- =========================================================================================

-- SUPPORT TICKETS TABLE
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  status text default 'OPEN',
  last_message text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS for support_tickets
alter table public.support_tickets enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own tickets" on public.support_tickets;
drop policy if exists "Admins can view all tickets" on public.support_tickets;
drop policy if exists "Users can create own tickets" on public.support_tickets;
drop policy if exists "Admins can update tickets" on public.support_tickets;

create policy "Users can view own tickets" 
  on public.support_tickets for select 
  using (auth.uid() = user_id);

create policy "Admins can view all tickets" 
  on public.support_tickets for select 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can create own tickets" 
  on public.support_tickets for insert 
  with check (auth.uid() = user_id);

create policy "Admins can update tickets" 
  on public.support_tickets for update 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- SUPPORT MESSAGES TABLE
create table if not exists public.support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete set null, -- admin or user
  text text,
  created_at timestamptz default now()
);

-- Enable RLS for support_messages
alter table public.support_messages enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view messages in own tickets" on public.support_messages;
drop policy if exists "Admins can view all support messages" on public.support_messages;
drop policy if exists "Users can send messages to own tickets" on public.support_messages;
drop policy if exists "Admins can send messages to any ticket" on public.support_messages;

create policy "Users can view messages in own tickets" 
  on public.support_messages for select 
  using (
    exists (
      select 1 from public.support_tickets 
      where id = support_messages.ticket_id 
      and user_id = auth.uid()
    )
  );

create policy "Admins can view all support messages" 
  on public.support_messages for select 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can send messages to own tickets" 
  on public.support_messages for insert 
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.support_tickets 
      where id = support_messages.ticket_id 
      and user_id = auth.uid()
    )
  );

create policy "Admins can send messages to any ticket" 
  on public.support_messages for insert 
  with check (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- =========================================================================================
-- 10. TRIGGERS & FUNCTIONS
-- =========================================================================================

-- Function to automatically create user profile when auth user is created
-- IMPORTANT: This trigger only creates profile for properly registered users
-- For OTP registration, profile will be created manually in api.register after code verification
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if this is an OTP user (created via signInWithOtp)
  -- OTP users should NOT have profile created automatically - api.register will handle it
  -- Only create profile if user has proper metadata (name, etc.) indicating proper registration
  if new.raw_user_meta_data->>'name' is not null and new.raw_user_meta_data->>'name' != '' then
    -- This is a properly registered user (not OTP), create profile
    insert into public.users (id, email, name, username, avatar)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', 'User'),
      coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
      coalesce(
        new.raw_user_meta_data->>'avatar',
        'https://ui-avatars.com/api/?name=' || encode(convert_to(coalesce(new.raw_user_meta_data->>'name', 'User'), 'UTF8'), 'base64') || '&background=random&color=fff'
      )
    )
    on conflict (id) do nothing; -- If profile already exists, don't error
  end if;
  -- If no name in metadata, this is likely an OTP user - don't create profile
  -- api.register will create it properly after code verification
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp for support_tickets
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at for support_tickets
drop trigger if exists update_support_tickets_updated_at on public.support_tickets;
create trigger update_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute procedure public.update_updated_at_column();

-- Function to update user's last_active timestamp
create or replace function public.update_user_last_active()
returns trigger as $$
begin
  update public.users
  set last_active = now()
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- =========================================================================================
-- 11. INDEXES FOR PERFORMANCE
-- =========================================================================================

-- Indexes for users table
create index if not exists idx_users_username on public.users(username);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);

-- Indexes for routine_tasks
create index if not exists idx_routine_tasks_user_date on public.routine_tasks(user_id, date);
create index if not exists idx_routine_tasks_date on public.routine_tasks(date);

-- Indexes for todos
create index if not exists idx_todos_user_id on public.todos(user_id);
create index if not exists idx_todos_completed on public.todos(completed);

-- Indexes for journal_entries
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_journal_entries_created_at on public.journal_entries(created_at);

-- Indexes for focus_history
create index if not exists idx_focus_history_user_date on public.focus_history(user_id, date);

-- Indexes for groups
create index if not exists idx_groups_owner_id on public.groups(owner_id);
create index if not exists idx_groups_category on public.groups(category);

-- Indexes for messages
create index if not exists idx_messages_group_id on public.messages(group_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Indexes for support
create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_messages_ticket_id on public.support_messages(ticket_id);

-- =========================================================================================
-- END OF SCHEMA
-- =========================================================================================
-- 
-- NEXT STEPS:
-- 1. Enable Real-time Replication in Supabase Dashboard:
--    - Go to Database -> Replication
--    - Enable replication for: messages, users tables
--
-- 2. Create Storage Buckets:
--    - Go to Storage
--    - Create bucket named 'avatars' (public)
--    - Create bucket named 'marketing' (public)
--
-- 3. Verify RLS policies are working correctly
-- =========================================================================================
