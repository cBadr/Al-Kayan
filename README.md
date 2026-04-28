# سلامة — نظام إدارة أكاديميات كرة القدم

منصة SaaS متعددة الإيجار لإدارة أكاديميات كرة القدم: تدريبات، حضور، مباريات، تقارير أداء، اشتراكات ومصروفات وأصول، وإشعارات.

## التقنيات

- **Next.js 16** (App Router, Server Actions) + **TypeScript**
- **Tailwind CSS v4** + **Cairo** font + RTL افتراضي
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Recharts** للرسوم، **qrcode** لـ QR الأصول، **Resend** للبريد
- **TanStack Query**

## الإعداد

### 1. متغيرات البيئة
انسخ `.env.example` إلى `.env.local` واملأ القيم.

### 2. تطبيق مخطط قاعدة البيانات
شغّل ملفات SQL بالترتيب على Supabase:

```
supabase/migrations/0001_init.sql      # الجداول و triggers و sequences
supabase/migrations/0002_rls.sql       # Row Level Security
supabase/migrations/0003_views.sql     # views للتقارير و ROI
```

### 3. Storage Bucket
أنشئ bucket باسم `join-docs` (private) لتخزين صور المتقدمين.

### 4. إنشاء أول Super Admin
بعد تسجيل أول حساب عبر Auth:
```sql
insert into memberships (user_id, academy_id, role)
values ('<auth-user-id>', null, 'super_admin');
```

### 5. التشغيل
```bash
npm install
npm run dev
```
ثم افتح http://localhost:3000

## الأدوار
- **Super Admin** — إدارة كل الأكاديميات.
- **مدير أكاديمية** — إدارة كاملة لأكاديميته.
- **مدرب** — تدريبات، حضور (مع قفل زمني)، مباريات.
- **لاعب** — بروفايله واشتراكاته وإشعاراته.
- **طلب انضمام** — عبر `/join/[slug]` بدون حساب.

## الميزات الرئيسية
- كود لاعب فريد لكل أكاديمية يبدأ من `000001`.
- ترقيم إيصالات يبدأ من `1000001`.
- قفل زمني لتعديل الحضور.
- إصابات مرتبطة بالسجل الصحي.
- مباريات بمشاركات من تصنيفات متعددة.
- تقارير: حضور، أهداف، إنذارات، ROI، مقارنة لاعبين.
- توليد فواتير شهرية يدوي.
- دفعات جزئية + إيصالات قابلة للطباعة.
- أصول ثابتة بـ QR.
- إشعارات in-app + email.
- حقول إجبارية ديناميكية.

## النشر
```bash
vercel deploy
```
