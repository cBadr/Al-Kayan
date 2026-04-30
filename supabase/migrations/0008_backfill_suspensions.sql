-- ============================================================================
-- 0008 — Backfill: re-evaluate yellow-card suspensions for existing data.
-- Migration 0007 added the trigger but it only fires on NEW participation
-- changes. For data inserted before the trigger existed, players that already
-- have ≥3 yellows were never auto-suspended. This script applies the rule once.
--
-- Also exposes a re-runnable function `recompute_player_suspensions(academy)`
-- that can be invoked from the app (or via SQL) to fix discrepancies anytime.
-- ============================================================================

drop function if exists recompute_player_suspensions(uuid);

create or replace function recompute_player_suspensions(p_academy uuid default null)
returns table(player_id uuid, full_name text, active_yellows integer, op text)
language plpgsql security definer as $$
begin
  return query
  with computed as (
    select p.id, p.full_name, p.status, p.suspension_reason,
           active_yellow_card_count(p.id) as yc
    from players p
    where p.academy_id = coalesce(p_academy, p.academy_id)
  )
  -- Suspend active players who hit threshold
  , suspended as (
    update players p
       set status = 'suspended',
           suspension_reason = format('auto: %s yellow cards', c.yc)
      from computed c
      where p.id = c.id
        and c.status = 'active'
        and c.yc >= 3
      returning p.id, p.full_name, c.yc
  )
  select s.id, s.full_name, s.yc::integer, 'auto_suspended'::text from suspended s;

  -- Audit entries (qualify columns explicitly so they don't clash with the
  -- function's OUT parameters or the audit_log table's `action` column).
  insert into audit_log (academy_id, action, entity_type, entity_id, metadata)
  select p.academy_id, 'player.auto_suspended_backfill', 'players', p.id,
         jsonb_build_object('yellow_cards', active_yellow_card_count(p.id))
    from players p
   where p.suspension_reason like 'auto: %'
     and not exists (
       select 1 from audit_log al
        where al.entity_id = p.id
          and al.action in ('player.auto_suspended', 'player.auto_suspended_backfill')
     );
end $$;

-- Run it once now for all academies.
select * from recompute_player_suspensions(null);
