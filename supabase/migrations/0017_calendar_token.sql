-- ============================================================================
-- 0017 — Per-user calendar subscription token
--
-- Each user gets a long random token they can use to subscribe to a public
-- iCalendar (.ics) feed of their academy's trainings + matches. The token
-- is the only secret in the URL — anyone holding it can read the calendar,
-- so users can regenerate it at any time to revoke old subscriptions.
-- ============================================================================

alter table profiles
  add column if not exists calendar_token text;

-- Unique partial index — token uniqueness only enforced when set.
create unique index if not exists profiles_calendar_token_uniq
  on profiles (calendar_token)
  where calendar_token is not null;

-- Backfill: generate a token for every existing profile so they have one ready
-- the first time they visit /me. New profiles get one on first action.
update profiles
  set calendar_token = encode(gen_random_bytes(24), 'hex')
  where calendar_token is null;
