-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  elo integer not null default 1000,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_played_date date,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DAILY PUZZLES table (one row per calendar date, same for all players)
create table public.daily_puzzles (
  id uuid primary key default uuid_generate_v4(),
  puzzle_date date unique not null,
  seed integer not null,
  difficulty integer not null default 5 check (difficulty between 1 and 10),
  created_at timestamptz not null default now()
);

-- GAME SESSIONS table (one per player per day)
create table public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  puzzle_id uuid references public.daily_puzzles(id) not null,
  puzzle_date date not null,

  memory_score integer check (memory_score between 0 and 100),
  speed_score integer check (speed_score between 0 and 100),
  pattern_score integer check (pattern_score between 0 and 100),
  math_score integer check (math_score between 0 and 100),
  stroop_score integer check (stroop_score between 0 and 100),

  total_score integer,
  elo_before integer,
  elo_after integer,
  elo_change integer,
  global_rank integer,
  percentile integer,
  completion_time_ms integer,

  completed_at timestamptz not null default now(),

  unique(user_id, puzzle_date)
);

-- LEADERBOARD VIEW (daily)
create or replace view public.daily_leaderboard as
select
  gs.puzzle_date,
  gs.total_score,
  gs.global_rank,
  gs.percentile,
  gs.elo_after as elo,
  p.username,
  p.display_name,
  p.avatar_url,
  p.streak_current
from public.game_sessions gs
join public.profiles p on gs.user_id = p.id
order by gs.puzzle_date desc, gs.total_score desc;

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_puzzles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Game sessions are viewable by everyone" on public.game_sessions for select using (true);
create policy "Users can insert their own sessions" on public.game_sessions for insert with check (auth.uid() = user_id);

create policy "Daily puzzles readable by all" on public.daily_puzzles for select using (true);

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Brain Athlete')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
