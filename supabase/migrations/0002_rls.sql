-- ============================================================================
-- Row Level Security policies — academy isolation + role-based access
-- ============================================================================

-- Helper: is current user super admin?
create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- Helper: list of academies the current user belongs to
create or replace function user_academies() returns setof uuid
language sql stable security definer set search_path = public as $$
  select academy_id from memberships
  where user_id = auth.uid() and academy_id is not null;
$$;

-- Helper: does current user manage a specific academy?
create or replace function manages_academy(p_academy uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
      and academy_id = p_academy
      and role in ('academy_manager', 'super_admin')
  ) or is_super_admin();
$$;

-- Helper: is user a coach in this academy?
create or replace function is_coach(p_academy uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid() and academy_id = p_academy and role = 'coach'
  );
$$;

-- ----------------------------------------------------------------------------
-- ENABLE RLS on all tenant tables
-- ----------------------------------------------------------------------------
alter table academies enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table academy_sequences enable row level security;
alter table categories enable row level security;
alter table players enable row level security;
alter table join_requests enable row level security;
alter table trainings enable row level security;
alter table attendance_records enable row level security;
alter table matches enable row level security;
alter table match_participations enable row level security;
alter table injuries enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table extra_revenues enable row level security;
alter table assets enable row level security;
alter table notifications enable row level security;
alter table report_schedules enable row level security;
alter table audit_log enable row level security;

-- ----------------------------------------------------------------------------
-- ACADEMIES
-- ----------------------------------------------------------------------------
create policy "academies_read" on academies for select
  using (is_super_admin() or id in (select user_academies()));
create policy "academies_write_super" on academies for all
  using (is_super_admin()) with check (is_super_admin());
create policy "academies_update_manager" on academies for update
  using (manages_academy(id)) with check (manages_academy(id));

-- ----------------------------------------------------------------------------
-- PROFILES — every user sees own; super admin sees all
-- ----------------------------------------------------------------------------
create policy "profiles_self" on profiles for select
  using (id = auth.uid() or is_super_admin());
create policy "profiles_self_write" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS
-- ----------------------------------------------------------------------------
create policy "memberships_read" on memberships for select
  using (
    is_super_admin()
    or user_id = auth.uid()
    or (academy_id is not null and manages_academy(academy_id))
  );
create policy "memberships_write" on memberships for all
  using (is_super_admin() or (academy_id is not null and manages_academy(academy_id)))
  with check (is_super_admin() or (academy_id is not null and manages_academy(academy_id)));

-- ----------------------------------------------------------------------------
-- Generic per-academy policy macro pattern
-- ----------------------------------------------------------------------------
create policy "seq_scope" on academy_sequences for all
  using (is_super_admin() or manages_academy(academy_id))
  with check (is_super_admin() or manages_academy(academy_id));

create policy "cat_read" on categories for select
  using (is_super_admin() or academy_id in (select user_academies()));
create policy "cat_write" on categories for all
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "players_read" on players for select
  using (
    is_super_admin()
    or academy_id in (select user_academies())
  );
create policy "players_write" on players for all
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "jr_read" on join_requests for select
  using (is_super_admin() or manages_academy(academy_id));
create policy "jr_insert_public" on join_requests for insert
  with check (true); -- public registration allowed
create policy "jr_update" on join_requests for update
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));
create policy "jr_delete" on join_requests for delete
  using (manages_academy(academy_id));

create policy "tr_read" on trainings for select
  using (is_super_admin() or academy_id in (select user_academies()));
create policy "tr_write" on trainings for all
  using (manages_academy(academy_id) or is_coach(academy_id))
  with check (manages_academy(academy_id) or is_coach(academy_id));

create policy "att_read" on attendance_records for select
  using (
    is_super_admin()
    or exists (
      select 1 from trainings t where t.id = training_id
        and (t.academy_id in (select user_academies()))
    )
  );
