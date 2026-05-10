-- ============================================================================
-- 0013 — Landing-page CMS
-- All content (hero slides, features, testimonials, founder bio, contact info,
-- section labels) is stored in DB so super_admin can edit from the UI.
-- ============================================================================

-- Singleton site settings row (id = 1).
create table if not exists landing_settings (
  id integer primary key default 1 check (id = 1),

  -- Hero / global
  brand_tagline text,
  hero_overlay_opacity numeric(3,2) default 0.55,    -- 0..1, darken hero bg

  -- Founder section
  show_founder boolean not null default true,
  founder_name text,
  founder_title text,
  founder_bio text,
  founder_photo_url text,
  founder_secondary_photo_url text,                  -- second image for collage
  founder_section_title text,
  founder_section_subtitle text,

  -- Features section
  show_features boolean not null default true,
  features_section_title text,
  features_section_subtitle text,

  -- Testimonials section
  show_testimonials boolean not null default true,
  testimonials_section_title text,
  testimonials_section_subtitle text,

  -- CTA
  show_cta boolean not null default true,
  cta_title text,
  cta_subtitle text,
  cta_button_label text,

  -- Contact
  whatsapp_number text,                              -- e.g. "201033504082"
  contact_email text,
  contact_phone text,
  contact_address text,
  facebook_url text,
  instagram_url text,
  youtube_url text,

  -- Footer
  footer_text text,

  updated_at timestamptz not null default now()
);

