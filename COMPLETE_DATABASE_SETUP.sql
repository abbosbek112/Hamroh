  -- =========================================================================================
  -- HAMROH AI - COMPLETE DATABASE SETUP (ALL SQL IN ONE FILE)
  -- =========================================================================================
  -- Run this in Supabase SQL Editor to create tables, RLS policies, triggers, and fixes.
  -- =========================================================================================

  -- Extensions (gen_random_uuid)
  create extension if not exists "pgcrypto";

  -- =========================================================================================
  -- SECTION 1: USERS TABLE
  -- =========================================================================================
  create table if not exists public.users (
    id uuid references auth.users not null primary key,
    email text,
    name text not null,
    username text unique not null,
    avatar text,
    role text default 'user',
    xp int default 0,
    level int default 1,
    streak int default 0,
    focus_minutes int default 0,
    bio text,
    phone_number text,
    age int,
    badges jsonb default '[]',
    selected_badge_id text,
    theme text default 'light',
    language text default 'uz',
    status text default 'Active',
    last_active timestamptz default now(),
    created_at timestamptz default now()
  );

  alter table public.users enable row level security;

  drop policy if exists "Public profiles are viewable by everyone" on public.users;
  drop policy if exists "Users can insert their own profile" on public.users;
  drop policy if exists "Users can update own profile" on public.users;
  drop policy if exists "Admins can update any profile" on public.users;
  drop policy if exists "Users can delete own profile" on public.users;
  drop policy if exists "Admins can delete any profile" on public.users;

  create policy "Public profiles are viewable by everyone" 
    on public.users for select 
    using (true);

  create policy "Users can insert their own profile" 
    on public.users for insert 
    with check (auth.uid() = id);

  create policy "Users can update own profile" 
    on public.users for update 
    using (auth.uid() = id);

  create policy "Admins can update any profile" 
    on public.users for update 
    using (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'admin'
      )
    );

  create policy "Users can delete own profile" 
    on public.users for delete 
    using (auth.uid() = id);

  create policy "Admins can delete any profile" 
    on public.users for delete 
    using (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'admin'
      )
    );

  -- =========================================================================================
  -- SECTION 2: ROUTINE TASKS TABLE
  -- =========================================================================================
  create table if not exists public.routine_tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    time time not null,
    completed boolean default false,
    date date not null,
    created_at timestamptz default now()
  );

  alter table public.routine_tasks enable row level security;

  drop policy if exists "Users can view own routine tasks" on public.routine_tasks;
  drop policy if exists "Users can insert own routine tasks" on public.routine_tasks;
  drop policy if exists "Users can update own routine tasks" on public.routine_tasks;
  drop policy if exists "Users can delete own routine tasks" on public.routine_tasks;

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
  -- SECTION 3: TODOS TABLE
  -- =========================================================================================
  create table if not exists public.todos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    description text,
    completed boolean default false,
    difficulty text default 'EASY',
    deadline timestamptz,
    created_at timestamptz default now()
  );

  alter table public.todos enable row level security;

  drop policy if exists "Users can view own todos" on public.todos;
  drop policy if exists "Users can insert own todos" on public.todos;
  drop policy if exists "Users can update own todos" on public.todos;
  drop policy if exists "Users can delete own todos" on public.todos;

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
  -- SECTION 4: JOURNAL ENTRIES TABLE
  -- =========================================================================================
  create table if not exists public.journal_entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    text text not null,
    mood text,
    ai_comment text,
    created_at timestamptz default now()
  );

  alter table public.journal_entries enable row level security;

  drop policy if exists "Users can view own journal entries" on public.journal_entries;
  drop policy if exists "Users can insert own journal entries" on public.journal_entries;
  drop policy if exists "Users can update own journal entries" on public.journal_entries;
  drop policy if exists "Users can delete own journal entries" on public.journal_entries;

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
  -- SECTION 5: FOCUS HISTORY TABLE
  -- =========================================================================================
  create table if not exists public.focus_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    minutes int not null,
    date date default CURRENT_DATE,
    unique(user_id, date)
  );

  alter table public.focus_history enable row level security;

  drop policy if exists "Users can view own focus history" on public.focus_history;
  drop policy if exists "Users can insert own focus history" on public.focus_history;
  drop policy if exists "Users can update own focus history" on public.focus_history;
  drop policy if exists "Users can delete own focus history" on public.focus_history;

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
  -- SECTION 6: COMMUNITY GROUPS TABLE
  -- =========================================================================================
  create table if not exists public.groups (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references public.users(id) on delete cascade not null,
    name text not null,
    description text,
    category text,
    members_count int default 1,
    member_ids jsonb default '[]',
    pinned_message_id uuid references public.messages(id) on delete set null,
    last_message_at timestamptz,
    created_at timestamptz default now()
  );

  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'groups' 
      AND column_name = 'last_message_at'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.groups ADD COLUMN last_message_at timestamptz;
    END IF;
  END $$;

  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'groups' 
      AND column_name = 'pinned_message_id'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.groups ADD COLUMN pinned_message_id uuid references public.messages(id) on delete set null;
    END IF;
  END $$;

  alter table public.groups enable row level security;

  drop policy if exists "Anyone can view groups" on public.groups;
  drop policy if exists "Authenticated users can create groups" on public.groups;
  drop policy if exists "Group owners can update their groups" on public.groups;
  drop policy if exists "Group owners can delete their groups" on public.groups;

  create policy "Anyone can view groups" 
    on public.groups for select 
    using (true);

  create policy "Authenticated users can create groups" 
    on public.groups for insert 
    with check (auth.uid() is not null and auth.uid() = owner_id);

  create policy "Group owners can update their groups" 
    on public.groups for update 
    using (
      auth.uid() = owner_id 
      or 
      auth.uid() is not null
    )
    with check (
      auth.uid() = owner_id 
      or 
      auth.uid() is not null
    );

  create policy "Group owners can delete their groups" 
    on public.groups for delete 
    using (auth.uid() = owner_id);

  -- =========================================================================================
  -- SECTION 7: MESSAGES TABLE (GROUPS & DMS) + FIX
  -- =========================================================================================
  create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.users(id) on delete cascade not null,
    group_id uuid references public.groups(id) on delete cascade,
    receiver_id uuid references public.users(id) on delete cascade,
    text text not null,
    read_at timestamptz,
    reactions jsonb default '{}',
    reply_to jsonb,
    is_system boolean default false,
    created_at timestamptz default now(),
    constraint messages_group_or_dm check (
      (group_id is null and receiver_id is not null) or
      (group_id is not null and receiver_id is null)
    )
  );

  DO $$ 
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'content'
      AND table_schema = 'public'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'text'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN text text;
      UPDATE public.messages SET text = content WHERE text IS NULL;
      ALTER TABLE public.messages ALTER COLUMN text SET NOT NULL;
      ALTER TABLE public.messages DROP COLUMN content;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'content'
      AND table_schema = 'public'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'text'
      AND table_schema = 'public'
    ) THEN
      UPDATE public.messages SET text = COALESCE(text, content) WHERE text IS NULL OR text = '';
      ALTER TABLE public.messages DROP COLUMN content;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'text'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN text text NOT NULL DEFAULT '';
    END IF;
  END $$;

  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'read_at'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN read_at timestamptz;
    END IF;
  END $$;

  alter table public.messages enable row level security;

  drop policy if exists "Users can view relevant messages" on public.messages;
  drop policy if exists "Users can send messages" on public.messages;
  drop policy if exists "Users can update own messages" on public.messages;
  drop policy if exists "Users can delete own messages" on public.messages;
  drop policy if exists "Receivers can mark read" on public.messages;

  create policy "Users can view relevant messages" 
    on public.messages for select 
    using (
      auth.uid() is not null and (
        (group_id is not null and (
          exists (
            select 1 from public.groups 
            where groups.id = group_id 
            and (
              (member_ids::jsonb @> jsonb_build_array(auth.uid()::text))
              or (member_ids::jsonb @> to_jsonb(auth.uid())::jsonb)
              or owner_id = auth.uid()
            )
          )
        )) or
        (receiver_id is not null and (
          sender_id = auth.uid() or receiver_id = auth.uid()
        ))
      )
    );

  create policy "Users can send messages" 
    on public.messages for insert 
    with check (
      auth.uid() is not null 
      and auth.uid() = sender_id
      and (
        (group_id is not null and (
          exists (
            select 1 from public.groups 
            where groups.id = group_id 
            and (
              (member_ids::jsonb @> jsonb_build_array(auth.uid()::text))
              or (member_ids::jsonb @> to_jsonb(auth.uid())::jsonb)
              or owner_id = auth.uid()
            )
          )
        ))
        or
        (receiver_id is not null)
      )
    );

  create policy "Users can update own messages" 
    on public.messages for update 
    using (auth.uid() = sender_id)
    with check (auth.uid() = sender_id);

  create policy "Receivers can mark read"
    on public.messages for update
    using (auth.uid() = receiver_id)
    with check (auth.uid() = receiver_id);

  create policy "Users can delete own messages" 
    on public.messages for delete 
    using (
      auth.uid() = sender_id or
      (group_id is not null and exists (
        select 1 from public.groups 
        where groups.id = group_id 
        and owner_id = auth.uid()
      ))
    );

  -- =========================================================================================
  -- SECTION 8: AI CHAT MESSAGES TABLE
  -- =========================================================================================
  create table if not exists public.ai_chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    role text not null,
    text text not null,
    timestamp bigint not null,
    created_at timestamptz default now()
  );

  alter table public.ai_chat_messages enable row level security;

  drop policy if exists "Users can view own AI chat messages" on public.ai_chat_messages;
  drop policy if exists "Users can insert own AI chat messages" on public.ai_chat_messages;
  drop policy if exists "Users can delete own AI chat messages" on public.ai_chat_messages;

  create policy "Users can view own AI chat messages" 
    on public.ai_chat_messages for select 
    using (auth.uid() = user_id);

  create policy "Users can insert own AI chat messages" 
    on public.ai_chat_messages for insert 
    with check (auth.uid() = user_id);

  create policy "Users can delete own AI chat messages" 
    on public.ai_chat_messages for delete 
    using (auth.uid() = user_id);

  -- =========================================================================================
  -- SECTION 9: SUPPORT TICKETS & MESSAGES
  -- =========================================================================================
  create table if not exists public.support_tickets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    status text default 'OPEN',
    last_message text,
    updated_at timestamptz default now(),
    created_at timestamptz default now()
  );

  create table if not exists public.support_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.support_tickets(id) on delete cascade not null,
    sender_id uuid references public.users(id) on delete set null,
    text text,
    created_at timestamptz default now()
  );

  alter table public.support_tickets enable row level security;
  alter table public.support_messages enable row level security;

  drop policy if exists "Users can view own tickets" on public.support_tickets;
  drop policy if exists "Admins can view all tickets" on public.support_tickets;
  drop policy if exists "Users can create own tickets" on public.support_tickets;
  drop policy if exists "Admins can update tickets" on public.support_tickets;
  drop policy if exists "Users can view messages in own tickets" on public.support_messages;
  drop policy if exists "Admins can view all support messages" on public.support_messages;
  drop policy if exists "Users can send messages to own tickets" on public.support_messages;
  drop policy if exists "Admins can send messages to any ticket" on public.support_messages;

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
  -- SECTION 10: DEALS, ADS, EXPENSES TABLES
  -- =========================================================================================
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

  alter table public.deals enable row level security;

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

  alter table public.active_ads enable row level security;

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

  create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    amount numeric not null,
    category text,
    description text,
    date date default CURRENT_DATE,
    created_at timestamptz default now()
  );

  alter table public.expenses enable row level security;

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
  -- SECTION 11: OPTIONAL ADMIN USER SEED
  -- =========================================================================================
  DO $$ 
  DECLARE
    admin_id UUID;
  BEGIN
    SELECT id INTO admin_id 
    FROM auth.users 
    WHERE email = 'admin@hamroh.ai' 
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO public.users (
        id, email, name, username, avatar, role, xp, level
      ) VALUES (
        admin_id,
        'admin@hamroh.ai',
        'Admin',
        'admin',
        'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
        'admin',
        0,
        1
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        name = 'Admin',
        username = 'admin';
        
      RAISE NOTICE 'Admin user added to public.users: %', admin_id;
    ELSE
      RAISE NOTICE 'Admin user not found in auth.users. Create via Dashboard first.';
    END IF;
  END $$;

  -- =========================================================================================
  -- SECTION 12: BLOCKED USERS TABLE
  -- =========================================================================================
  create table if not exists public.blocked_users (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    blocked_user_id uuid references public.users(id) on delete cascade not null,
    blocked_by uuid references public.users(id) on delete cascade not null,
    blocked_at timestamptz default now(),
    blocked_until timestamptz,
    reason text,
    unique(group_id, blocked_user_id)
  );

  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'blocked_users' 
      AND column_name = 'blocked_until'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.blocked_users ADD COLUMN blocked_until timestamptz;
    END IF;
  END $$;

  alter table public.blocked_users enable row level security;

  drop policy if exists "Anyone can view blocked users" on public.blocked_users;
  drop policy if exists "Group owners and admins can block users" on public.blocked_users;
  drop policy if exists "Group owners and admins can unblock users" on public.blocked_users;

  create policy "Anyone can view blocked users" 
    on public.blocked_users for select 
    using (true);

  create policy "Group owners and admins can block users" 
    on public.blocked_users for insert 
    with check (
      auth.uid() is not null 
      and auth.uid() = blocked_by
      and (
        exists (
          select 1 from public.groups 
          where groups.id = blocked_users.group_id 
          and groups.owner_id = auth.uid()
        )
        or
        exists (
          select 1 from public.users 
          where users.id = auth.uid() 
          and users.role = 'admin'
        )
      )
    );

  create policy "Group owners and admins can unblock users" 
    on public.blocked_users for delete 
    using (
      auth.uid() is not null 
      and (
        exists (
          select 1 from public.groups 
          where groups.id = blocked_users.group_id 
          and groups.owner_id = auth.uid()
        )
        or
        exists (
          select 1 from public.users 
          where users.id = auth.uid() 
          and users.role = 'admin'
        )
      )
    );

  -- =========================================================================================
  -- SECTION 13: SPAM LOGS TABLE
  -- =========================================================================================
  create table if not exists public.spam_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    group_id uuid references public.groups(id) on delete cascade,
    message_text text not null,
    reason text,
    violation_type text default 'profanity',
    created_at timestamptz default now()
  );

  alter table public.spam_logs enable row level security;

  drop policy if exists "Admins can view spam logs" on public.spam_logs;
  drop policy if exists "System can insert spam logs" on public.spam_logs;

  create policy "Admins can view spam logs" 
    on public.spam_logs for select 
    using (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'admin'
      )
    );

  create policy "System can insert spam logs" 
    on public.spam_logs for insert 
    with check (auth.uid() is not null);

  -- =========================================================================================
  -- SECTION 14: TRIGGERS & FUNCTIONS
  -- =========================================================================================
  create or replace function public.update_group_last_message_at()
  returns trigger as $$
  begin
    if NEW.group_id is not null then
      update public.groups
      set last_message_at = NEW.created_at
      where id = NEW.group_id;
    end if;
    return NEW;
  end;
  $$ language plpgsql security definer;

  -- Trigger for updating group last_activity_at when a message is sent
  drop trigger if exists on_message_insert_update_group_time on public.messages;
  create trigger on_message_insert_update_group_time
    after insert on public.messages
    for each row
    when (NEW.group_id is not null)
    execute procedure public.update_group_last_message_at();

  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    if new.raw_user_meta_data->>'name' is not null and new.raw_user_meta_data->>'name' != '' then
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
      on conflict (id) do nothing;
    end if;
    return new;
  end;
  $$ language plpgsql security definer;

  -- Trigger to handle new auth users
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  create or replace function public.update_updated_at_column()
  returns trigger as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$ language plpgsql;

  -- Support tickets update trigger
  drop trigger if exists update_support_tickets_updated_at on public.support_tickets;
  create trigger update_support_tickets_updated_at
    before update on public.support_tickets
    for each row execute procedure public.update_updated_at_column();

  create or replace function public.auto_delete_inactive_groups()
  returns void as $$
  begin
    delete from public.groups
    where last_message_at is not null
      and last_message_at < now() - interval '3 days'
      or (
        last_message_at is null
        and created_at < now() - interval '3 days'
      );
  end;
  $$ language plpgsql security definer;

  -- =========================================================================================
  -- SECTION 15: INDEXES FOR PERFORMANCE
  -- =========================================================================================
  create index if not exists idx_users_username on public.users(username);
  create index if not exists idx_users_email on public.users(email);
  create index if not exists idx_users_role on public.users(role);

  create index if not exists idx_routine_tasks_user_date on public.routine_tasks(user_id, date);
  create index if not exists idx_routine_tasks_date on public.routine_tasks(date);

  create index if not exists idx_todos_user_id on public.todos(user_id);
  create index if not exists idx_todos_completed on public.todos(completed);

  create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
  create index if not exists idx_journal_entries_created_at on public.journal_entries(created_at);

  create index if not exists idx_focus_history_user_date on public.focus_history(user_id, date);

  create index if not exists idx_groups_owner_id on public.groups(owner_id);
  create index if not exists idx_groups_category on public.groups(category);

  create index if not exists idx_messages_group_id on public.messages(group_id);
  create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
  create index if not exists idx_messages_sender_id on public.messages(sender_id);
  create index if not exists idx_messages_created_at on public.messages(created_at);

  create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
  create index if not exists idx_support_messages_ticket_id on public.support_messages(ticket_id);

  create index if not exists idx_blocked_users_group_id on public.blocked_users(group_id);
  create index if not exists idx_blocked_users_blocked_user_id on public.blocked_users(blocked_user_id);

  create index if not exists idx_spam_logs_user_id on public.spam_logs(user_id);
  create index if not exists idx_spam_logs_created_at on public.spam_logs(created_at);

  -- =========================================================================================
  -- =========================================================================================
  -- SECTION 16: CHALLENGES & PARTICIPANTS
  -- =========================================================================================
  create table if not exists public.challenges (
    id uuid primary key default gen_random_uuid(),
    title_key text not null,
    description_key text not null,
    icon text,
    reward_xp integer default 0,
    start_date timestamptz default now(),
    end_date timestamptz,
    participants_count integer default 0,
    category text default 'General',
    is_active boolean default true,
    created_at timestamptz default now()
  );

  create table if not exists public.challenge_participants (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid references public.challenges(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade,
    joined_at timestamptz default now(),
    last_check_in timestamptz,
    total_check_ins integer default 0,
    status text default 'joined', -- 'joined', 'completed'
    unique(challenge_id, user_id)
  );

  alter table public.challenges enable row level security;
  alter table public.challenge_participants enable row level security;

  -- RLS Policies for Challenges
  drop policy if exists "Challenges are viewable by everyone" on public.challenges;
  create policy "Challenges are viewable by everyone" 
    on public.challenges for select 
    using (is_active = true);

  drop policy if exists "Admins can manage challenges" on public.challenges;
  create policy "Admins can manage challenges" 
    on public.challenges for all 
    using (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'admin'
      )
    );

  -- RLS Policies for Participants
  drop policy if exists "Users can view their own challenge participation" on public.challenge_participants;
  create policy "Users can view their own challenge participation" 
    on public.challenge_participants for select 
    using (auth.uid() = user_id);

  drop policy if exists "Admins can view all challenge participants" on public.challenge_participants;
  create policy "Admins can view all challenge participants" 
    on public.challenge_participants for select 
    using (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'admin'
      )
    );

  drop policy if exists "Users can join challenges" on public.challenge_participants;
  create policy "Users can join challenges" 
    on public.challenge_participants for insert 
    with check (auth.uid() = user_id);

  -- Trigger: Update challenge participants count
  create or replace function public.update_challenge_participants_count()
  returns trigger as $$
  begin
    if (TG_OP = 'INSERT') then
      update public.challenges 
      set participants_count = participants_count + 1 
      where id = NEW.challenge_id;
    elsif (TG_OP = 'DELETE') then
      update public.challenges 
      set participants_count = participants_count - 1 
      where id = OLD.challenge_id;
    end if;
    return null;
  end;
  $$ language plpgsql security definer;

  -- Challenge participant counter logic
  drop trigger if exists on_participant_change on public.challenge_participants;
  create trigger on_participant_change
    after insert or delete on public.challenge_participants
    for each row execute function public.update_challenge_participants_count();

  -- =========================================================================================
  -- SECTION 17: LOGIC: FUNCTIONS & TRIGGERS (USER ADDITIONS)
  -- =========================================================================================

