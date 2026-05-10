-- ============================================================================
-- 0012 — Custom fields per academy
-- Allows admin to define extra registration / profile fields (height, weight,
-- school certificate, etc.) with type + required + visibility flags.
-- Each player can also have ad-hoc fields (label + value) added directly to
-- their profile by the admin without a global definition.
-- ============================================================================

create table if not exists custom_field_definitions (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  field_key text not null,                 -- internal identifier, e.g. "school_certificate"
  label text not null,                      -- Arabic display label
  field_type text not null,                 -- 'text' | 'textarea' | 'number' | 'date' | 'file' | 'checkbox' | 'select'
  required boolean not null default false,
  options jsonb,                            -- for 'select': array of strings
  show_on_join boolean not null default true,
  show_on_admin_create boolean not null default true,
  show_on_profile boolean not null default true,
  display_order integer not null default 0,
  active boolean not null default true,
  help_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academy_id, field_key)
);

create index if not exists cfd_academy_active_idx
  on custom_field_definitions (academy_id, active, display_order);

create table if not exists player_custom_values (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  -- One of these two is set:
  field_definition_id uuid references custom_field_definitions(id) on delete cascade,
  ad_hoc_label text,                        -- per-player custom field (no global def)
  value text,                                -- string for everything; file paths for file type
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pcv_def_or_ad_hoc check (
    (field_definition_id is not null and ad_hoc_label is null) or
    (field_definition_id is null and ad_hoc_label is not null)
  )
);

-- One value per (player, definition). Updates rely on this for upserts.
create unique index if not exists pcv_unique_def
  on player_custom_values (player_id, field_definition_id)
  where field_definition_id is not null;

create index if not exists pcv_player_idx on player_custom_values (player_id);

-- Touch updated_at on update
create or replace function _touch_pcv() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_pcv_touch on player_custom_values;
create trigger trg_pcv_touch before update on player_custom_values
  for each row execute function _touch_pcv();

drop trigger if exists trg_cfd_touch on custom_field_definitions;
create trigger trg_cfd_touch before update on custom_field_definitions
  for each row execute function _touch_pcv();

-- Stash custom-field values on join_requests until the request is approved
-- (then they're materialized into player_custom_values on the new player).
alter table join_requests
  add column if not exists custom_values jsonb not null default '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table custom_field_definitions enable row level security;
alter table player_custom_values enable row level security;

-- Field definitions: readable by anyone in the academy + the public (for /join form);
-- writable only by managers.
create policy "cfd_read_public" on custom_field_definitions for select
  using (true);   -- public read so /join form can render the right fields by slug

create policy "cfd_write" on custom_field_definitions for all
  using (manages_academy(academy_id))
  with check (manages_academy(academy_id));

-- Player custom values: read for academy members + the player themselves;
-- public insert allowed (so /join form can submit values for new applicants —
-- though actually values are inserted via server action with admin client).
create policy "pcv_read" on player_custom_values for select
  using (
    is_super_admin()
    or exists (
      select 1 from players p
      where p.id = player_id
        and (p.academy_id in (select user_academies()) or p.user_id = auth.uid())
    )
  );

create policy "pcv_write" on player_custom_values for all
  using (
    exists (select 1 from players p where p.id = player_id and manages_academy(p.academy_id))
  )
  with check (
    exists (select 1 from players p where p.id = player_id and manages_academy(p.academy_id))
  );