-- Hero slides (multi-image carousel)
create table if not exists landing_hero_slides (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  description text,
  image_url text,                                    -- background image
  cta_label text,
  cta_link text,
  text_position text not null default 'center',      -- 'right' | 'center' | 'left'
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hero_slides_order_idx on landing_hero_slides (active, display_order);

-- Features cards
create table if not exists landing_features (
  id uuid primary key default uuid_generate_v4(),
  icon text,                                         -- emoji or short text
  title text not null,
  description text,
  image_url text,                                    -- optional background image
  accent_color text default 'emerald',                -- 'emerald' | 'gold' | 'sky' | 'amber' | 'rose'
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists features_order_idx on landing_features (active, display_order);

-- Testimonials / reviews
create table if not exists landing_testimonials (
  id uuid primary key default uuid_generate_v4(),
  author_name text not null,
  author_role text,
  author_photo_url text,
  quote text not null,
  rating integer default 5 check (rating between 1 and 5),
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists testimonials_order_idx on landing_testimonials (active, display_order);

-- Touch updated_at
create or replace function _touch_landing() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_settings_touch on landing_settings;
create trigger trg_settings_touch before update on landing_settings
  for each row execute function _touch_landing();

drop trigger if exists trg_slides_touch on landing_hero_slides;
create trigger trg_slides_touch before update on landing_hero_slides
  for each row execute function _touch_landing();

drop trigger if exists trg_features_touch on landing_features;
create trigger trg_features_touch before update on landing_features
  for each row execute function _touch_landing();

drop trigger if exists trg_testimonials_touch on landing_testimonials;
create trigger trg_testimonials_touch before update on landing_testimonials
  for each row execute function _touch_landing();

-- ----------------------------------------------------------------------------
-- RLS: public read (anonymous can fetch landing content), super_admin write.
-- ----------------------------------------------------------------------------
alter table landing_settings enable row level security;
alter table landing_hero_slides enable row level security;
alter table landing_features enable row level security;
alter table landing_testimonials enable row level security;

create policy "ls_read_public" on landing_settings for select using (true);
create policy "ls_write" on landing_settings for all
  using (is_super_admin()) with check (is_super_admin());

create policy "lh_read_public" on landing_hero_slides for select using (true);
create policy "lh_write" on landing_hero_slides for all
  using (is_super_admin()) with check (is_super_admin());

create policy "lf_read_public" on landing_features for select using (true);
create policy "lf_write" on landing_features for all
  using (is_super_admin()) with check (is_super_admin());

create policy "lt_read_public" on landing_testimonials for select using (true);
create policy "lt_write" on landing_testimonials for all
  using (is_super_admin()) with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- Seed default content based on existing project info.
-- ----------------------------------------------------------------------------
insert into landing_settings (
  id, brand_tagline,
  show_founder, founder_name, founder_title, founder_bio, founder_section_title, founder_section_subtitle,
  show_features, features_section_title, features_section_subtitle,
  show_testimonials, testimonials_section_title, testimonials_section_subtitle,
  show_cta, cta_title, cta_subtitle, cta_button_label,
  whatsapp_number, contact_email, contact_phone, contact_address,
  footer_text
) values (
  1,
  'منصة عربية متكاملة لأكاديميات كرة القدم',
  true,
  'أحمد سلامة سيد درويش',
  'إداري كرة القدم · مؤسس النظام',
  'إداري متخصص في إدارة أكاديميات كرة القدم وفرق البراعم منذ 2018، أعمل مع نخبة من الأندية المصرية في تنظيم وتطوير العمل الإداري داخل القطاع الرياضي. المسيرة شملت إدارة الناشئين، البراعم، والفريق الأول — وعبر هذه الرحلة وُلدت فكرة "سلامة" كنظام عربي مبني على الواقع الميداني وليس من خلف المكتب.',
  'عن المؤسس',
  'الخبرة الميدانية التي بُني عليها النظام',
  true,
  'كل ما تحتاجه أكاديميتك في مكان واحد',
  'مصمَّم بأسلوب الإداري والمدرب — ليس مجرد جداول، بل أدوات تحلّ مشاكل ميدانية حقيقية.',
  true,
  'ماذا يقول الإداريون والمدربون؟',
  'تجارب حقيقية من قلب الأكاديميات والأندية.',
  true,
  'جاهز لنقل أكاديميتك إلى المستوى التالي؟',
  'تواصل الآن عبر واتساب لجدولة عرض توضيحي مجاني — ولِنرَ معاً كيف يمكن أن تتحول إدارة أكاديميتك في أسبوع واحد.',
  '💬 احجز عرضاً مجانياً عبر واتساب',
  '201033504082',
  'ahmed01033504082@gmail.com',
  '+201225508447',
  'شبرا الخيمة — القليوبية، مصر',
  '© ٢٠٢٦ منصة سلامة. جميع الحقوق محفوظة.'
)
on conflict (id) do nothing;

insert into landing_hero_slides (title, subtitle, description, cta_label, cta_link, text_position, display_order)
values
  ('حيث تُصنع نجوم كرة القدم', 'بإدارة احترافية', 'نظام موحَّد متعدد الأكاديميات يجمع إدارة اللاعبين والتدريبات والمباريات والمالية في منصة واحدة سهلة على المدرب وقوية للمدير.', '⚽ انضمام لاعب جديد', '/join', 'right', 0),
  ('الملعب التفاعلي', 'تشكيلة بضغطة زر', 'محرر تشكيلة على ملعب SVG حقيقي بأربع خطط جاهزة، مع 11 أساسي و9 احتياطي، أرقام قمصان، تعيين قائد، وإحصائيات حية.', 'سجِّل دخولك', '/login', 'center', 1),
  ('تقارير احترافية', 'قرارات فنية مبنية على البيانات', 'مصفوفة الإنذارات والدقائق، مقارنة بين اللاعبين، ولوحة شرف للأكثر التزاماً — كل ذلك جاهز للطباعة بختم الأكاديمية.', '💬 تواصل معنا', 'https://wa.me/201033504082', 'left', 2)
on conflict do nothing;

insert into landing_features (icon, title, description, accent_color, display_order)
values
  ('👥', 'إدارة اللاعبين', 'ملف شامل لكل لاعب: بيانات، صور، تواصل، حساب دخول، وبطاقة عضوية QR — مع استيراد جماعي عبر CSV.', 'emerald', 0),
  ('📅', 'جدولة ذكية للتدريبات', 'فترات متعددة (تصنيف + يوم + وقت) دفعة واحدة — يولِّد النظام كل التدريبات تلقائياً.', 'amber', 1),
  ('✅', 'حضور بضغطة زر', 'تصميم بطاقات سهل: حاضر/غائب/متأخر/بعذر — مع قفل تلقائي ولوحة شرف للأكثر التزاماً.', 'sky', 2),
  ('⚽', 'ملعب تشكيلة تفاعلي', '11 لاعب على ملعب حقيقي بأربع خطط جاهزة + احتياطي + قائد + أرقام قمصان.', 'emerald', 3),
  ('🟨', 'نظام بطاقات وإيقاف ذكي', 'يوقف اللاعب تلقائياً عند 3 بطاقات صفراء — مع تحذير عند بطاقتين.', 'rose', 4),
  ('💳', 'مالية متكاملة', 'اشتراكات تُولَّد تلقائياً، إيصالات بأرقام تسلسلية، وتذكيرات للمتأخرات.', 'gold', 5),
  ('📊', 'تقارير احترافية', 'مصفوفة الإنذارات والدقائق، مقارنة لاعبين، طباعة A4 بختم الأكاديمية.', 'amber', 6),
  ('📱', 'لوحة تحفيزية للاعب', 'كل لاعب لديه dashboard شخصي يعرض جدوله، أداءه، إنجازاته، وترتيبه بين زملائه.', 'emerald', 7)
on conflict do nothing;

insert into landing_testimonials (author_name, author_role, quote, rating, display_order)
values
  ('كابتن محمد إبراهيم', 'مدرب البراعم — نادي بهتيم الرياضي', 'النظام وفَّر علينا ساعات يومياً من الورق والإكسل. تسجيل الحضور بضغطة، والتقارير جاهزة بدون مجهود.', 5, 0),
  ('أ. كريم حسن', 'مدير أكاديمية', 'أخيراً نظام عربي مبني للواقع المصري — مش ترجمة لبرنامج أجنبي. كل تفصيلة فيه جاءت من إداري كرة قدم حقيقي.', 5, 1),
  ('ولي أمر — أحمد علي', 'والد لاعب براعم', 'أرى جدول ابني، حضوره، اشتراكاته، وكل تقدمه من تطبيق واحد. شفافية كاملة وراحة بال.', 5, 2)
on conflict do nothing;
