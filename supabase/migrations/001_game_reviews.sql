-- Supabase SQL: Create game_reviews table with RLS

create table if not exists public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pgn text not null,
  moves jsonb not null,
  white_accuracy numeric not null,
  black_accuracy numeric not null,
  opening text not null default '',
  eco text not null default '',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.game_reviews enable row level security;

-- Users can read their own reviews
create policy "Users can read own reviews"
  on public.game_reviews for select
  using (auth.uid() = user_id);

-- Users can insert their own reviews
create policy "Users can insert own reviews"
  on public.game_reviews for insert
  with check (auth.uid() = user_id);

-- Anyone can read shared reviews (by id)
create policy "Anyone can read by id"
  on public.game_reviews for select
  using (true);

-- Users can delete their own reviews
create policy "Users can delete own reviews"
  on public.game_reviews for delete
  using (auth.uid() = user_id);