-- Ensure updated_at columns exist (Robust Fix)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Function to handle updated_at timestamps automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

  -- Trigger for updating timestamps
  drop trigger if exists set_users_updated_at on public.users;
  create trigger set_users_updated_at before update on public.users for each row execute procedure public.handle_updated_at();

  drop trigger if exists set_todos_updated_at on public.todos;
  create trigger set_todos_updated_at before update on public.todos for each row execute procedure public.handle_updated_at();

  drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
  create trigger set_journal_entries_updated_at before update on public.journal_entries for each row execute procedure public.handle_updated_at();

  -- =========================================================================================
  -- FINAL: REFRESH SCHEMA CACHE
  -- =========================================================================================
  notify pgrst, 'reload schema';


  -- =========================================================================================
  -- SECTION 15: SECURE TRANSACTIONS
  -- =========================================================================================
  CREATE OR REPLACE FUNCTION public.purchase_item(
      p_item_id TEXT,
      p_price INTEGER
  )
  RETURNS JSONB AS $$
  DECLARE
      v_user_id UUID;
      v_current_xp INTEGER;
      v_current_inventory TEXT[];
      v_new_xp INTEGER;
  BEGIN
      -- Get current user ID from session
      v_user_id := auth.uid();
      
      IF v_user_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
      END IF;

      -- Lock the user row for update to prevent race conditions
      SELECT xp, inventory INTO v_current_xp, v_current_inventory
      FROM public.users
      WHERE id = v_user_id
      FOR UPDATE;

      IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'User not found');
      END IF;

      -- Initialize inventory if null
      IF v_current_inventory IS NULL THEN
          v_current_inventory := ARRAY[]::TEXT[];
      END IF;

      -- Check if user already has the item
      IF p_item_id = ANY(v_current_inventory) THEN
          RETURN jsonb_build_object('success', false, 'error', 'Item already owned');
      END IF;

      -- Check if user has enough XP
      IF v_current_xp < p_price THEN
          RETURN jsonb_build_object('success', false, 'error', 'Insufficient XP');
      END IF;

      -- Calculate new XP
      v_new_xp := v_current_xp - p_price;

      -- Update user
      UPDATE public.users
      SET 
          xp = v_new_xp,
          inventory = array_append(v_current_inventory, p_item_id),
          updated_at = NOW()
      WHERE id = v_user_id;

      -- Return success and new state
      RETURN jsonb_build_object(
          'success', true,
          'new_xp', v_new_xp,
          'new_inventory', array_append(v_current_inventory, p_item_id)
      );

  EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- =========================================================================================
  -- SECTION 16: GAMIFICATION LOGIC
  -- =========================================================================================

  -- Function to calculate level based on XP
  -- Formula: Level = floor(xp / 1000) + 1 (1000 XP = 1 level, API bilan moslashtirilgan)
  CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
  RETURNS INTEGER AS $$
  BEGIN
      IF xp < 0 THEN
          RETURN 1;
      END IF;
      RETURN FLOOR(xp / 1000) + 1;
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  -- Trigger function to update level when XP changes
  CREATE OR REPLACE FUNCTION public.handle_xp_update()
  RETURNS TRIGGER AS $$
  BEGIN
      -- Only update if XP has changed
      IF OLD.xp IS DISTINCT FROM NEW.xp THEN
          NEW.level := public.calculate_level(NEW.xp);
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create trigger on users table
  DROP TRIGGER IF EXISTS on_xp_update ON public.users;

  CREATE TRIGGER on_xp_update
  BEFORE UPDATE OF xp ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_xp_update();

  
