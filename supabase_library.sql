-- Run this in Supabase SQL Editor

alter table decks add column if not exists is_public boolean default false;
alter table decks add column if not exists author_name text;
alter table decks add column if not exists published_at timestamptz;

-- Allow all authenticated users to read public decks
create policy "Anyone can view public decks"
  on decks for select
  using (is_public = true);

-- Allow all authenticated users to read cards from public decks
create policy "Anyone can view cards from public decks"
  on cards for select
  using (
    exists (
      select 1 from decks where decks.id = cards.deck_id and decks.is_public = true
    )
  );
