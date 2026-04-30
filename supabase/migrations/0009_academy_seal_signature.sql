-- Academy seal + manager signature for printed documents (player profile, receipts, reports).
alter table academies
  add column if not exists seal_url text,
  add column if not exists manager_signature_url text,
  add column if not exists manager_name text;
