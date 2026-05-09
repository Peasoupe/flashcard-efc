-- Run this in Supabase SQL Editor

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  created_at timestamptz default now()
);

create table if not exists notification_reads (
  user_id uuid references auth.users(id) on delete cascade,
  notification_id uuid references notifications(id) on delete cascade,
  primary key (user_id, notification_id)
);

alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- Helper function to check admin status
create or replace function is_admin()
returns boolean
language sql security definer
as $$
  select auth.email() = 'donovancourchesne@gmail.com'
$$;

-- All authenticated users can read notifications
create policy "Authenticated users can read notifications"
  on notifications for select
  to authenticated
  using (true);

-- Only admin can create notifications
create policy "Only admin can create notifications"
  on notifications for insert
  with check (is_admin());

-- Only admin can delete notifications
create policy "Only admin can delete notifications"
  on notifications for delete
  using (is_admin());

-- Users can read their own read receipts
create policy "Users can read own reads"
  on notification_reads for select
  using (auth.uid() = user_id);

-- Users can mark notifications as read
create policy "Users can insert own reads"
  on notification_reads for insert
  with check (auth.uid() = user_id);

-- Enable realtime for notifications table
alter publication supabase_realtime add table notifications;
