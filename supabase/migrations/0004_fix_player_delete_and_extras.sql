-- ============================================================================
-- 0004 — Fix player deletion (FK from join_requests blocking) + small extras
-- ============================================================================

-- (1) join_requests.created_player_id had no ON DELETE clause, blocking deletion.
alter table join_requests
  drop constraint if exists join_requests_created_player_id_fkey;
alter table join_requests
  add constraint join_requests_created_player_id_fkey
  foreign key (created_player_id) references players(id) on delete set null;

-- (2) Match participations: track minutes played alongside existing card stats.
alter table match_participations
  add column if not exists minutes_played integer not null default 0;

-- (3) Matches: optional duration (full match length) for context.
alter table matches
  add column if not exists duration_min integer not null default 90;

-- (4) Per-player view aggregating discipline + participation stats.
create or replace view player_match_stats as
select
  p.id as player_id,
  p.academy_id,
  count(distinct mp.match_id) as matches_played,
  coalesce(sum(mp.minutes_played), 0) as total_minutes,
  coalesce(sum(mp.goals), 0) as total_goals,
  coalesce(sum(mp.yellow_cards), 0) as total_yellows,
  coalesce(sum(mp.red_cards), 0) as total_reds
from players p
left join match_participations mp on mp.player_id = p.id
group by p.id, p.academy_id;

-- (5) Helpful indexes for filtered expense search.
create index if not exists expenses_description_idx on expenses
  using gin (to_tsvector('simple', coalesce(description, '')));