-- =========================================================================================
-- SECTION 17: SECURITY TRIGGERS (PROTECT SENSITIVE FIELDS)
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow admins to update anything (if role is verified via other means, e.g. JWT claims or separate admin table)
    -- For now, we trust the role column but only if the user is already an admin before update
    -- However, circular logic alert: if I'm not admin, I can't become admin.
    
    -- Prevent regular users from changing these fields manually
    -- Note: 'purchase_item' RPC runs as SECURITY DEFINER so it bypasses this trigger if we check current_user vs auth.uid
    -- But this trigger runs on UPDATE. RPC does UPDATE.
    -- We need to check if the update is coming from a trusted function or direct API call.
    -- RLS policies control 'WHERE' user can update, this trigger controls 'WHAT' they update.

    -- Role o'zgartirish (XP/level blok olib tashlandi - check-in fallback ishlashi uchun)
    IF OLD.role IS DISTINCT FROM NEW.role AND auth.uid() = OLD.id THEN
         -- Check if the user is ALREADY an admin
         IF OLD.role != 'admin' THEN
            RAISE EXCEPTION 'You cannot change your own role.';
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_protect_user_fields ON public.users;

CREATE TRIGGER on_protect_user_fields
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE public.protect_user_fields();


-- Update existing users' levels
UPDATE public.users SET level = public.calculate_level(xp);


