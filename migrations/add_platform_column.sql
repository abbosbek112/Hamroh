-- Add platform column to users table
alter table public.users add column if not exists platform text default 'web';

-- Optional: Create an index for faster analytics if the user base grows large
create index if not exists idx_users_platform on public.users(platform);
