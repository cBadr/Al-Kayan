-- Per-match squad sizes (lineup + bench caps). Defaults: 11 starting + 9 bench
-- (FIFA standard). Lower for 5-a-side or 7-a-side; higher for friendly matches
-- where the academy wants to involve many players.
alter table matches
  add column if not exists max_starting integer not null default 11
    check (max_starting between 1 and 30),
  add column if not exists max_bench integer not null default 9
    check (max_bench between 0 and 30);