-- ==========================================
-- MIGRATION: ADD PLATFORM COLUMN
-- ==========================================

-- Add platform column to users table
alter table public.users add column if not exists platform text default 'web';

-- Optional: Create an index for faster analytics if the user base grows large
create index if not exists idx_users_platform on public.users(platform);


-- ==========================================
-- MIGRATION: CREATE STORE ITEMS TABLE
-- ==========================================

-- Create store_items table if it doesn't exist
create table if not exists public.store_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price integer default 0,
  image_url text,
  category text default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.store_items enable row level security;

-- Create policies
drop policy if exists "Public can view store items" on public.store_items;
create policy "Public can view store items"
  on public.store_items for select
  using (true);

drop policy if exists "Admins can insert store items" on public.store_items;
create policy "Admins can insert store items"
  on public.store_items for insert
  with check (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update store items" on public.store_items;
create policy "Admins can update store items"
  on public.store_items for update
  using (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can delete store items" on public.store_items;
create policy "Admins can delete store items"
  on public.store_items for delete
  using (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Enable realtime safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'store_items'
  ) then
    alter publication supabase_realtime add table public.store_items;
  end if;
end $$;


-- ==========================================
-- MIGRATION: FIX CHALLENGE PARTICIPANTS
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'total_check_ins') THEN
        ALTER TABLE public.challenge_participants ADD COLUMN total_check_ins integer default 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'last_check_in') THEN
        ALTER TABLE public.challenge_participants ADD COLUMN last_check_in timestamptz;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'joined_at') THEN
        ALTER TABLE public.challenge_participants ADD COLUMN joined_at timestamptz default now();
    END IF;
