-- ============================================================================
-- 0006 — Match details + lineup (starting XI / bench / pitch view)
-- ============================================================================

-- Match type (home/away)
do $$ begin
  create type match_type as enum ('home', 'away');
exception when duplicate_object then null; end $$;

-- Lineup role for match_participations
do $$ begin
  create type lineup_role as enum ('starting', 'bench', 'unused');
exception when duplicate_object then null; end $$;

-- Player position enum (broad — Arabic labels stored as text where needed)
-- We use simple short codes; Arabic display happens in UI.
do $$ begin
  create type player_position as enum ('GK', 'DF', 'MF', 'FW');
exception when duplicate_object then null; end $$;

-- Players: position + preferred jersey
alter table players
  add column if not exists position player_position,
  add column if not exists preferred_jersey integer;

-- Matches: match type, referee crew, formation
alter table matches
  add column if not exists match_type match_type not null default 'home',
  add column if not exists referee_name text,
  add column if not exists referee_phone text,
  add column if not exists assistant1_name text,
  add column if not exists assistant1_phone text,
  add column if not exists assistant2_name text,
  add column if not exists assistant2_phone text,
  add column if not exists formation text,                  -- e.g. "4-3-3"
  add column if not exists kickoff_time time;

-- match_participations: lineup role + on-pitch position + jersey + (x,y) placement
alter table match_participations
  add column if not exists lineup_role lineup_role not null default 'starting',
  add column if not exists pitch_position player_position,
  add column if not exists jersey_number integer,
  -- Pitch coordinates — percentage of pitch (0..100). Optional, used by formation editor.
  add column if not exists pitch_x numeric(5,2),
  add column if not exists pitch_y numeric(5,2),
  add column if not exists is_captain boolean not null default false;

create index if not exists mp_lineup_role_idx on match_participations (match_id, lineup_role);

-- Drop old per-match aggregate view (if it exists) and rebuild including minutes.
drop view if exists player_match_stats;
create view player_match_stats as
select
  p.id as player_id,
  p.academy_id,
  count(distinct mp.match_id) filter (where mp.lineup_role in ('starting','bench')) as matches_called,
  count(distinct mp.match_id) filter (where mp.lineup_role = 'starting') as matches_started,
  coalesce(sum(mp.minutes_played), 0) as total_minutes,
  coalesce(sum(mp.goals), 0) as total_goals,
  coalesce(sum(mp.yellow_cards), 0) as total_yellows,
  coalesce(sum(mp.red_cards), 0) as total_reds
from players p
left join match_participations mp on mp.player_id = p.id
group by p.id, p.academy_id;

-- Per-match team totals view (for match-level reports)
create or replace view match_team_totals as
select
  m.id as match_id,
  m.academy_id,
  count(*) filter (where mp.lineup_role = 'starting') as starting_count,
  count(*) filter (where mp.lineup_role = 'bench')    as bench_count,
  coalesce(sum(mp.goals), 0)         as goals,
  coalesce(sum(mp.minutes_played),0) as minutes,
  coalesce(sum(mp.yellow_cards),0)   as yellows,
  coalesce(sum(mp.red_cards),0)      as reds
from matches m
left join match_participations mp on mp.match_id = m.id
group by m.id, m.academy_id;
