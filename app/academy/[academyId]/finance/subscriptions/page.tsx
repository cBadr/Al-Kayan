import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { regenerateMissingCycles } from "./actions";
import { PrintExport } from "@/components/print-export";

export default async function SubscriptionsPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyManager(academyId);
  const sb = await createClient();

  const filter = sp.filter ?? "open";
  let q = sb.from("subscriptions")
    .select("*, players(code, full_name, status)")
    .eq("academy_id", academyId)
    .order("period_end", { ascending: false });
  if (filter === "open") q = q.in("status", ["unpaid", "partial"]);
  else if (filter === "paid") q = q.eq("status", "paid");

  const { data: subs } = await q.limit(500);

  const totals = (subs ?? []).reduce(
    (acc: any, s: any) => ({
      due: acc.due + Number(s.amount_due),
      paid: acc.paid + Number(s.amount_paid),
      remaining: acc.remaining + (Number(s.amount_due) - Number(s.amount_paid)),
    }),
    { due: 0, paid: 0, remaining: 0 },
  );

  return (
    <>
      <PageHeader
        title="إيصالات السداد"
        description="كل إيصالات اشتراكات اللاعبين — تُولَّد تلقائياً عند تسجيل اللاعب وعند انتهاء كل دورة"
        actions={<>
          <form action={async () => { "use server"; await regenerateMissingCycles(academyId); }}>
            <Button type="submit" variant="outline">تحديث الإيصالات المستحقة</Button>
          </form>
          <PrintExport filename={`receipts-${academyId}`} />
        </>}
      />
      <PageBody>
        <Card className="mb-4">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-2">
              <Link href={`/academy/${academyId}/finance/subscriptions?filter=open`}
                className={`px-3 py-2 rounded-md text-sm border ${filter === "open" ? "bg-primary text-white border-primary" : "border-border"}`}>غير مسدَّد</Link>
              <Link href={`/academy/${academyId}/finance/subscriptions?filter=paid`}
                className={`px-3 py-2 rounded-md text-sm border ${filter === "paid" ? "bg-primary text-white border-primary" : "border-border"}`}>مسدَّد</Link>
              <Link href={`/academy/${academyId}/finance/subscriptions?filter=all`}
                className={`px-3 py-2 rounded-md text-sm border ${filter === "all" ? "bg-primary text-white border-primary" : "border-border"}`}>الكل</Link>
            </div>
            <Stat label="إجمالي مستحق" value={formatCurrency(totals.due)} />
            <Stat label="محصّل" value={formatCurrency(totals.paid)} />
            <Stat label="متبقي" value={formatCurrency(totals.remaining)} highlight />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>القائمة</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>اللاعب</Th><Th>الكود</Th><Th>فترة الاشتراك</Th>
                  <Th>المستحق</Th><Th>المدفوع</Th><Th>المتبقي</Th><Th>الحالة</Th><Th></Th>
                </Tr>
              </THead>
              <TBody>
                {(subs ?? []).map((s: any) => (
                  <Tr key={s.id}>
                    <Td className="font-medium">{s.players?.full_name}</Td>
                    <Td className="ltr-numbers font-mono">{s.players?.code}</Td>
                    <Td className="text-xs">{formatDate(s.period_start)} → {formatDate(s.period_end)}</Td>
                    <Td>{formatCurrency(s.amount_due)}</Td>
                    <Td>{formatCurrency(s.amount_paid)}</Td>
                    <Td>{formatCurrency(Number(s.amount_due) - Number(s.amount_paid))}</Td>
                    <Td>
                      <Badge variant={s.status === "paid" ? "success" : s.status === "partial" ? "warning" : "destructive"}>
                        {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                      </Badge>
                    </Td>
                    <Td className="text-left">
                      <Link href={`/academy/${academyId}/finance/subscriptions/${s.id}`} className="text-primary text-sm hover:underline">دفعة / طباعة</Link>
                    </Td>
                  </Tr>
                ))}
                {(subs ?? []).length === 0 && (
                  <Tr><Td colSpan={8} className="text-center text-muted-foreground py-8">لا توجد إيصالات مطابقة</Td></Tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 ${highlight ? "text-warning" : ""}`}>{value}</div>
    </div>
  );
}