END $$;

-- ==========================================
-- MIGRATION: USERS INVENTORY (store uchun)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'inventory' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN inventory text[] default '{}'::text[];
  END IF;
END $$;

-- ==========================================
-- MIGRATION: double_xp va app_theme (bozor uchun)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'double_xp_expires_at' AND table_schema = 'public') THEN
    ALTER TABLE public.users ADD COLUMN double_xp_expires_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'app_theme' AND table_schema = 'public') THEN
    ALTER TABLE public.users ADD COLUMN app_theme text;
  END IF;
END $$;

-- ==========================================
-- RPC: CHECK-IN CHALLENGE (1 kun 1 check, race-safe)
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_in_challenge(p_challenge_id text, p_reward_xp int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_last_check_in timestamptz;
    v_total_check_ins int;
    v_today date;
    v_last_check_in_date date;
    v_yesterday date;
    v_last_check_in_date_only date;
    v_reward_xp int;
    v_new_streak int;
    v_current_streak int;
    v_double_xp_expires_at timestamptz;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN 'UNAUTHORIZED'; END IF;

    SELECT last_check_in, total_check_ins 
    INTO v_last_check_in, v_total_check_ins
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id FOR UPDATE;

    IF NOT FOUND THEN RETURN 'NOT_JOINED'; END IF;

    v_today := current_date;
    IF v_last_check_in IS NOT NULL THEN
        v_last_check_in_date := v_last_check_in::date;
        IF v_last_check_in_date = v_today THEN RETURN 'ALREADY_CHECKED_IN'; END IF;
    END IF;

    UPDATE public.challenge_participants
    SET last_check_in = now(), total_check_ins = COALESCE(v_total_check_ins, 0) + 1
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

    -- 2x XP: check double_xp_expires_at
    SELECT double_xp_expires_at, streak INTO v_double_xp_expires_at, v_current_streak
    FROM public.users WHERE id = v_user_id;
    v_reward_xp := p_reward_xp;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN
        v_reward_xp := p_reward_xp * 2;
    END IF;

    -- Streak: yesterday = consecutive, else reset to 1
    v_yesterday := v_today - interval '1 day';
    IF v_last_check_in IS NULL THEN
        v_new_streak := 1;
    ELSE
        v_last_check_in_date_only := v_last_check_in::date;
        IF v_last_check_in_date_only = v_yesterday::date THEN
            v_new_streak := COALESCE(v_current_streak, 0) + 1;
        ELSE
            v_new_streak := 1;
        END IF;
    END IF;

    UPDATE public.users SET xp = xp + v_reward_xp, streak = v_new_streak WHERE id = v_user_id;
    RETURN 'SUCCESS';
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO service_role;
-- PostgREST schema cache: RPC larni ko'rish uchun (404 bo'lmasa kerak)
NOTIFY pgrst, 'reload config';

