-- ============================================================================
-- 0007 — Auto-suspend a player after 3 yellow cards in current disciplinary cycle.
-- Admin reactivates by clearing the suspension and resetting the yellow cycle.
-- ============================================================================

-- Track when the current "yellow card cycle" started (null = count all-time yellows).
alter table players
  add column if not exists yellow_cycle_reset_at timestamptz,
  add column if not exists suspension_reason text;

-- Threshold (per academy can later be configurable; hard-coded here)
-- Count of yellows after `yellow_cycle_reset_at` (or all if null) — used by trigger.
create or replace function active_yellow_card_count(p_player uuid) returns integer
language sql stable as $$
  select coalesce(sum(mp.yellow_cards), 0)::integer
  from match_participations mp
  join matches m on m.id = mp.match_id
  join players p on p.id = mp.player_id
  where mp.player_id = p_player
    and (p.yellow_cycle_reset_at is null or m.match_date > p.yellow_cycle_reset_at);
$$;

-- Trigger function: after a participation row changes, recompute and possibly suspend.
create or replace function check_yellow_card_threshold() returns trigger
language plpgsql as $$
declare
  v_count integer;
  v_player uuid;
  v_status player_status;
begin
  v_player := coalesce(new.player_id, old.player_id);
  if v_player is null then return null; end if;

  v_count := active_yellow_card_count(v_player);
  select status into v_status from players where id = v_player;

  if v_count >= 3 and v_status = 'active' then
    update players
       set status = 'suspended',
           suspension_reason = format('auto: %s yellow cards', v_count)
     where id = v_player;
    insert into audit_log (academy_id, action, entity_type, entity_id, metadata)
    select academy_id, 'player.auto_suspended', 'players', id,
           jsonb_build_object('yellow_cards', v_count, 'reason', 'three_yellows')
      from players where id = v_player;
  end if;
  return null;
end $$;

drop trigger if exists trg_mp_yellow_threshold on match_participations;
create trigger trg_mp_yellow_threshold
  after insert or update of yellow_cards or delete on match_participations
  for each row execute function check_yellow_card_threshold();

-- Helper view: discipline summary per player (used in reports)
create or replace view player_discipline as
select
  p.id as player_id,
  p.academy_id,
  p.full_name,
  p.code,
  p.status,
  p.suspension_reason,
  p.yellow_cycle_reset_at,
  active_yellow_card_count(p.id) as active_yellows,
  coalesce((select sum(mp.yellow_cards) from match_participations mp where mp.player_id = p.id), 0) as total_yellows,
  coalesce((select sum(mp.red_cards)    from match_participations mp where mp.player_id = p.id), 0) as total_reds,
  coalesce((select sum(mp.minutes_played) from match_participations mp where mp.player_id = p.id), 0) as total_minutes,
  coalesce((select count(distinct mp.match_id) from match_participations mp where mp.player_id = p.id and mp.lineup_role in ('starting','bench')), 0) as matches_called
from players p;

-- Helper function for admin reactivation (used by server action via supabase rpc-style call too).
create or replace function reactivate_player(p_player uuid) returns void
language plpgsql security definer as $$
begin
  update players
     set status = 'active',
         suspension_reason = null,
         yellow_cycle_reset_at = now()
   where id = p_player;
  insert into audit_log (academy_id, action, entity_type, entity_id, metadata)
  select academy_id, 'player.reactivated', 'players', id,
         jsonb_build_object('reset_at', now())
    from players where id = p_player;
end $$;
