import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, UserPlus, TrendingUp, AlertTriangle, Trophy } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const sb = await createClient();
  const [{ data: academies, count: academiesCount }, { count: playersCount }, { count: pendingCount }, { data: finance }] = await Promise.all([
    sb.from("academies").select("id, name, logo_url", { count: "exact" }).order("created_at", { ascending: false }),
    sb.from("players").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("join_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("academy_finance_summary").select("*"),
  ]);

  const totalCollected = (finance ?? []).reduce((s: number, f: any) => s + Number(f.total_collected || 0), 0);
  const totalOutstanding = (finance ?? []).reduce((s: number, f: any) => s + Number(f.outstanding || 0), 0);
  const totalNet = (finance ?? []).reduce((s: number, f: any) => s + Number(f.net_profit || 0), 0);

  return (
    <>
      <PageHeader title="لوحة Super Admin" description="نظرة شاملة على كل الأكاديميات في المنصة" />
      <PageBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard label="عدد الأكاديميات" value={String(academiesCount ?? 0)} icon={<Building2 className="w-6 h-6" />} accent="emerald" />
          <StatCard label="إجمالي اللاعبين" value={String(playersCount ?? 0)} icon={<Users className="w-6 h-6" />} accent="emerald" />
          <StatCard label="طلبات انضمام جديدة" value={String(pendingCount ?? 0)} icon={<UserPlus className="w-6 h-6" />} accent="gold" />
          <StatCard label="إجمالي التحصيل" value={formatCurrency(totalCollected)} icon={<TrendingUp className="w-6 h-6" />} accent="emerald" />
          <StatCard label="المتأخرات الكلية" value={formatCurrency(totalOutstanding)} icon={<AlertTriangle className="w-6 h-6" />} accent="warning" />
          <StatCard label="صافي الربح الإجمالي" value={formatCurrency(totalNet)} icon={<Trophy className="w-6 h-6" />} accent="gold" />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              الأكاديميات المسجَّلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(academies ?? []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">لا توجد أكاديميات بعد</p>
                <Link href="/super-admin/academies/new" className="text-emerald-700 hover:underline font-semibold">+ إضافة أكاديمية جديدة</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(academies ?? []).map((a: any) => {
                  const f = (finance ?? []).find((x: any) => x.academy_id === a.id);
                  return (
                    <Link key={a.id} href={`/super-admin/academies/${a.id}`}
                          className="group p-4 rounded-xl border border-border bg-white hover:border-emerald-700/40 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold-400 flex items-center justify-center font-bold text-lg shrink-0">
                          {a.name?.charAt(0) || "A"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate group-hover:text-emerald-700 transition-colors">{a.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {f ? formatCurrency(f.total_collected) : "—"} محصَّل
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
