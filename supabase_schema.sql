-- Run this in Supabase SQL Editor

create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  repetitions integer default 0,
  ease_factor numeric default 2.5,
  interval integer default 1,
  next_review_date date,
  last_review_date date,
  created_at timestamptz default now()
);

-- Row Level Security: each user can only see their own data
alter table decks enable row level security;
alter table cards enable row level security;

create policy "Users can manage their own decks"
  on decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage cards in their decks"
  on cards for all
  using (
    exists (
      select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid()
    )
  );
