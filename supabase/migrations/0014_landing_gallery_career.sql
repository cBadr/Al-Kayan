-- ============================================================================
-- 0014 — Landing extensions: gallery, founder career timeline, achievements
-- ============================================================================

-- Extend settings with toggles + titles for the new sections
alter table landing_settings
  add column if not exists show_gallery boolean not null default true,
  add column if not exists gallery_section_title text,
  add column if not exists gallery_section_subtitle text,
  add column if not exists show_career boolean not null default true,
  add column if not exists career_section_title text,
  add column if not exists show_achievements boolean not null default true,
  add column if not exists achievements_section_title text;

-- Seed defaults for the new fields if row already exists
update landing_settings set
  gallery_section_title = coalesce(gallery_section_title, 'معرض الصور'),
  gallery_section_subtitle = coalesce(gallery_section_subtitle, 'لقطات من الميدان — تدريبات، مباريات، وإنجازات.'),
  career_section_title = coalesce(career_section_title, 'المسيرة المهنية'),
  achievements_section_title = coalesce(achievements_section_title, 'الإنجازات والمحطات البارزة')
where id = 1;

-- Gallery images
create table if not exists landing_gallery_images (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  title text,
  caption text,
  tag text,                                          -- single primary tag (filter chip)
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gallery_active_order_idx on landing_gallery_images (active, display_order);
create index if not exists gallery_tag_idx on landing_gallery_images (tag) where tag is not null;

-- Founder career stops (timeline)
create table if not exists landing_founder_career (
  id uuid primary key default uuid_generate_v4(),
  role text not null,                                -- المسمى الوظيفي
  organization text not null,                        -- اسم النادي/الأكاديمية
  period_label text,                                 -- "04-2018 → 06-2019" — نص حر
  description text,                                  -- شرح أو ملاحظة إضافية
  is_current boolean not null default false,         -- "حتى الآن"
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists career_active_order_idx on landing_founder_career (active, display_order);

-- Founder achievements
create table if not exists landing_founder_achievements (
  id uuid primary key default uuid_generate_v4(),
  icon text,                                         -- emoji
  title text not null,
  description text,
  year text,                                         -- e.g. "2024" or "2024/2025"
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists achievements_active_order_idx on landing_founder_achievements (active, display_order);

-- Touch updated_at
drop trigger if exists trg_gallery_touch on landing_gallery_images;
create trigger trg_gallery_touch before update on landing_gallery_images
  for each row execute function _touch_landing();

drop trigger if exists trg_career_touch on landing_founder_career;
create trigger trg_career_touch before update on landing_founder_career
  for each row execute function _touch_landing();

drop trigger if exists trg_achievements_touch on landing_founder_achievements;
create trigger trg_achievements_touch before update on landing_founder_achievements
  for each row execute function _touch_landing();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table landing_gallery_images enable row level security;
alter table landing_founder_career enable row level security;
alter table landing_founder_achievements enable row level security;

create policy "lg_read_public" on landing_gallery_images for select using (true);
create policy "lg_write" on landing_gallery_images for all
  using (is_super_admin()) with check (is_super_admin());

create policy "lc_read_public" on landing_founder_career for select using (true);
create policy "lc_write" on landing_founder_career for all
  using (is_super_admin()) with check (is_super_admin());

create policy "la_read_public" on landing_founder_achievements for select using (true);
create policy "la_write" on landing_founder_achievements for all
  using (is_super_admin()) with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- Seed: Founder career from CV
-- ----------------------------------------------------------------------------
insert into landing_founder_career (role, organization, period_label, description, is_current, display_order)
values
  ('إداري قطاع البراعم — فئة (أ)', 'نادي النصر الرياضي بمصر الجديدة', '02-2024 → الآن', 'إدارة قطاع البراعم فئة (أ) — تنظيم التدريبات والمباريات ومتابعة اللاعبين الفنية والإدارية.', true, 0),
  ('مدير إداري الفريق الأول — القسم الثالث', 'نادي بهتيم الرياضي — موسم 2024/2025', '03-2025 → الآن', 'مدير إداري الفريق الأول لنادي بهتيم بالقسم الثالث — تنسيق كامل بين الجهازَين الفني والإداري.', true, 1),
  ('إداري قطاع البراعم', 'نادي بهتيم الرياضي', '03-2019 → 09-2024', 'سنوات من العمل المستمر في قطاع البراعم — بناء قاعدة بيانات اللاعبين وتطوير المنظومة الإدارية.', false, 2),
  ('إداري', 'أكاديمية النسور — بإدارة كابتن إكرامي بصل', '04-2018 → 06-2019', 'البداية المهنية مع الكابتن محمود عبد الحميد (فرنس) — إدارة العمليات اليومية للأكاديمية.', false, 3)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Seed: Founder achievements
-- ----------------------------------------------------------------------------
insert into landing_founder_achievements (icon, title, description, year, display_order)
values
  ('🎓', 'بكالوريوس تجارة', 'جامعة عين شمس — معهد أزهري', '2015 - 2019', 0),
  ('⚽', '+8 سنوات خبرة ميدانية', 'إدارة الفئات العمرية المختلفة (براعم، ناشئين، فريق أول) في عدة أندية مصرية.', 'منذ 2018', 1),
  ('🏆', 'تنظيم منظومة إدارية متكاملة', 'بناء قواعد بيانات اللاعبين، الجداول التدريبية، ومتابعة المستوى بشكل دوري.', null, 2),
  ('🤝', 'إدارة شؤون اللاعبين وأولياء الأمور', 'التنسيق بين الأجهزة الفنية والإدارية لتحقيق أفضل النتائج.', null, 3),
  ('🚀', 'تأسيس منصة سلامة', 'تحويل الخبرة الميدانية إلى نظام عربي متكامل لإدارة أكاديميات كرة القدم.', '2026', 4)
on conflict do nothing;
