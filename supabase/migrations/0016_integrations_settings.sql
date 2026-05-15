-- ============================================================================
-- 0016 — Integrations settings (Google services + future third-party services)
--
-- Singleton row keyed by id=1. Each integration has its own toggle + config.
-- Super Admin manages the row from /super-admin/integrations.
-- ============================================================================

create table if not exists integrations_settings (
  id integer primary key default 1 check (id = 1),

  -- Public site URL (used by sitemap / canonical / OG meta).
  site_url text,
  default_meta_description text,
  default_og_image_url text,

  -- Google Analytics 4
  ga4_enabled boolean not null default false,
  ga4_measurement_id text,                       -- e.g. "G-XXXXXXXXXX"

  -- Google Search Console (HTML meta tag verification)
  gsc_enabled boolean not null default false,
  gsc_verification_token text,                   -- the content="..." value of <meta name="google-site-verification">

  -- Google Calendar Sync (added in batch 2 — placeholders so the schema is stable)
  gcal_enabled boolean not null default false,
  gcal_default_calendar_name text,

  updated_at timestamptz not null default now()
);

-- Touch updated_at automatically
create or replace function _touch_integrations() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_integrations_touch on integrations_settings;
create trigger trg_integrations_touch before update on integrations_settings
  for each row execute function _touch_integrations();

-- ----------------------------------------------------------------------------
-- RLS: public read (so the GA4 ID can be loaded into the layout for anonymous
-- visitors), super_admin write.
-- ----------------------------------------------------------------------------
alter table integrations_settings enable row level security;

create policy "is_read_public" on integrations_settings for select using (true);
create policy "is_write_super" on integrations_settings for all
  using (is_super_admin()) with check (is_super_admin());

-- Seed singleton row (so updates always have something to update)
insert into integrations_settings (id) values (1) on conflict (id) do nothing;