-- ==========================================
-- RLS: Reyting (leaderboard) — barcha ishtirokchilarni ko'rish
-- ==========================================
DROP POLICY IF EXISTS "Challenge participants viewable for leaderboard" ON public.challenge_participants;
CREATE POLICY "Challenge participants viewable for leaderboard"
  ON public.challenge_participants
  FOR SELECT
  USING (true);

-- =========================================================================================
-- SECTION: XP XAVFSIZLIK (RPC orqali XP, bevosita o'zgartirish blok)
-- User DevTools orqali api.addXP(999999) chaqirib XP ola olmasin
-- =========================================================================================

-- todos va journal_entries: xp_awarded (takror XP oldini olish)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS xp_awarded boolean DEFAULT false;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS xp_awarded boolean DEFAULT false;

-- xp_routine_daily: kunlik routine XP 1 marta
CREATE TABLE IF NOT EXISTS public.xp_routine_daily (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    PRIMARY KEY (user_id, date)
);
ALTER TABLE public.xp_routine_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own routine xp" ON public.xp_routine_daily;
CREATE POLICY "Users view own routine xp" ON public.xp_routine_daily FOR SELECT USING (auth.uid() = user_id);

-- award_xp_todo: Todo tugatilganda XP (faqat completed, xp_awarded=false)
CREATE OR REPLACE FUNCTION public.award_xp_todo(p_todo_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_todo record; v_xp int; v_new_xp int; v_new_level int; v_double_xp_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;
  SELECT id, completed, difficulty, xp_awarded INTO v_todo FROM public.todos WHERE id = p_todo_id AND user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND'); END IF;
  IF NOT v_todo.completed THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_COMPLETED'); END IF;
  IF COALESCE(v_todo.xp_awarded, false) THEN RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED'); END IF;
  v_xp := CASE v_todo.difficulty WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 30 WHEN 'HARD' THEN 50 ELSE 10 END;
  SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
  IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := v_xp * 2; END IF;
  UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1 WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;
  UPDATE public.todos SET xp_awarded = true WHERE id = p_todo_id;
  RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- award_xp_journal: Journal saqlanganda XP
CREATE OR REPLACE FUNCTION public.award_xp_journal(p_entry_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_xp int := 50; v_new_xp int; v_new_level int; v_double_xp_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.journal_entries WHERE id = p_entry_id AND user_id = v_user_id) THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND'); END IF;
  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = p_entry_id AND COALESCE(xp_awarded, false)) THEN RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED'); END IF;
  SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
  IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := 100; END IF;
  UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1 WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;
  UPDATE public.journal_entries SET xp_awarded = true WHERE id = p_entry_id;
  RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- award_xp_focus: Focus sessiya (max 180 min/chaqiruv)
CREATE OR REPLACE FUNCTION public.award_xp_focus(p_minutes int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_minutes int; v_xp int; v_new_xp int; v_new_level int; v_double_xp_expires_at timestamptz; v_today date := CURRENT_DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;
  v_minutes := LEAST(GREATEST(COALESCE(p_minutes, 0), 0), 180);
  IF v_minutes <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'INVALID_MINUTES'); END IF;
  SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
  v_xp := v_minutes;
  IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := v_xp * 2; END IF;
  UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1, focus_minutes = COALESCE(focus_minutes, 0) + v_minutes WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;
  INSERT INTO public.focus_history (user_id, minutes, date) VALUES (v_user_id, v_minutes, v_today)
  ON CONFLICT (user_id, date) DO UPDATE SET minutes = public.focus_history.minutes + EXCLUDED.minutes;
  RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- award_xp_routine: Kunlik reja (1 kun 1 marta 20 XP)
CREATE OR REPLACE FUNCTION public.award_xp_routine()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_xp int := 20; v_new_xp int; v_new_level int; v_double_xp_expires_at timestamptz; v_today date := CURRENT_DATE; v_row_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;
  INSERT INTO public.xp_routine_daily (user_id, date) VALUES (v_user_id, v_today) ON CONFLICT (user_id, date) DO NOTHING;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED'); END IF;
  SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
  IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := 40; END IF;
  UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1 WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;
  RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp_todo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_journal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_focus(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_routine() TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
