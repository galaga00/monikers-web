create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_player_id uuid,
  phase text not null default 'setup' check (phase in ('setup', 'lobby', 'ready', 'playing', 'finished')),
  current_team_id uuid,
  active_player_id uuid,
  current_prompt_id uuid,
  turn_number integer not null default 0,
  round_number integer not null default 1,
  prompts_per_player integer not null default 3,
  expected_players integer,
  team_assignment_mode text not null default 'auto' check (team_assignment_mode in ('auto', 'choose')),
  prompt_mode text not null default 'free' check (prompt_mode in ('free', 'category')),
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  score integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  team_id uuid references public.teams(id) on delete set null,
  has_submitted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  text text not null,
  category text,
  status text not null default 'available' check (status in ('available', 'active', 'correct')),
  deck_order integer,
  created_at timestamptz not null default now()
);

create table if not exists public.turns (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  correct_count integer not null default 0,
  skip_count integer not null default 0
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'games_host_player_id_fkey') then
    alter table public.games add constraint games_host_player_id_fkey foreign key (host_player_id) references public.players(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'games_current_team_id_fkey') then
    alter table public.games add constraint games_current_team_id_fkey foreign key (current_team_id) references public.teams(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'games_active_player_id_fkey') then
    alter table public.games add constraint games_active_player_id_fkey foreign key (active_player_id) references public.players(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'games_current_prompt_id_fkey') then
    alter table public.games add constraint games_current_prompt_id_fkey foreign key (current_prompt_id) references public.prompts(id) on delete set null;
  end if;
end $$;

create index if not exists games_code_idx on public.games(code);
create index if not exists players_game_id_idx on public.players(game_id);
create index if not exists teams_game_id_idx on public.teams(game_id);
create index if not exists prompts_game_id_status_idx on public.prompts(game_id, status);
create index if not exists turns_game_id_active_idx on public.turns(game_id, ended_at);

alter table public.games add column if not exists prompts_per_player integer not null default 3;
alter table public.games add column if not exists expected_players integer;
alter table public.games add column if not exists team_assignment_mode text not null default 'auto';
alter table public.games add column if not exists prompt_mode text not null default 'free';
alter table public.games alter column phase set default 'setup';
alter table public.prompts add column if not exists category text;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'games_phase_check') then
    alter table public.games drop constraint games_phase_check;
  end if;
  alter table public.games add constraint games_phase_check check (phase in ('setup', 'lobby', 'ready', 'playing', 'finished'));
  if exists (select 1 from pg_constraint where conname = 'games_prompts_per_player_check') then
    alter table public.games drop constraint games_prompts_per_player_check;
  end if;
  alter table public.games add constraint games_prompts_per_player_check check (prompts_per_player between 1 and 20);
  if exists (select 1 from pg_constraint where conname = 'games_expected_players_check') then
    alter table public.games drop constraint games_expected_players_check;
  end if;
  alter table public.games add constraint games_expected_players_check check (expected_players is null or expected_players between 1 and 200);
  if exists (select 1 from pg_constraint where conname = 'games_team_assignment_mode_check') then
    alter table public.games drop constraint games_team_assignment_mode_check;
  end if;
  alter table public.games add constraint games_team_assignment_mode_check check (team_assignment_mode in ('auto', 'choose'));
  if exists (select 1 from pg_constraint where conname = 'games_prompt_mode_check') then
    alter table public.games drop constraint games_prompt_mode_check;
  end if;
  alter table public.games add constraint games_prompt_mode_check check (prompt_mode in ('free', 'category'));
end $$;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games') then
    alter publication supabase_realtime add table public.games;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then
    alter publication supabase_realtime add table public.players;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams') then
    alter publication supabase_realtime add table public.teams;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prompts') then
    alter publication supabase_realtime add table public.prompts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'turns') then
    alter publication supabase_realtime add table public.turns;
  end if;
end $$;

-- MVP note: no login is required, so the browser uses the anon key directly.
-- Keep RLS disabled for fast local testing, or add policies before sharing broadly.
alter table public.games disable row level security;
alter table public.players disable row level security;
alter table public.teams disable row level security;
alter table public.prompts disable row level security;
alter table public.turns disable row level security;
