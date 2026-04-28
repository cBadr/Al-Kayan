import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency } from "@/lib/utils";

export default async function FinanceDashboard({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: f } = await sb.from("academy_finance_summary").select("*").eq("academy_id", academyId).maybeSingle();
  const { data: cur } = await sb.from("academy_current_collection").select("*").eq("academy_id", academyId).maybeSingle();

  return (
    <>
      <PageHeader title="اللوحة المالية" description="نظرة شاملة على الإيرادات والمصروفات" />
      <PageBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="إجمالي التحصيل (اشتراكات)" value={formatCurrency(f?.total_collected ?? 0)} />
          <Stat label="إيرادات إضافية" value={formatCurrency(f?.extra_revenue ?? 0)} />
          <Stat label="إجمالي المصروفات" value={formatCurrency(f?.total_expenses ?? 0)} />
          <Stat label="صافي الربح" value={formatCurrency(f?.net_profit ?? 0)} variant={(f?.net_profit ?? 0) < 0 ? "warning" : undefined} />
          <Stat label="المتأخرات" value={formatCurrency(f?.outstanding ?? 0)} variant="warning" />
          <Stat label="معدل التحصيل (الشهر الحالي)" value={`${cur?.collection_pct ?? 0}%`} />
          <Stat label="المتوقع للشهر الحالي" value={formatCurrency(cur?.expected ?? 0)} />
          <Stat label="المحصّل من الشهر الحالي" value={formatCurrency(cur?.collected ?? 0)} />
        </div>
      </PageBody>
    </>
  );
}

function Stat({ label, value, variant }: { label: string; value: string; variant?: "warning" }) {
  return <Card><CardContent className="pt-6">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${variant === "warning" ? "text-warning" : ""}`}>{value}</p>
  </CardContent></Card>;
}
