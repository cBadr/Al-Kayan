-- ============================================================================
-- Salama-03 — Football Academies Management System
-- Initial schema: multi-tenant, RLS-enforced, per-academy sequences
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('super_admin', 'academy_manager', 'coach', 'player');
create type join_status as enum ('pending', 'approved', 'rejected');
create type player_status as enum ('active', 'suspended', 'archived');
create type attendance_status as enum ('present', 'absent', 'late');
create type subscription_status as enum ('unpaid', 'partial', 'paid', 'overdue');
create type asset_condition as enum ('good', 'maintenance', 'damaged', 'transferred');
create type injury_source as enum ('training', 'match');
create type notification_channel as enum ('in_app', 'email', 'whatsapp');
create type notification_status as enum ('queued', 'sent', 'failed');

-- ----------------------------------------------------------------------------
-- CORE TABLES
-- ----------------------------------------------------------------------------
create table academies (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  logo_url text,
  address text,
  phone text,
  whatsapp text,
  email text,
  settings jsonb not null default jsonb_build_object(
    'attendance_lock_minutes', 25,
    'required_fields', jsonb_build_array('full_name','birth_date','phone'),
    'notification_channels', jsonb_build_array('in_app','email'),
    'overdue_reminders', jsonb_build_object('every_days', 7, 'before_due_days', 3, 'final_after_days', 30),
    'receipt_footer', 'الاشتراك غير قابل للاسترداد',
    'date_format', 'gregorian'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  academy_id uuid references academies(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, academy_id, role),
  check (role = 'super_admin' or academy_id is not null)
);
create index on memberships (user_id);
create index on memberships (academy_id);

-- ----------------------------------------------------------------------------
-- PER-ACADEMY SEQUENCES (player code 000001+, receipt 1000001+)
-- ----------------------------------------------------------------------------
create table academy_sequences (
  academy_id uuid primary key references academies(id) on delete cascade,
  player_seq integer not null default 0,
  receipt_seq integer not null default 1000000
);

create or replace function next_player_code(p_academy uuid) returns text
language plpgsql as $$
declare v_seq integer;
begin
  insert into academy_sequences (academy_id) values (p_academy)
    on conflict (academy_id) do nothing;
  update academy_sequences
    set player_seq = player_seq + 1
    where academy_id = p_academy
    returning player_seq into v_seq;
  return lpad(v_seq::text, 6, '0');
end $$;

create or replace function next_receipt_no(p_academy uuid) returns integer
language plpgsql as $$
declare v_seq integer;
begin
  insert into academy_sequences (academy_id) values (p_academy)
    on conflict (academy_id) do nothing;
  update academy_sequences
    set receipt_seq = receipt_seq + 1
    where academy_id = p_academy
    returning receipt_seq into v_seq;
  return v_seq;
end $$;

-- ----------------------------------------------------------------------------
-- CATEGORIES (per-academy, dynamic — كيدز/براعم/ناشئين)
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  monthly_fee numeric(12,2) not null default 0,
  age_min integer,
  age_max integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (academy_id, name)
);
create index on categories (academy_id);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table players (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, -- نفس حساب اللاعب/ولي الأمر
  code text not null,
  category_id uuid references categories(id) on delete set null,
  full_name text not null,
  birth_date date,
  phone text,
  email text,
  national_id text,
  guardian_name text,
  guardian_phone text,
  photo_url text,
  id_doc_url text,
  status player_status not null default 'active',
  joined_at timestamptz not null default now(),
  notes text,
  unique (academy_id, code)
);
create index on players (academy_id);
create index on players (category_id);
create index on players (user_id);

-- ----------------------------------------------------------------------------
-- JOIN REQUESTS (نموذج التسجيل العام)
-- ----------------------------------------------------------------------------
create table join_requests (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  full_name text not null,
  birth_date date,
  phone text,
  email text,
  national_id text,
  guardian_name text,
  guardian_phone text,
  photo_url text,
  id_doc_url text,
  desired_category_id uuid references categories(id) on delete set null,
  status join_status not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_player_id uuid references players(id),
  created_at timestamptz not null default now()
);
create index on join_requests (academy_id, status);

-- ----------------------------------------------------------------------------
-- TRAININGS + ATTENDANCE
-- ----------------------------------------------------------------------------
create table trainings (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_min integer not null default 90,
  location text,
  notes text,
  created_at timestamptz not null default now()
);
create index on trainings (academy_id, scheduled_at);

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  training_id uuid not null references trainings(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  status attendance_status not null,
  recorded_by uuid references auth.users(id),
  recorded_at timestamptz not null default now(),
  locked_at timestamptz not null,
  unique (training_id, player_id)
);
create index on attendance_records (player_id);