create policy "att_insert" on attendance_records for insert
  with check (
    exists (select 1 from trainings t where t.id = training_id
      and (manages_academy(t.academy_id) or is_coach(t.academy_id)))
  );
create policy "att_update" on attendance_records for update
  using (
    exists (
      select 1 from trainings t where t.id = training_id and (
        manages_academy(t.academy_id)
        or (is_coach(t.academy_id) and locked_at > now())
      )
    )
  );

create policy "matches_read" on matches for select
  using (is_super_admin() or academy_id in (select user_academies()));
create policy "matches_write" on matches for all
  using (manages_academy(academy_id) or is_coach(academy_id))
  with check (manages_academy(academy_id) or is_coach(academy_id));

create policy "mp_read" on match_participations for select
  using (
    is_super_admin()
    or exists (select 1 from matches m where m.id = match_id and m.academy_id in (select user_academies()))
  );
create policy "mp_write" on match_participations for all
  using (
    exists (select 1 from matches m where m.id = match_id and (manages_academy(m.academy_id) or is_coach(m.academy_id)))
  ) with check (
    exists (select 1 from matches m where m.id = match_id and (manages_academy(m.academy_id) or is_coach(m.academy_id)))
  );

create policy "inj_read" on injuries for select
  using (
    is_super_admin()
    or exists (select 1 from players p where p.id = player_id and p.academy_id in (select user_academies()))
  );
create policy "inj_write" on injuries for all
  using (
    exists (select 1 from players p where p.id = player_id and (manages_academy(p.academy_id) or is_coach(p.academy_id)))
  ) with check (
    exists (select 1 from players p where p.id = player_id and (manages_academy(p.academy_id) or is_coach(p.academy_id)))
  );

-- Subscriptions / payments: managers only
create policy "sub_read" on subscriptions for select
  using (
    is_super_admin()
    or manages_academy(academy_id)
    or exists (select 1 from players p where p.id = player_id and p.user_id = auth.uid())
  );
create policy "sub_write" on subscriptions for all
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "pay_read" on payments for select
  using (
    is_super_admin()
    or manages_academy(academy_id)
    or exists (
      select 1 from subscriptions s join players p on p.id = s.player_id
      where s.id = subscription_id and p.user_id = auth.uid()
    )
  );
create policy "pay_write" on payments for all
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "exp_cat" on expense_categories for all
  using (manages_academy(academy_id)) with check (manages_academy(academy_id));
create policy "exp_read" on expenses for select using (is_super_admin() or manages_academy(academy_id));
create policy "exp_write" on expenses for all using (manages_academy(academy_id)) with check (manages_academy(academy_id));
create policy "rev_read" on extra_revenues for select using (is_super_admin() or manages_academy(academy_id));
create policy "rev_write" on extra_revenues for all using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "assets_read" on assets for select using (is_super_admin() or academy_id in (select user_academies()));
create policy "assets_write" on assets for all using (manages_academy(academy_id)) with check (manages_academy(academy_id));

create policy "notif_read" on notifications for select
  using (
    is_super_admin()
    or recipient_user_id = auth.uid()
    or (academy_id is not null and manages_academy(academy_id))
  );
create policy "notif_write" on notifications for all
  using (is_super_admin() or (academy_id is not null and manages_academy(academy_id)))
  with check (is_super_admin() or (academy_id is not null and manages_academy(academy_id)));
create policy "notif_update_self" on notifications for update
  using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create policy "rs_read" on report_schedules for select
  using (is_super_admin() or (academy_id is not null and manages_academy(academy_id)));
create policy "rs_write" on report_schedules for all
  using (is_super_admin() or (academy_id is not null and manages_academy(academy_id)))
  with check (is_super_admin() or (academy_id is not null and manages_academy(academy_id)));

create policy "audit_read" on audit_log for select
  using (is_super_admin() or (academy_id is not null and manages_academy(academy_id)));
create policy "audit_insert" on audit_log for insert with check (true);
