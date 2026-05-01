-- Add match observer (مراقب المباراة) to matches.
alter table matches
  add column if not exists observer_name text,
  add column if not exists observer_phone text;
