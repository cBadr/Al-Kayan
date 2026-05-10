-- Add `cycle_days` column to academies (referenced by code but never migrated).
-- Subscription cycle length in days (default 30 = monthly).
alter table academies
  add column if not exists cycle_days integer not null default 30;
