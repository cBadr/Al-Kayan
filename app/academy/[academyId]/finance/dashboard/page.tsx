import { PageBody, PageHeader } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency } from "@/lib/utils";
import { FinanceStats } from "./finance-stats";

export default async function FinanceDashboard({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: f } = await sb.from("academy_finance_summary").select("*").eq("academy_id", academyId).maybeSingle();
  const { data: cur } = await sb.from("academy_current_collection").select("*").eq("academy_id", academyId).maybeSingle();

  const stats = [
    { label: "إجمالي التحصيل (اشتراكات)", value: formatCurrency(f?.total_collected ?? 0), sensitive: true },
    { label: "إيرادات إضافية", value: formatCurrency(f?.extra_revenue ?? 0), sensitive: true },
    { label: "إجمالي المصروفات", value: formatCurrency(f?.total_expenses ?? 0), sensitive: true },
    {
      label: "صافي الربح",
      value: formatCurrency(f?.net_profit ?? 0),
      variant: ((f?.net_profit ?? 0) < 0 ? "warning" : undefined) as "warning" | undefined,
      sensitive: true,
    },
    { label: "المتأخرات", value: formatCurrency(f?.outstanding ?? 0), variant: "warning" as const, sensitive: true },
    { label: "معدل التحصيل (الشهر الحالي)", value: `${cur?.collection_pct ?? 0}%` },
    { label: "المتوقع للشهر الحالي", value: formatCurrency(cur?.expected ?? 0), sensitive: true },
    { label: "المحصّل من الشهر الحالي", value: formatCurrency(cur?.collected ?? 0), sensitive: true },
  ];

  return (
    <>
      <PageHeader title="اللوحة المالية" description="نظرة شاملة على الإيرادات والمصروفات" />
      <PageBody>
        <FinanceStats stats={stats} />
      </PageBody>
    </>
  );
}
