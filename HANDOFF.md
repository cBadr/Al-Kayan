# Salama-03 — وثيقة المشروع الشاملة (Handoff)

> **مرجع شامل** لنظام إدارة أكاديميات كرة القدم (سلامة). هذه الوثيقة هي المرجع الأول قبل أي تطوير لاحق — تشرح المعمارية، قواعد البيانات، تدفقات العمل، التشغيل، وقواعد العمل المعتمدة.

**آخر تحديث:** 2026-05-01 · **حالة المشروع:** قيد الإنتاج النشط

---

## 📋 جدول المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [الحزمة التقنية (Tech Stack)](#-الحزمة-التقنية)
3. [المعمارية العامة](#-المعمارية-العامة)
4. [نموذج البيانات (Database Schema)](#-نموذج-البيانات)
5. [نظام الصلاحيات (RBAC + RLS)](#-نظام-الصلاحيات)
6. [دورة المستخدم (User Lifecycle)](#-دورة-المستخدم)
7. [قواعد العمل المعتمدة](#-قواعد-العمل)
8. [هيكل المسارات (Routes)](#-هيكل-المسارات)
9. [الميزات حسب الوحدة](#-الميزات-حسب-الوحدة)
10. [التخزين (Storage)](#-التخزين)
11. [الخدمات الخارجية](#-الخدمات-الخارجية)
12. [التصميم والتجاوب](#-التصميم-والتجاوب)
13. [الطباعة والمستندات](#-الطباعة-والمستندات)
14. [التشغيل والنشر](#-التشغيل-والنشر)
15. [الـ Migrations](#-الـ-migrations)
16. [القيود المعروفة (Known Limitations)](#-القيود-المعروفة)
17. [أعمال مستقبلية مقترحة](#-أعمال-مستقبلية)
18. [مرجع التطوير السريع](#-مرجع-التطوير-السريع)

---

## 🎯 نظرة عامة

### المشكلة التي يحلّها النظام

أكاديميات كرة القدم (خصوصاً في مصر والمنطقة) تعاني من:
- إدارة لاعبين على الورق أو إكسل غير مترابط
- عدم وجود تتبع منهجي للحضور/الغياب
- صعوبة جدولة التدريبات الأسبوعية متعددة القطاعات
- فقدان بيانات المباريات (الأداء، البطاقات، التشكيلات)
- عدم وضوح المالية (التحصيلات، المتأخرات، المصروفات)
- صعوبة إصدار تقارير وبطاقات اللاعبين

### الحل

تطبيق Web متعدد المستأجرين (Multi-tenant) يدعم عدة أكاديميات في نفس النظام، مع 4 أدوار: super_admin, academy_manager, coach, player.

### اللغة والاتجاه

- اللغة الأساسية: **العربية (RTL)**
- جميع النصوص بالعربية
- التواريخ: ميلادي (Gregorian) افتراضياً، قابل للتعديل في إعدادات الأكاديمية
- العملة: حسب الأكاديمية (الافتراضي: ج.م)

### الـ Branding

- اسم النظام: **سلامة (Salama)**
- اللون الأساسي: Emerald (أخضر داكن `#065f46`)
- اللون المُحفِّز: Gold (`#fbbf24`)

---

## 🛠 الحزمة التقنية

### Frontend
- **Next.js 16.2.4** (App Router) ⚠️ *إصدار حديث جداً، APIs قد تختلف عن Next 14/15*
- **React 19.2.4** (Server Components + Client Components)
- **TypeScript 5.x** (strict mode)
- **Tailwind CSS 4.x** (مع PostCSS)
- **Radix UI** primitives (Dialog, Select, Tabs, Popover, etc.)
- **Recharts 3.x** (للرسوم البيانية في التقارير)
- **@tanstack/react-query 5.x** (للاستعلامات في حالات محدودة)
- **@tanstack/react-table 8.x** (للجداول المعقدة)
- **react-hook-form 7.x** + **zod 4.x** (للتحقق من النماذج)
- **date-fns 4.x** (للتعامل مع التواريخ)
- **lucide-react 1.x** (الأيقونات)

### Backend / Database
- **Supabase** (PostgreSQL 15+ + Auth + Storage + Realtime)
- **@supabase/ssr 0.10** (لـ Next.js App Router)
- **@supabase/supabase-js 2.x**
- **PostgreSQL functions + triggers** للقواعد الصارمة

### Email / Messaging
- **Resend 6.x** (للإشعارات بالبريد)
- **WhatsApp Cloud API** (اختياري — وحدة `lib/whatsapp.ts`)

### Other
- **exceljs 4.4** (لتصدير Excel)
- **qrcode 1.5** (لبطاقات اللاعبين بـ QR)

### إصدارات Node / Build
- Node ≥ 20
- Build: `npm run build` → Vercel/أي مضيف Node
- Dev: `npm run dev` (port 3000)
- Tests: `npm run test` (Vitest)

> ⚠️ **هام:** المشروع يستخدم Next.js 16 (إصدار جديد جداً). قبل أي تطوير، اقرأ التوثيق المحلي في `node_modules/next/dist/docs/` لأن الـ APIs قد تختلف عن ما تعرفه عن Next 14/15.

---

## 🏗 المعمارية العامة

### البنية الكلية

```
┌──────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                              │
┌───────▼────────┐                          ┌─────────▼─────────┐
│  Next.js App   │                          │   Supabase Cloud   │
│   (App Router) │◄────────HTTPS────────────►│                   │
│                │                          │  ┌──────────────┐ │
│  - SSR Pages   │                          │  │  PostgreSQL  │ │
│  - Server Acts │                          │  │   + RLS      │ │
│  - Middleware  │                          │  └──────────────┘ │
│  - API Routes  │                          │  ┌──────────────┐ │
│                │                          │  │     Auth     │ │
│                │                          │  └──────────────┘ │
└───────┬────────┘                          │  ┌──────────────┐ │
        │                                   │  │   Storage    │ │
        │                                   │  └──────────────┘ │
        │                                   └────────────────────┘
        │
   ┌────▼─────┐    ┌──────────┐
   │  Resend  │    │ WhatsApp │
   │ (Email)  │    │  Cloud   │
   └──────────┘    └──────────┘
```

### الأنماط المعمارية الأساسية

1. **Server Components افتراضياً** — كل صفحة (`page.tsx`) تجلب البيانات على السيرفر مباشرة عبر `createClient()`.
2. **Server Actions** للكتابة — كل تعديل يمر عبر `"use server"` function، لا توجد API routes للكتابة (ما عدا cron webhooks).
3. **Client Components فقط للتفاعل** — يُستخدم `"use client"` للحقول التفاعلية، Forms مع state، modals، إلخ.
4. **Row-Level Security** — قاعدة الأمان الرئيسية. كل السياسات في `0002_rls.sql`. التطبيق لا يفترض الأمان من الـ frontend.
5. **Multi-tenancy عبر `academy_id`** — كل جدول رئيسي له `academy_id` ويُفلتر تلقائياً عبر RLS.
6. **Service-role client للعمليات الإدارية** — `createAdminClient()` (في `lib/supabase/admin.ts`) لتجاوز RLS عند الحاجة (مثل: إدارة المستخدمين، رفع الصور).

### تنظيم الكود

```
app/
├── academy/[academyId]/         # الواجهة المُحاسَب عليها (multi-tenant)
│   ├── layout.tsx               # AppShell + sidebar + auth check
│   ├── page.tsx                 # Dashboard الأكاديمية
│   ├── players/                 # إدارة اللاعبين
│   ├── categories/              # التقسيمات/التصنيفات
│   ├── trainings/               # التدريبات + Scheduler ذكي
│   ├── attendance/              # الحضور والغياب
│   ├── matches/                 # المباريات + التشكيلة على الملعب
│   ├── reports/                 # تقارير اللاعبين
│   ├── finance/                 # المالية (4 sub-routes)
│   │   ├── dashboard/
│   │   ├── subscriptions/[subId]/
│   │   ├── receipts/[paymentId]/
│   │   ├── expenses/
│   │   └── revenues/
│   ├── notifications/
│   ├── join-requests/
│   ├── audit/
│   ├── assets/
│   └── settings/
├── super-admin/                 # واجهة المدير الأعلى
│   ├── academies/
│   ├── users/
│   ├── reports/
│   └── settings/
├── me/                          # لوحة تحكم اللاعب
│   ├── page.tsx
│   ├── me-dashboard.tsx         # Client component مع side nav
│   ├── profile-form.tsx
│   ├── password-form.tsx
│   ├── actions.ts
│   └── print/
├── join/[slug]/                 # نموذج التسجيل العام (public)
├── login/
├── forgot-password/
├── reset-password/
├── scan/                        # QR code scanner
└── api/cron/overdue/            # webhook للتذكيرات التلقائية

components/
├── app-shell.tsx                # Layout الرئيسي (sidebar + header)
├── mobile-nav.tsx               # Drawer للموبايل/اللوحي
├── print-button.tsx             # زر طباعة عام
├── stat-card.tsx
├── attendance-trend.tsx         # رسم بياني للحضور
├── notifications-bell.tsx
├── trainings-calendar.tsx
├── logo.tsx
├── logout-button.tsx
└── ui/                          # Radix-based primitives
    ├── button.tsx, input.tsx, label.tsx, card.tsx,
    ├── badge.tsx, table.tsx, dialog.tsx, etc.

lib/
├── supabase/
│   ├── client.ts                # browser client
│   ├── server.ts                # SSR client (cookies)
│   └── admin.ts                 # service-role client
├── auth/rbac.ts                 # requireUser, requireAcademyManager, etc.
├── storage.ts                   # signedUrl, signedUrlMap
├── uploads.ts                   # uploadImage, uploadIfPresent
├── utils.ts                     # formatCurrency, formatDate, cn
├── app-settings.ts              # global app settings
└── whatsapp.ts                  # WhatsApp Cloud API integration

types/
└── database.ts                  # generated DB types

supabase/
└── migrations/                  # 0001 → 0010 (10 migrations)
```

---

## 💾 نموذج البيانات

### الجداول الأساسية (Core)

#### `academies`
الأكاديمية الرئيسية (multi-tenant root). كل البيانات الأخرى تنتمي لأكاديمية.
```
id (uuid, PK)
slug (unique) — للوصول العام عبر /join/[slug]
name, logo_url, address, phone, whatsapp, email
seal_url, manager_signature_url, manager_name  -- 0009: للمستندات الرسمية
settings (jsonb) — attendance_lock_minutes, required_fields, notification_channels, ...
cycle_days (int) — مدة دورة الاشتراك
created_at, updated_at
```

#### `profiles`
ملحق على `auth.users` لمعلومات إضافية.
```
id (uuid, PK, FK → auth.users)
full_name, phone, avatar_url
```

#### `memberships`
الربط بين المستخدم والأكاديمية والدور. **هذا هو مفتاح الصلاحيات.**
```
id (uuid, PK)
user_id (FK → auth.users)
academy_id (FK → academies, nullable لـ super_admin)
role (enum: super_admin, academy_manager, coach, player)
unique(user_id, academy_id, role)
```

#### `categories` (التقسيمات)
```
id (uuid, PK)
academy_id (FK)
name (unique within academy)
monthly_fee (numeric)
age_min, age_max
active (boolean)
```

#### `players`
```
id (uuid, PK)
academy_id (FK)
user_id (FK → auth.users, nullable) — يُملأ عند تفعيل الحساب
code (text) — يُولَّد تلقائياً 000001+ عبر trigger
category_id (FK)
full_name, birth_date, phone, email, national_id
guardian_name, guardian_phone
photo_url, id_doc_url
position (enum: GK/DF/MF/FW)  -- 0006
preferred_jersey (int 1-99)   -- 0006
status (enum: active/suspended/archived)
yellow_cycle_reset_at         -- 0007: لقاعدة 3 إنذارات
suspension_reason             -- 0007
notes, joined_at
unique(academy_id, code)
```

### التدريبات والحضور

#### `trainings`
```
id (uuid, PK)
academy_id (FK)
category_id (FK, nullable — null = للجميع)
scheduled_at (timestamptz)
duration_min (default 90)
location, notes
```

#### `attendance_records`
```
id (uuid, PK)
training_id (FK)
player_id (FK)
status (enum: present/absent/late/excused)  -- 0005 added 'excused'
recorded_by (FK → auth.users)
recorded_at, locked_at  -- يُحسب تلقائياً من academy_settings.attendance_lock_minutes
unique(training_id, player_id)
```

### المباريات والتشكيلة

#### `matches`
```
id (uuid, PK)
academy_id (FK)
opponent (text)
match_date (timestamptz)
match_type (enum: home/away)             -- 0006
venue, formation                          -- 0006: e.g. "4-3-3"
duration_min                              -- 0004
our_score, their_score
referee_name, referee_phone               -- 0006
assistant1_name, assistant1_phone         -- 0006
assistant2_name, assistant2_phone         -- 0006
observer_name, observer_phone             -- 0010
notes
```

#### `match_participations`
```
id (uuid, PK)
match_id (FK)
player_id (FK)
lineup_role (enum: starting/bench/unused) -- 0006
pitch_position (enum: GK/DF/MF/FW)        -- 0006
pitch_x, pitch_y (numeric 0-100)          -- 0006: إحداثيات على الملعب
jersey_number (int)
is_captain (boolean)
goals, yellow_cards, red_cards, sent_off
minutes_played                            -- 0004
notes
unique(match_id, player_id)
```

### المالية

#### `subscriptions`
```
id (uuid, PK)
academy_id, player_id (FK)
period_year (int), period_month (int 1-12)
amount_due, amount_paid (numeric)
status (enum: unpaid/partial/paid/overdue)
due_date
unique(player_id, period_year, period_month)
```

#### `payments`
```
id (uuid, PK)
academy_id, subscription_id (FK)
amount (numeric, > 0)
paid_at, method
receipt_no (int) — يُولَّد تلقائياً 1000001+
recorded_by, notes
unique(academy_id, receipt_no)
```

> **Trigger مهم:** `recalc_subscription_status` يُحدِّث `subscriptions.amount_paid + status` تلقائياً عند أي تغيير في `payments`.

#### `expense_categories`, `expenses`, `extra_revenues`
بنية معيارية، مع علاقة `expenses.category_id → expense_categories ON DELETE SET NULL`.

### الإصابات والإشعارات

#### `injuries`
```
player_id (FK)
source (enum: training/match)
source_match_id, source_training_id (FK, nullable)
injury_type, body_location
occurred_at, expected_return_at
notes
```

#### `notifications`
```
academy_id, recipient_user_id (nullable لـ broadcasts)
recipient_group (text — مثل "category:UUID" أو "expiring:7d")
channel (enum: in_app/email/whatsapp)
title, body, payload (jsonb)
status (enum: queued/sent/failed)
scheduled_at, sent_at, read_at
```

### Audit + Assets + Reports

- `audit_log` — كل العمليات الحساسة (إنشاء/تعديل/حذف/إيقاف لاعب) تُسجَّل هنا.
- `assets` — الأصول الثابتة (كرات، أدوات) مع QR code.
- `report_schedules` — جدول التقارير الدورية.

### Views (في `0003_views.sql`, `0006`, `0007`)

- **`player_attendance_summary`** — نسبة الحضور لكل لاعب
- **`player_match_summary`** — أهداف/بطاقات/مباريات لكل لاعب
- **`player_roi`** — اشتراك مقابل ساعات الحضور
- **`player_match_stats`** — إحصائيات المباريات (مع minutes) — *0006*
- **`match_team_totals`** — إحصائيات الفريق لكل مباراة (للتقارير) — *0006*
- **`player_discipline`** — البطاقات النشطة + الكلية + الإيقافات — *0007*
- **`academy_finance_summary`** — إجمالي التحصيل/المتأخرات/المصروفات/صافي الربح
- **`academy_current_collection`** — معدل التحصيل للشهر الحالي

### Functions

- `next_player_code(academy)` → text — يُولِّد كود لاعب فريد per-academy
- `next_receipt_no(academy)` → int — يُولِّد رقم إيصال فريد
- `set_attendance_lock()` — trigger يُحسِّب `locked_at` بناءً على إعدادات الأكاديمية
- `recalc_subscription_status()` — trigger يُحدِّث حالة الاشتراك بعد كل دفعة
- `active_yellow_card_count(player)` — يُحسِّب البطاقات النشطة (بعد آخر إعادة تعيين)
- `check_yellow_card_threshold()` — trigger يوقف اللاعب تلقائياً عند 3 صفراء
- `recompute_player_suspensions(academy)` — للتطبيق على البيانات السابقة
- `reactivate_player(player)` — security definer — يفعِّل لاعباً موقوفاً ويعيد تعيين دورة الإنذارات

---

## 🔐 نظام الصلاحيات

### الأدوار (4 أدوار)

| الدور | الصلاحيات |
|---|---|
| `super_admin` | كل شيء، عبر كل الأكاديميات. لا يحتاج `academy_id` في membership. |
| `academy_manager` | كامل التحكم في أكاديميته فقط (إدارة لاعبين، مالية، إعدادات). |
| `coach` | يقرأ بيانات الأكاديمية، يسجل الحضور، يدير التشكيلة في المباريات. |
| `player` | يقرأ بياناته فقط (تدريباته، مبارياته، اشتراكاته)، يُحدِّث ملفه. |

### مكتبة RBAC (`lib/auth/rbac.ts`)

```typescript
getCurrentUser(): CurrentUser | null
requireUser(): CurrentUser                    // → /login إن لم يوجد
requireRole(roles[]): CurrentUser              // → / إن لا يطابق
requireSuperAdmin(): CurrentUser
requireAcademyAccess(academyId): CurrentUser   // كل الأدوار في الأكاديمية
requireAcademyManager(academyId): CurrentUser  // manager + super_admin فقط
```

كل صفحة في `app/academy/[academyId]/` تستدعي `requireAcademyAccess` أو `requireAcademyManager` في أول سطر.

### Row-Level Security (RLS)

- **مفعَّل على كل الجداول الحساسة** (راجع `0002_rls.sql`).
- **النمط الأساسي:**
  - `read`: `is_super_admin() OR academy_id IN (SELECT user_academies())`
  - `write`: `manages_academy(academy_id)` — manager فقط
  - استثناءات للاعبين على اشتراكاتهم/مدفوعاتهم
- **Helper functions** (security definer): `is_super_admin()`, `user_academies()`, `manages_academy(academy)`, `is_coach(academy)`.
- **`join_requests`**: يسمح بـ `INSERT` للعموم (لنموذج التسجيل العام)، لكن `SELECT/UPDATE` للمدير فقط.

### تدفق المصادقة (Auth Flow)

1. **تسجيل اللاعب الجديد:**
   - من `/join/[slug]` → ينشئ auth user + join_request (status: pending)
   - الإدمن يوافق من `/academy/[id]/join-requests` → ينشئ player record + يربط user_id + ينشئ membership
2. **تفعيل لاعب موجود (admin-created):**
   - عند إنشاء لاعب من `/players/new` (إجباري الآن) → يُنشأ auth user مع كلمة مرور
   - أو لاحقاً من `/players/[id]/edit` → بطاقة "تفعيل الحساب" مع توليد كلمة مرور
3. **تسجيل الدخول:** `/login` → يُحوَّل تلقائياً حسب الدور (manager → /academy/[id]، player → /me)
4. **استعادة كلمة المرور:** `/forgot-password` → بريد بـ Magic Link → `/reset-password`
5. **تغيير كلمة المرور:** من `/me` (الإعدادات) أو من `/super-admin/users` (للإدمن)

---

## 🔄 دورة المستخدم

### دورة اللاعب (Player Lifecycle)

```
[تسجيل ذاتي / إنشاء بواسطة الإدمن]
        │
        ▼
   [حساب Auth + سجل player]
        │
        ▼
   [membership بدور 'player']
        │
        ▼
┌─────────────────────────────────────┐
│  /me — لوحة تحكم اللاعب              │
│  - رؤية الجدول (تدريبات + مباريات)   │
│  - رؤية أدائه (أهداف، حضور، بطاقات) │
│  - رؤية ترتيبه بين زملائه           │
│  - الإنجازات والشارات               │
│  - تحديث بياناته (تواصل + صورة)     │
│  - تغيير كلمة المرور                │
│  - طباعة بطاقته                     │
└─────────────────────────────────────┘
        │
        │  [يحضر تدريب]            [يلعب مباراة]
        │       │                       │
        │       ▼                       ▼
        │  [attendance_record]   [match_participation]
        │       │                       │
        │       │                       │
        │       │                       │ ┌─────────────────────────┐
        │       │                       └►│  3 بطاقات صفراء         │
        │       │                         │  → trigger يوقف اللاعب  │
        │       │                         │  → suspension_reason    │
        │       │                         └─────────────────────────┘
        │       │                                   │
        │       │                                   ▼
        │       │                         [الإدمن يفعِّل اللاعب]
        │       │                                   │
        │       │                                   ▼
        │       │                         [reactivate_player()]
        │       │                         [يعيد تعيين yellow_cycle_reset_at]
        │       │
        │       ▼
        │  [حُسبت في إحصائيات الحضور]
        │
        ▼
[في نهاية دورة الاشتراك → subscription record جديد]
```

### دورة المدرب (Coach)

- يدخل يومياً → يصل لقائمة التدريبات
- يفتح الحضور → يسجل بضغطة زر (مع locked_at للحماية)
- يفتح المباراة → يحدد التشكيلة على الملعب + يسجل الإحصائيات

### دورة المدير (Academy Manager)

- يضيف اللاعبين (يدوياً أو CSV bulk)
- يصمم جدول التدريبات الأسبوعي (متعدد التصنيفات)
- يدير الطلبات (موافقة/رفض)
- يدير المالية (تحصيل، مصروفات، إيرادات إضافية)
- يصدر التقارير الرياضية والمالية

---

## 📜 قواعد العمل المعتمدة

### قاعدة 1: قفل تسجيل الحضور
- بعد تسجيل الحضور، يُحسَب `locked_at = recorded_at + academy.attendance_lock_minutes` (افتراضي 25 دقيقة).
- **المدرب لا يستطيع التعديل بعد القفل**، الإدمن فقط (مع تسجيل audit log + امتداد القفل 30 دقيقة إضافية).

### قاعدة 2: 3 بطاقات صفراء = إيقاف تلقائي 🟨🟨🟨
- عند بلوغ المجموع 3 بطاقات صفراء (منذ آخر إعادة تعيين)، يُوقف اللاعب تلقائياً (`status = 'suspended'`).
- `suspension_reason = 'auto: N yellow cards'`
- عند تفعيل الإدمن للاعب: `yellow_cycle_reset_at = now()` → البطاقات السابقة لا تُحسب.
- يظهر **تحذير عند بطاقتين** على ملف اللاعب وفي تقاريره.

### قاعدة 3: حد التشكيلة
- الفريق الأساسي: **11 لاعب كحد أقصى**.
- الفريق الاحتياطي: **9 لاعبين كحد أقصى**.
- المُتحقَّق من ذلك في `setLineup()` server action.

### قاعدة 4: توليد الأكواد
- كود اللاعب (`players.code`): 6 أرقام تبدأ من `000001` per-academy.
- رقم الإيصال (`payments.receipt_no`): يبدأ من `1000001` per-academy.
- كلاهما عبر sequences في `academy_sequences` + triggers.

### قاعدة 5: حذف اللاعب
- جميع البيانات المرتبطة (الحضور، المشاركات، الاشتراكات، الإصابات) تُحذَف معه (`ON DELETE CASCADE`).
- `join_requests.created_player_id` يُصبح NULL (`ON DELETE SET NULL` بعد إصلاح 0004).

### قاعدة 6: الاشتراكات والإيصالات
- الإيصال يُولَّد تلقائياً عند تسجيل اللاعب وعند نهاية كل دورة (cron job في `/api/cron/overdue/`).
- حالة الاشتراك تُحدَّث تلقائياً عند كل `payment` insert/update/delete.
- المتأخرات: subscriptions `status != 'paid' AND due_date < today`.

### قاعدة 7: التذكيرات الدورية
- إعدادات الأكاديمية (`overdue_reminders`) تتحكم بـ:
  - `every_days`: تكرار التذكير (افتراضي 7)
  - `before_due_days`: تذكير قبل الاستحقاق (افتراضي 3)
  - `final_after_days`: تذكير نهائي بعد الاستحقاق (افتراضي 30)

---

## 🗺 هيكل المسارات

### المسارات العامة (Public)
- `/` — صفحة هبوط
- `/login`, `/forgot-password`, `/reset-password`
- `/join/[slug]` — نموذج تسجيل لاعب جديد للأكاديمية
- `/join/[slug]/thanks` — صفحة شكر
- `/scan` — قارئ QR للأصول

### مسارات اللاعب (`/me`)
- `/me` — Dashboard مع side-nav (9 أقسام)
- `/me/print` — طباعة بطاقة احترافية A4

### مسارات الأكاديمية (`/academy/[academyId]/...`)

| المسار | الوصف |
|---|---|
| `/` | Dashboard الأكاديمية |
| `/players` | قائمة اللاعبين (مع تحديد متعدد + bulk actions) |
| `/players/new` | إضافة لاعب (إجباري كلمة مرور) |
| `/players/import` | استيراد CSV (12 عمود) |
| `/players/[id]` | ملف اللاعب |
| `/players/[id]/edit` | تعديل + بطاقة دعوة |
| `/players/[id]/card` | بطاقة العضوية مع QR |
| `/players/[id]/print` | طباعة الملف A4 |
| `/categories` | إدارة التقسيمات |
| `/trainings` | جدولة التدريبات (Smart Weekly Scheduler) |
| `/attendance` | تسجيل الحضور (مع لوحة شرف) |
| `/matches` | قائمة المباريات (بطاقات) |
| `/matches/[id]` | تفاصيل المباراة + التشكيلة على الملعب |
| `/matches/reports` | تقارير المباريات |
| `/reports` | تقارير اللاعبين (3 views: ملخص/بطاقات/دقائق) |
| `/reports/print` | طباعة A4 (مع اختيار الأقسام) |
| `/reports/compare` | مقارنة بين لاعبين |
| `/finance/dashboard` | لوحة المالية (مع إخفاء الأرقام) |
| `/finance/subscriptions` | الإيصالات |
| `/finance/subscriptions/[id]` | تفاصيل اشتراك |
| `/finance/receipts/[paymentId]` | طباعة إيصال |
| `/finance/expenses` | المصروفات (مع بحث + فلاتر) |
| `/finance/revenues` | الإيرادات |
| `/notifications` | الإشعارات (موجَّهة) |
| `/join-requests` | طلبات الانضمام |
| `/audit` | سجل التدقيق |
| `/assets`, `/assets/[id]/qr` | الأصول |
| `/settings` | إعدادات الأكاديمية (مع رفع ختم/توقيع) |

### مسارات Super Admin (`/super-admin/...`)
- `/` — Dashboard عام
- `/academies` — كل الأكاديميات
- `/users` — كل المستخدمين (مع تعيين كلمة مرور)
- `/reports`, `/settings`

### API Routes
- `/api/cron/overdue` — webhook (محمي بـ `CRON_SECRET`) لإرسال التذكيرات

---

## 🧩 الميزات حسب الوحدة

### إدارة اللاعبين
- ✅ قائمة بفلترة (اسم/كود/تصنيف/حالة)، pagination
- ✅ **تحديد متعدد + إجراءات جماعية**: تفعيل/إيقاف/أرشفة/نقل تصنيف/حذف
- ✅ Mobile cards بدلاً من جدول على الموبايل
- ✅ **استيراد CSV**: 12 عمود (الكامل: full_name, birth_date, phone, email, national_id, guardian_name, guardian_phone, category, position, preferred_jersey, status, notes) + قالب جاهز
- ✅ **إنشاء حساب دخول إجباري**: عند إضافة لاعب، البريد + كلمة المرور إجباريان (مع زر توليد)
- ✅ **بطاقة الدعوة في صفحة التعديل**: لإصلاح حسابات اللاعبين الموجودين
- ✅ صفحة الملف الكامل: بيانات + إحصائيات + سجل المباريات + الحضور + الإصابات + الاشتراكات
- ✅ **بطاقة العضوية** مع QR code (بتصميم احترافي)
- ✅ **طباعة A4** مع اختيار الأقسام + ختم وتوقيع المدير

### التدريبات
- ✅ **Smart Weekly Scheduler**: فترات متعددة (تصنيف + يوم + وقت + مدة + موقع) في مرة واحدة
- ✅ زر **"تكرار للتصنيفات الأخرى ⏭"**: ينسخ نفس الفترة لكل تصنيف بوقت متتالي تلقائياً
- ✅ اختصارات نطاق التواريخ: أسبوع/شهر/3 شهور
- ✅ منع التكرار التلقائي (نفس التصنيف + التاريخ)
- ✅ **استيراد CSV** للتدريبات
- ✅ **تحديد متعدد + حذف جماعي**
- ✅ فلاتر (بحث/تصنيف/قادمة/سابقة)
- ✅ تقويم بصري

### الحضور
- ✅ **تصميم بطاقات** (مطابق للموك أب) — 4 أزرار (حاضر/غائب/متأخر/بعذر)
- ✅ **Optimistic UI** — تجاوب فوري قبل الاستجابة من السيرفر
- ✅ زر "تحضير الجميع" دفعة واحدة
- ✅ بحث + فلاتر (الكل/غير مسجَّل/حاضر/...)
- ✅ **🏆 لوحة الشرف** — أعلى 10 لاعبين بنسبة الالتزام مع 🥇🥈🥉
- ✅ بطاقات إحصائية (متأخر/غائب/بعذر/حاضر)
- ✅ قفل تلقائي بعد X دقيقة + صلاحية فتح للإدمن

### المباريات
- ✅ نموذج كامل: نوع/ملعب/مدة/خطة + **طاقم تحكيم 4 أشخاص** (حكم + 2 مساعد + مراقب — أسماء وموبايلات)
- ✅ **محرر التشكيلة على ملعب SVG** بـ 4 خطط جاهزة (4-4-2, 4-3-3, 4-2-3-1, 3-5-2)
- ✅ اللاعبون كرموز ملونة بأرقام القمصان (حارس ذهبي/دفاع سماوي/وسط أخضر/هجوم أحمر)
- ✅ تعيين قائد ★ + حد 11 أساسي + 9 احتياطي
- ✅ بحث في قائمة اللاعبين عند الاختيار
- ✅ تتبع: أهداف، دقائق، بطاقات، طرد، إصابات لكل لاعب
- ✅ بطاقة المباراة في القائمة بنتيجة وفوز/خسارة + معلومات سريعة
- ✅ بانر "المباراة القادمة" في القائمة
- ✅ صفحة تقارير المباريات: 4 جداول صدارة (هدافون/دقائق/صفراء/حمراء)

### التقارير
- ✅ **3 أوضاع عرض**:
  - 📋 **الملخص**: جدول مع 12 عمود (أهداف، حضور، بطاقات نشطة، إلخ)
  - 🟨 **مصفوفة الإنذارات**: لاعبون × مباريات → خلية إنذار/طرد لكل تقاطع
  - ⏱ **مصفوفة الدقائق**: لاعبون × مباريات → الدقائق + لون متدرج حسب القيمة
- ✅ فلاتر شاملة: بحث/تصنيف/مركز/حالة/نطاق تاريخ
- ✅ **زر "🔄 إعادة فحص الإيقافات"** — يعيد تطبيق قاعدة الـ 3 صفراء
- ✅ **طباعة A4 احترافية** مع اختيار الأقسام
- ✅ صفحة مقارنة بين لاعبين (radar chart + جدول مقارنة + 🏆 للأفضل)

### المالية
- ✅ Dashboard مع إخفاء/إظهار الأرقام (👁/🙈)
- ✅ إيصالات السداد مع طباعة احترافية + ختم/توقيع
- ✅ مصروفات مع بحث + فلاتر متعددة (تصنيف/تاريخ/قيمة)
- ✅ **إدارة تصنيفات المصروفات**: تعديل/حذف inline
- ✅ إيرادات إضافية (رعاية، تبرع، إلخ)
- ✅ تحديث تلقائي لحالة الاشتراك بعد كل دفعة (trigger)

### الإشعارات
- ✅ **إرسال موجَّه**: لاعبون محددون / تصنيف / منتهي قريباً / متأخر السداد / كل اللاعبين
- ✅ **بحث على اللاعبين عند الاختيار**
- ✅ 3 قنوات: داخل النظام / بريد / واتساب

### Super Admin
- ✅ إدارة كل الأكاديميات
- ✅ إدارة المستخدمين العامين
- ✅ **تعيين/إعادة تعيين كلمة مرور** لأي مستخدم
- ✅ تقارير عبر النظام
- ✅ إعدادات عامة

---

## 📦 التخزين (Storage)

### Buckets
| Bucket | الوصف | الوصول |
|---|---|---|
| `logos` | شعارات الأكاديميات + ختم + توقيع المدير | **عام** (public URL) |
| `asset-images` | صور الأصول الثابتة | عام |
| `join-docs` | صور اللاعبين + الهوية | **خاص** (signed URL مع TTL = 600s) |

### الـ Helpers
- `lib/uploads.ts`:
  - `uploadImage(bucket, file, prefix)` → URL أو path
  - `uploadIfPresent(bucket, fd, key, prefix)` — للنماذج
- `lib/storage.ts`:
  - `signedUrl(path, ttl=600)` — للـ buckets الخاصة
  - `signedUrlMap(paths[])` — لقوائم متعددة

---

## 🌐 الخدمات الخارجية

### Resend (Email)
- متغير `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
- يُستخدم في:
  - إشعارات الإدارة (notifications channel = email)
  - تذكيرات المتأخرات (cron)
- اختياري — التطبيق يعمل بدونه (يتجاهل الإرسال).

### WhatsApp Cloud API
- في `lib/whatsapp.ts` — `sendWhatsAppText(phone, message)`
- يحتاج config إضافي (راجع الكود)
- اختياري كذلك.

### Cron Jobs (`/api/cron/overdue`)
- محمي بـ `CRON_SECRET` (Header: `Authorization: Bearer ...`)
- يولِّد إيصالات الدورة الجديدة + يرسل تذكيرات
- يجب جدولته من Vercel Cron أو cron خارجي:
  ```
  0 9 * * * — يومياً 9 صباحاً
  ```

---

## 🎨 التصميم والتجاوب

### نظام الألوان
```css
--emerald-700: #047857  (الأساسي)
--emerald-900: #064e3b  (الداكن)
--gold-400:    #fbbf24  (المُحفِّز)
--background:  #f8fafc
--card:        #ffffff
--muted:       #f1f5f9
```

### Breakpoints
- `sm`: 640px (موبايل أفقي)
- `md`: 768px (لوحي صغير) — *يُستخدم بشكل محدود*
- `lg`: **1024px** (الفاصل الرئيسي للـ sidebar)
- `xl`: 1280px

### القاعدة المهمة للتنقل
- **الشاشات < 1024px**: قائمة جانبية كـ **drawer overlay** (عبر React Portal لتفادي stacking contexts)
- **الشاشات ≥ 1024px**: sidebar ثابت (288px)

### تجاوب الجداول
- كل الجداول داخل `overflow-auto` مع **مؤشر تمرير بصري** (gradient) على الموبايل
- `white-space: nowrap` افتراضياً (مع class `.cell-wrap` للاستثناء)
- Padding وخط أصغر تلقائياً على < 640px
- جداول اللاعبين والتدريبات: **بطاقات على الموبايل** بدلاً من الجدول

### مكوّنات UI الأساسية (`components/ui/`)
- `button` (variants: default, outline, ghost, destructive, gold, success)
- `input`, `label`, `textarea`, `select` (radix-based)
- `card`, `badge` (variants: default, success, warning, destructive, muted)
- `table` (مع overflow auto مدمج)
- `dialog`, `popover`, `select`, `tabs`, `checkbox`, `dropdown-menu`

---

## 🖨 الطباعة والمستندات

### الأنماط
- **A4 Portrait** افتراضياً للملفات الفردية (210mm × 297mm)
- **A4 Landscape** للتقارير الجماعية (297mm × 210mm)
- ختم + توقيع المدير + ختم الأكاديمية في الفوتر

### الصفحات القابلة للطباعة
1. `/players/[id]/print` — A4 portrait مع 8 أقسام قابلة للتفعيل
2. `/players/[id]/card` — بطاقة عضوية مع QR
3. `/finance/receipts/[paymentId]` — إيصال سداد (مع توقيع/ختم)
4. `/reports/print` — A4 landscape مع 4 أوضاع
5. `/me/print` — لوحة اللاعب بـ 6 أقسام
6. `/matches/reports` — مع PrintExport (طباعة + CSV)
7. `/finance/revenues`, `/finance/subscriptions` — مع PrintExport

### Print CSS العامة (`app/globals.css`)
- `@media print` يخفي العناصر بـ class `no-print`
- فرض الألوان: `print-color-adjust: exact` (لرؤية الـ badges والـ headers الملونة)
- منع كسر الصفوف داخل الجداول
- إزالة الظلال والـ animations
- إعادة تفعيل `white-space: normal` داخل الجداول للطباعة

### المكوّن العام `<PrintButton />`
- يظهر تلقائياً في كل `<PageHeader />` (إلا إذا مرر `hidePrint`)
- نمط `window.print()` مع `class no-print` على شريط الأدوات

---

## 🚀 التشغيل والنشر

### المتغيرات البيئية المطلوبة

```bash
# Supabase (مطلوب)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ⚠️ سري — لا يُكشف

# Email (اختياري)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@academy.com

# Cron (مطلوب لو تستخدم cron)
CRON_SECRET=long-random-string

# WhatsApp (اختياري)
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
```

### النشر على Vercel

1. اربط المستودع بـ Vercel
2. أضف المتغيرات في Settings → Environment Variables
3. Vercel Cron (في `vercel.json`):
   ```json
   {
     "crons": [{
       "path": "/api/cron/overdue",
       "schedule": "0 9 * * *"
     }]
   }
   ```
4. Build command الافتراضي: `next build`

### إعداد Supabase

1. أنشئ مشروع Supabase جديد
2. شغِّل الـ migrations بالترتيب من `supabase/migrations/0001_*.sql` حتى `0010_*.sql` (راجع القسم التالي)
3. أنشئ الـ buckets:
   - `logos` (Public)
   - `asset-images` (Public)
   - `join-docs` (Private)
4. أعِد ضبط Auth settings:
   - Email provider مفعَّل
   - Redirect URLs: `https://yourdomain.com/reset-password`, `https://yourdomain.com/login`

### إنشاء أول super_admin

بعد إنشاء حساب Auth العادي، نفِّذ في SQL Editor:

```sql
INSERT INTO memberships (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'your@email.com';
```

ثم أنشئ ملفه:
```sql
INSERT INTO profiles (id, full_name)
SELECT id, 'الاسم الكامل' FROM auth.users WHERE email = 'your@email.com';
```

### التطوير المحلي

```bash
npm install
cp .env.example .env.local   # وعبِّئ القيم
npm run dev                   # → http://localhost:3000
```

---

## 📊 الـ Migrations

**تطبَّق بالترتيب:**

| # | الملف | الغرض |
|---|---|---|
| 0001 | `init.sql` | الجداول الأساسية + enums + functions + triggers |
| 0002 | `rls.sql` | Row-Level Security policies لكل الجداول |
| 0003 | `views.sql` | Views للتقارير (attendance, match summary, ROI, finance) |
| 0004 | `fix_player_delete_and_extras.sql` | إصلاح FK لحذف اللاعب + `minutes_played` + `duration_min` للمباراة |
| 0005 | `attendance_excused.sql` | إضافة `excused` (بعذر) لـ attendance_status enum |
| 0006 | `matches_lineup.sql` | كامل دعم التشكيلة: enums (match_type, lineup_role, player_position) + أعمدة المباراة (طاقم تحكيم) + lineup fields على participations + 2 views جديدة |
| 0007 | `yellow_card_suspension.sql` | trigger الإيقاف التلقائي بعد 3 صفراء + `player_discipline` view + `reactivate_player()` function |
| 0008 | `backfill_suspensions.sql` | دالة `recompute_player_suspensions(academy)` لتطبيق القاعدة على البيانات الموجودة |
| 0009 | `academy_seal_signature.sql` | `seal_url`, `manager_signature_url`, `manager_name` للأكاديمية |
| 0010 | `match_observer.sql` | `observer_name`, `observer_phone` لمباراة (مراقب المباراة) |

### نقاط مهمة
- بعد تطبيق 0007، **شغّل** `recompute_player_suspensions(NULL)` لتطبيق القاعدة على البيانات الموجودة (أو استخدم زر "🔄 إعادة فحص الإيقافات" في صفحة التقارير).
- إذا رأيت خطأ "column reference is ambiguous" في 0008، تأكد أن جميع الـ migrations طُبقت بالترتيب.
- عند إعادة بناء `player_match_stats` view في 0006، التطبيق يدعم الـ aggregation الجديدة. **لا تعتمد على إصدار 0001 من الـ view**.

---

## ⚠️ القيود المعروفة

### 1. Next.js 16 (إصدار حديث)
- بعض الـ APIs قد تختلف عن Next 14/15 (خاصة `params` async، `searchParams` async، `cookies()` async)
- اقرأ `node_modules/next/dist/docs/` قبل أي تغيير في routing/middleware/proxy.

### 2. `findAuthUserByEmail` — أداء محدود
- في `app/academy/[id]/players/actions.ts` و `join-requests/actions.ts`، نبحث عن المستخدم بالـ email عبر `listUsers` paged.
- يبدأ يتباطأ عند **>4000 مستخدم في النظام**.
- **الحل المستقبلي**: cache email→user_id في `profiles` table + index، أو استخدام Supabase Admin API الجديد إن دعم البحث المباشر.

### 3. `match_team_totals` View ليس له FK
- لا يمكن استخدامه في Supabase relational select (`from('matches').select('*, match_team_totals(...)')`).
- **الحل المعتمد**: نجلبه في query منفصل ونربطه في JS عبر Map.

### 4. Storage Public URLs
- الـ logos/seal/signature تُحفَظ كـ full URLs (`https://xxx.supabase.co/storage/v1/object/public/...`).
- **لا تستدعِ `signedUrl()` عليها** — هي عامة بالفعل.

### 5. Print لا يدعم الـ Animations
- بعض الرسوم البيانية (Recharts) قد لا تظهر بشكل مثالي في الطباعة.
- التقارير المهمة تستخدم HTML tables بدلاً من charts.

### 6. Middleware = `proxy.ts`
- في Next.js 16، الـ middleware مُسمَّى `proxy.ts` بدلاً من `middleware.ts` — هذه ليست خطأ.

### 7. لاعب بدون category
- الـ Smart Weekly Scheduler يتطلب category. اللاعب الذي ليس له category لن يظهر في تدريبات تلك الفترة.
- جدولة "للجميع" غير مدعومة حالياً (category_id على trainings nullable لكن الـ scheduler لا يستخدمها).

### 8. CSV Parser بسيط
- يدعم الحقول المُنصَّصة بـ `"..."` لكن قد يفشل مع أنماط CSV غريبة (multi-line embedded في خلية).
- للملفات الكبيرة (>5000 صف)، الأداء يتدهور.

---

## 🔮 أعمال مستقبلية مقترحة

### High Priority
1. **Realtime updates** للحضور (Supabase Realtime) — حالياً يحتاج refresh.
2. **Notification preferences للاعب** — يختار قنوات الاستلام.
3. **Two-Factor Auth** للإدمن.
4. **Mobile App native** عبر Capacitor/Expo (الأساس Web يدعم PWA).
5. **تجزئة عضوية اللاعب**: إضافة دور `parent` (ولي أمر) منفصل عن `player`.

### Medium Priority
6. **Calendar export** (.ics) للتدريبات والمباريات.
7. **مدفوعات إلكترونية** (Paymob/Fawry/Stripe) لربط مع `payments`.
8. **تقارير مالية مقارنة** (شهر vs شهر، سنة vs سنة).
9. **رفع فيديوهات** للمباريات (مع timestamps للأهداف).
10. **التقييم الفني للاعب** — درجات من المدرب على مهارات (السرعة، التمرير، إلخ) — لـ player profile.

### Low Priority
11. **i18n كامل** (إنجليزي/فرنسي) — حالياً عربي فقط.
12. **Dark mode**.
13. **تطبيق ولي الأمر** المنفصل.
14. **API عامة** (REST/GraphQL) للتكامل مع أنظمة خارجية.

---

## 🔧 مرجع التطوير السريع

### إضافة صفحة جديدة في الأكاديمية

```typescript
// app/academy/[academyId]/my-feature/page.tsx
import { PageBody, PageHeader } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";

export default async function MyFeaturePage({
  params,
}: {
  params: Promise<{ academyId: string }>;
}) {
  const { academyId } = await params;
  await requireAcademyAccess(academyId);  // ← مهم!
  const sb = await createClient();
  const { data } = await sb.from("my_table").select("*").eq("academy_id", academyId);

  return (
    <>
      <PageHeader title="ميزتي الجديدة" description="..." />
      <PageBody>
        {/* ... */}
      </PageBody>
    </>
  );
}
```

ثم أضفه إلى `fullNav` في `app/academy/[academyId]/layout.tsx`.

### إضافة Server Action

```typescript
// app/academy/[academyId]/my-feature/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

export async function myAction(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);  // ← التحقق من الصلاحية
  const sb = await createClient();
  const { error } = await sb.from("my_table").insert({ /* ... */ });
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/my-feature`);
  return { ok: true };
}
```

### إضافة Migration جديدة

1. أنشئ ملف بالترقيم التالي: `supabase/migrations/0011_my_change.sql`
2. اكتب الـ SQL مع `IF NOT EXISTS` حيثما أمكن
3. حدِّث `types/database.ts` يدوياً أو عبر `supabase gen types typescript`
4. أضف ملاحظة في هذا الـ HANDOFF.md في قسم الـ migrations

### Patterns مهمة

#### Multi-tenant query
```typescript
// دائماً فلتر بـ academy_id (RLS يحميك لكن صريح أفضل)
.from("players").select("*").eq("academy_id", academyId)
```

#### Optimistic update
```typescript
// راجع app/academy/[id]/attendance/attendance-grid.tsx
const [state, setState] = useState(...);
function pick(id, value) {
  const prev = state[id];
  setState({ ...state, [id]: value });  // optimistic
  startTransition(async () => {
    const res = await action(...);
    if (res.error) {
      setState({ ...state, [id]: prev });  // rollback
      alert(res.error);
    }
  });
}
```

#### React Portal للـ overlays
```typescript
// تجنب stacking context issues
import { createPortal } from "react-dom";
{mounted && open && createPortal(<Drawer />, document.body)}
```

### أوامر مفيدة

```bash
npm run dev                # dev server
npm run build              # production build (مهم: فحص typescript أيضاً)
npx tsc --noEmit           # type check فقط (أسرع)
npm run lint               # eslint
npm run test               # vitest
```

### Debugging

- **مشكلة في RLS؟** اذهب لـ Supabase Studio → Logs → Auth/Database
- **server action لا يعمل؟** تحقق من `"use server"` في الأعلى + من إعادة `revalidatePath`
- **الصفحة بطيئة؟** تحقق من cascading queries — استخدم `Promise.all([...])`
- **TypeScript error في `params`?** في Next 16، `params` و `searchParams` async — استخدم `await`

---

## 📞 معلومات الاتصال

- **اسم المالك:** Badr (cbadrx100@gmail.com)
- **اللغة الأساسية للنظام:** العربية (RTL)
- **اللغة في كود التعليقات:** عربي + إنجليزي مختلطة (للتعليقات التوضيحية)
- **اتفاقية كتابة الكود:**
  - أسماء المتغيرات: إنجليزي
  - النصوص الظاهرة للمستخدم: عربي
  - رسائل الـ commits: مختلطة

---

## 📝 ملاحظات ختامية

هذا المشروع **في حالة إنتاج نشط** ويُستخدم من قبل أكاديميات حقيقية. أي تطوير لاحق يجب أن:

1. **يحافظ على دورة التشغيل**: لا تكسر دورة اللاعب الموثقة أعلاه.
2. **يحترم RLS**: لا تحاول تجاوز السياسات من الـ frontend.
3. **يطبِّق الـ migrations بالترتيب**: لا تتخطى رقماً.
4. **يُحدِّث هذا الـ HANDOFF**: عند إضافة ميزة كبيرة أو تغيير schema، حدِّث القسم المناسب هنا.
5. **يفحص TypeScript قبل الـ commit**: `npx tsc --noEmit`.

> 💡 **في حال الشك**: اقرأ الكود الموجود (خاصة `lib/auth/rbac.ts` و `supabase/migrations/`) — هو المرجع الفعلي للسلوك الصحيح. هذه الوثيقة تشرح **النية**، الكود يعرض **التطبيق**.

---

**نهاية الوثيقة. آخر مراجعة: 2026-05-01.**
