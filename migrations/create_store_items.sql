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
create policy "Public can view store items"
  on public.store_items for select
  using (true);

create policy "Admins can insert store items"
  on public.store_items for insert
  with check (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Admins can update store items"
  on public.store_items for update
  using (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Admins can delete store items"
  on public.store_items for delete
  using (auth.email() = 'admin@hamroh.ai' or exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Enable realtime
alter publication supabase_realtime add table public.store_items;