-- ----------------------------------------------------------------------------
-- MATCHES + PARTICIPATIONS (multi-category)
-- ----------------------------------------------------------------------------
create table matches (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  opponent text not null,
  venue text,
  match_date timestamptz not null,
  our_score integer,
  their_score integer,
  notes text,
  created_at timestamptz not null default now()
);
create index on matches (academy_id, match_date);

create table match_participations (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  goals integer not null default 0,
  yellow_cards integer not null default 0,
  red_cards integer not null default 0,
  sent_off boolean not null default false,
  notes text,
  unique (match_id, player_id)
);
create index on match_participations (player_id);

-- ----------------------------------------------------------------------------
-- INJURIES
-- ----------------------------------------------------------------------------
create table injuries (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  source injury_source not null,
  source_match_id uuid references matches(id) on delete set null,
  source_training_id uuid references trainings(id) on delete set null,
  injury_type text,
  body_location text,
  occurred_at date not null default current_date,
  expected_return_at date,
  notes text,
  created_at timestamptz not null default now()
);
create index on injuries (player_id);

-- ----------------------------------------------------------------------------
-- FINANCE: subscriptions, payments, expenses, revenues
-- ----------------------------------------------------------------------------
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  status subscription_status not null default 'unpaid',
  due_date date,
  created_at timestamptz not null default now(),
  unique (player_id, period_year, period_month)
);
create index on subscriptions (academy_id, period_year, period_month);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method text,
  receipt_no integer not null,
  recorded_by uuid references auth.users(id),
  notes text,
  unique (academy_id, receipt_no)
);
create index on payments (subscription_id);

create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  unique (academy_id, name)
);

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  category_id uuid references expense_categories(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  spent_at date not null default current_date,
  receipt_image_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on expenses (academy_id, spent_at);

create table extra_revenues (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  source text not null,
  amount numeric(12,2) not null,
  received_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create index on extra_revenues (academy_id, received_at);

-- ----------------------------------------------------------------------------
-- ASSETS (with QR)
-- ----------------------------------------------------------------------------
create table assets (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid not null references academies(id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  storage_location text,
  custodian text,
  condition asset_condition not null default 'good',
  last_inventory_at date,
  qr_token text not null unique default replace(uuid_generate_v4()::text,'-',''),
  notes text,
  created_at timestamptz not null default now()
);
create index on assets (academy_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid references academies(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_group text,
  channel notification_channel not null default 'in_app',
  title text not null,
  body text,
  payload jsonb,
  status notification_status not null default 'queued',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (recipient_user_id, read_at);
create index on notifications (academy_id, status);

create table report_schedules (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid references academies(id) on delete cascade,
  type text not null,
  cron_expr text not null,
  recipients text[] not null default '{}',
  active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  academy_id uuid references academies(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log (academy_id, created_at desc);

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------
create or replace function set_player_code() returns trigger language plpgsql as $$
begin
  if new.code is null or new.code = '' then
    new.code := next_player_code(new.academy_id);
  end if;
  return new;
end $$;

create trigger trg_players_set_code before insert on players
  for each row execute function set_player_code();

create or replace function set_payment_receipt_no() returns trigger language plpgsql as $$
begin
  if new.receipt_no is null or new.receipt_no = 0 then
    new.receipt_no := next_receipt_no(new.academy_id);
  end if;
  return new;
end $$;

create trigger trg_payments_set_receipt before insert on payments
  for each row execute function set_payment_receipt_no();

create or replace function set_attendance_lock() returns trigger language plpgsql as $$
declare v_minutes integer;
declare v_academy uuid;
begin
  select academy_id into v_academy from trainings where id = new.training_id;
  select coalesce((settings->>'attendance_lock_minutes')::integer, 25) into v_minutes
    from academies where id = v_academy;
  if new.locked_at is null then
    new.locked_at := new.recorded_at + (v_minutes || ' minutes')::interval;
  end if;
  return new;
end $$;

create trigger trg_attendance_lock before insert on attendance_records
  for each row execute function set_attendance_lock();

-- Update subscription status when payment changes
create or replace function recalc_subscription_status() returns trigger language plpgsql as $$
declare v_paid numeric(12,2); v_due numeric(12,2); v_id uuid;
begin
  v_id := coalesce(new.subscription_id, old.subscription_id);
  select coalesce(sum(amount), 0) into v_paid from payments where subscription_id = v_id;
  select amount_due into v_due from subscriptions where id = v_id;
  update subscriptions set
    amount_paid = v_paid,
    status = case
      when v_paid >= v_due then 'paid'
      when v_paid > 0 then 'partial'
      else 'unpaid'
    end
  where id = v_id;
  return null;
end $$;

create trigger trg_payments_recalc after insert or update or delete on payments
  for each row execute function recalc_subscription_status();

-- updated_at on academies
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_academies_touch before update on academies
  for each row execute function touch_updated_at();
