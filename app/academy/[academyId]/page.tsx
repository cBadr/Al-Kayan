import { PageBody, PageHeader } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Users, Layers, UserPlus, Calendar, TrendingUp, AlertTriangle, Wallet, Trophy } from "lucide-react";
import Link from "next/link";

export default async function AcademyDashboard({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  const sb = await createClient();
  const [
    { count: playersCount },
    { count: categoriesCount },
    { count: pendingCount },
    { data: finance },
    { count: trainingsThisWeek },
    { data: nextTrainings },
  ] = await Promise.all([
    sb.from("players").select("id", { count: "exact", head: true }).eq("academy_id", academyId).eq("status", "active"),
    sb.from("categories").select("id", { count: "exact", head: true }).eq("academy_id", academyId),
    sb.from("join_requests").select("id", { count: "exact", head: true }).eq("academy_id", academyId).eq("status", "pending"),
    sb.from("academy_finance_summary").select("*").eq("academy_id", academyId).maybeSingle(),
    sb.from("trainings").select("id", { count: "exact", head: true }).eq("academy_id", academyId)
      .gte("scheduled_at", new Date().toISOString())
      .lte("scheduled_at", new Date(Date.now() + 7 * 86400000).toISOString()),
    sb.from("trainings").select("id, scheduled_at, location, categories(name)")
      .eq("academy_id", academyId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  return (
    <>
      <PageHeader title="لوحة الأكاديمية" description="نظرة عامة على الأنشطة والمالية" />
      <PageBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard label="اللاعبون النشطون" value={String(playersCount ?? 0)} icon={<Users className="w-6 h-6" />} accent="emerald" />
          <StatCard label="عدد التصنيفات" value={String(categoriesCount ?? 0)} icon={<Layers className="w-6 h-6" />} accent="emerald" />
          <StatCard label="طلبات انضمام جديدة" value={String(pendingCount ?? 0)} icon={<UserPlus className="w-6 h-6" />} accent="gold" />
          <StatCard label="تدريبات الأسبوع" value={String(trainingsThisWeek ?? 0)} icon={<Calendar className="w-6 h-6" />} accent="emerald" />
          <StatCard label="إجمالي التحصيل" value={formatCurrency(finance?.total_collected ?? 0)} icon={<TrendingUp className="w-6 h-6" />} accent="emerald" />
          <StatCard label="المتأخرات" value={formatCurrency(finance?.outstanding ?? 0)} icon={<AlertTriangle className="w-6 h-6" />} accent="warning" />
          <StatCard label="المصروفات" value={formatCurrency(finance?.total_expenses ?? 0)} icon={<Wallet className="w-6 h-6" />} accent="destructive" />
          <StatCard label="صافي الربح" value={formatCurrency(finance?.net_profit ?? 0)} icon={<Trophy className="w-6 h-6" />} accent="gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                التدريبات القادمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(nextTrainings ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد تدريبات قادمة. أضف تدريباً من قائمة التدريبات.</p>
              ) : (
                <ul className="space-y-2">
                  {(nextTrainings ?? []).map((t: any) => (
                    <li key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/40 hover:bg-emerald-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex flex-col items-center justify-center text-[10px] leading-tight font-bold">
                        <span>{new Date(t.scheduled_at).getDate()}</span>
                        <span className="text-[8px] opacity-80">
                          {new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(t.scheduled_at))}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{t.categories?.name ?? "تدريب"}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {new Date(t.scheduled_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          {t.location ? ` • ${t.location}` : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-500" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <QuickLink href={`/academy/${academyId}/players/new`} label="إضافة لاعب" />
                <QuickLink href={`/academy/${academyId}/attendance`} label="تسجيل حضور" />
                <QuickLink href={`/academy/${academyId}/matches`} label="مباراة جديدة" />
                <QuickLink href={`/academy/${academyId}/finance/subscriptions`} label="إيصالات السداد" />
                <QuickLink href={`/academy/${academyId}/reports`} label="تقارير الأداء" />
                <QuickLink href={`/academy/${academyId}/notifications`} label="إرسال إشعار" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
          className="block p-3 rounded-lg border border-border text-sm font-semibold text-emerald-900 bg-white hover:border-emerald-700/40 hover:bg-emerald-50/60 hover:shadow-sm transition-all text-center">
      {label}
    </Link>
  );
}
