-- ============================================================================
-- Reporting views
-- ============================================================================

-- Player attendance ratio (per player)
create or replace view player_attendance_summary as
select
  p.id as player_id,
  p.academy_id,
  p.full_name,
  p.code,
  count(ar.id) filter (where ar.status = 'present') as present_count,
  count(ar.id) filter (where ar.status = 'late')    as late_count,
  count(ar.id) filter (where ar.status = 'absent')  as absent_count,
  count(ar.id) as total_records,
  case when count(ar.id) > 0
    then round(100.0 * count(ar.id) filter (where ar.status in ('present','late')) / count(ar.id), 2)
    else 0 end as attendance_pct
from players p
left join attendance_records ar on ar.player_id = p.id
group by p.id;

-- Match stats per player
create or replace view player_match_summary as
select
  p.id as player_id,
  p.academy_id,
  coalesce(sum(mp.goals), 0) as goals,
  coalesce(sum(mp.yellow_cards), 0) as yellow_cards,
  coalesce(sum(mp.red_cards), 0) as red_cards,
  count(mp.id) as matches_played
from players p
left join match_participations mp on mp.player_id = p.id
group by p.id;

-- ROI: subscription value per attended hour
create or replace view player_roi as
select
  p.id as player_id,
  p.academy_id,
  c.monthly_fee,
  coalesce(sum(t.duration_min) filter (where ar.status in ('present','late')), 0) / 60.0 as attended_hours,
  case
    when coalesce(sum(t.duration_min) filter (where ar.status in ('present','late')), 0) > 0
    then c.monthly_fee / (coalesce(sum(t.duration_min) filter (where ar.status in ('present','late')), 0) / 60.0)
    else null
  end as cost_per_hour
from players p
left join categories c on c.id = p.category_id
left join attendance_records ar on ar.player_id = p.id
left join trainings t on t.id = ar.training_id
group by p.id, c.monthly_fee;

-- Academy financial summary
create or replace view academy_finance_summary as
select
  a.id as academy_id,
  a.name,
  coalesce((select sum(amount_paid) from subscriptions where academy_id = a.id), 0) as total_collected,
  coalesce((select sum(amount_due - amount_paid) from subscriptions where academy_id = a.id and status != 'paid'), 0) as outstanding,
  coalesce((select sum(amount) from extra_revenues where academy_id = a.id), 0) as extra_revenue,
  coalesce((select sum(amount) from expenses where academy_id = a.id), 0) as total_expenses,
  coalesce((select sum(amount_paid) from subscriptions where academy_id = a.id), 0)
    + coalesce((select sum(amount) from extra_revenues where academy_id = a.id), 0)
    - coalesce((select sum(amount) from expenses where academy_id = a.id), 0) as net_profit
from academies a;

-- Academy collection rate (current month)
create or replace view academy_current_collection as
select
  s.academy_id,
  sum(s.amount_paid) as collected,
  sum(s.amount_due) as expected,
  case when sum(s.amount_due) > 0
    then round(100.0 * sum(s.amount_paid) / sum(s.amount_due), 2)
    else 0 end as collection_pct
from subscriptions s
where s.period_year = extract(year from current_date)::int
  and s.period_month = extract(month from current_date)::int
group by s.academy_id;
