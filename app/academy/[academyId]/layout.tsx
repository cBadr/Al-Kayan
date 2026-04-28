import { requireAcademyAccess } from "@/lib/auth/rbac";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function AcademyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ academyId: string }>;
}) {
  const { academyId } = await params;
  const user = await requireAcademyAccess(academyId);
  const sb = await createClient();
  const [{ data: academy }, { count: pendingJoin }] = await Promise.all([
    sb.from("academies").select("id, name").eq("id", academyId).maybeSingle(),
    sb.from("join_requests").select("id", { count: "exact", head: true }).eq("academy_id", academyId).eq("status", "pending"),
  ]);
  if (!academy) notFound();

  const isManager = user.isSuperAdmin || user.managedAcademyIds.includes(academyId);
  const isCoach = user.coachedAcademyIds.includes(academyId);
  const roleLabel = user.isSuperAdmin
    ? "Super Admin"
    : isManager
    ? "مدير أكاديمية"
    : isCoach
    ? "مدرب"
    : "لاعب";

  const base = `/academy/${academyId}`;

  const fullNav = [
    { href: base, label: "اللوحة الرئيسية" },
    { href: `${base}/players`, label: "اللاعبون" },
    { href: `${base}/categories`, label: "التصنيفات" },
    { href: `${base}/join-requests`, label: "طلبات الانضمام", badge: pendingJoin },
    { href: `${base}/trainings`, label: "التدريبات" },
    { href: `${base}/attendance`, label: "تسجيل الحضور" },
    { href: `${base}/matches`, label: "المباريات" },
    { href: `${base}/reports`, label: "التقارير الرياضية" },
    { href: `${base}/finance/subscriptions`, label: "إيصالات السداد" },
    { href: `${base}/finance/expenses`, label: "المصروفات" },
    { href: `${base}/finance/revenues`, label: "الإيرادات" },
    { href: `${base}/finance/dashboard`, label: "اللوحة المالية" },
    { href: `${base}/assets`, label: "الأصول الثابتة" },
    { href: `${base}/notifications`, label: "الإشعارات" },
    { href: `${base}/audit`, label: "سجل التدقيق" },
    { href: `${base}/settings`, label: "إعدادات الأكاديمية" },
  ];

  const coachNav = [
    { href: base, label: "اللوحة الرئيسية" },
    { href: `${base}/trainings`, label: "التدريبات" },
    { href: `${base}/attendance`, label: "تسجيل الحضور" },
    { href: `${base}/matches`, label: "المباريات" },
    { href: `${base}/reports`, label: "تقارير اللاعبين" },
  ];

  const nav = isManager ? fullNav : isCoach ? coachNav : [{ href: "/me", label: "بروفايلي" }];

  return (
    <AppShell
      title={academy.name}
      user={{ fullName: user.fullName, email: user.email, roleLabel }}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
