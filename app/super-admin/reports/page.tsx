import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { formatCurrency } from "@/lib/utils";
import { PrintExport } from "@/components/print-export";

export default async function SuperAdminReportsPage() {
  await requireSuperAdmin();
  const sb = await createClient();

  const [{ data: finance }, { data: collection }, { data: academies }] = await Promise.all([
    sb.from("academy_finance_summary").select("*"),
    sb.from("academy_current_collection").select("*"),
    sb.from("academies").select("id, name"),
  ]);

  const collectionMap = new Map((collection ?? []).map((c: any) => [c.academy_id, c]));

  const rows = (academies ?? []).map((a: any) => {
    const f = (finance ?? []).find((x: any) => x.academy_id === a.id);
    const c = collectionMap.get(a.id);
    return {
      id: a.id, name: a.name,
      collected: Number(f?.total_collected ?? 0),
      outstanding: Number(f?.outstanding ?? 0),
      extra: Number(f?.extra_revenue ?? 0),
      expenses: Number(f?.total_expenses ?? 0),
      net: Number(f?.net_profit ?? 0),
      currentPct: c ? Number(c.collection_pct) : 0,
    };
  });

  const totals = rows.reduce((acc, r) => ({
    collected: acc.collected + r.collected,
    outstanding: acc.outstanding + r.outstanding,
    extra: acc.extra + r.extra,
    expenses: acc.expenses + r.expenses,
    net: acc.net + r.net,
  }), { collected: 0, outstanding: 0, extra: 0, expenses: 0, net: 0 });

  return (
    <>
      <PageHeader
        title="التقارير الموحدة"
        description="مقارنة مالية وأداء بين كل الأكاديميات"
        actions={<PrintExport filename="super-admin-report" />}
      />
      <PageBody>
        <Card>
          <CardHeader><CardTitle>المالية الموحَّدة</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الأكاديمية</Th><Th>التحصيل</Th><Th>إيرادات إضافية</Th>
                  <Th>المصروفات</Th><Th>صافي الربح</Th><Th>المتأخرات</Th>
                  <Th>تحصيل الشهر %</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium">{r.name}</Td>
                    <Td>{formatCurrency(r.collected)}</Td>
                    <Td>{formatCurrency(r.extra)}</Td>
                    <Td>{formatCurrency(r.expenses)}</Td>
                    <Td className={r.net < 0 ? "text-warning font-bold" : ""}>{formatCurrency(r.net)}</Td>
                    <Td className="text-warning">{formatCurrency(r.outstanding)}</Td>
                    <Td>{r.currentPct}%</Td>
                  </Tr>
                ))}
                {rows.length === 0 && (
                  <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد بيانات</Td></Tr>
                )}
                {rows.length > 0 && (
                  <Tr className="bg-muted/30 font-bold">
                    <Td>المجموع</Td>
                    <Td>{formatCurrency(totals.collected)}</Td>
                    <Td>{formatCurrency(totals.extra)}</Td>
                    <Td>{formatCurrency(totals.expenses)}</Td>
                    <Td>{formatCurrency(totals.net)}</Td>
                    <Td>{formatCurrency(totals.outstanding)}</Td>
                    <Td>—</Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
