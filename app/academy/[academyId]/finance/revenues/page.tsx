import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addRevenue, deleteRevenue } from "./actions";
import { PrintExport } from "@/components/print-export";

export default async function RevenuesPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyManager(academyId);
  const sb = await createClient();

  const today = new Date();
  const fromDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const toDefault = today.toISOString().slice(0, 10);
  const from = sp.from ?? fromDefault;
  const to = sp.to ?? toDefault;

  const [{ data: payments }, { data: extras }] = await Promise.all([
    sb.from("payments")
      .select("id, amount, paid_at, method, receipt_no, subscriptions(players(full_name, code))")
      .eq("academy_id", academyId)
      .gte("paid_at", `${from}T00:00:00`)
      .lte("paid_at", `${to}T23:59:59`)
      .order("paid_at", { ascending: false }),
    sb.from("extra_revenues")
      .select("*")
      .eq("academy_id", academyId)
      .gte("received_at", from)
      .lte("received_at", to)
      .order("received_at", { ascending: false }),
  ]);

  const subTotal = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const extraTotal = (extras ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);

  // Combined unified table
  const unified = [
    ...(payments ?? []).map((p: any) => ({
      id: `p-${p.id}`,
      date: p.paid_at,
      type: "اشتراك",
      source: p.subscriptions?.players?.full_name
        ? `${p.subscriptions.players.full_name} (${p.subscriptions.players.code})`
        : "—",
      details: p.method ?? "—",
      receipt: String(p.receipt_no),
      amount: Number(p.amount),
    })),
    ...(extras ?? []).map((r: any) => ({
      id: `r-${r.id}`,
      date: r.received_at,
      type: "إيراد إضافي",
      source: r.source,
      details: r.notes ?? "—",
      receipt: "—",
      amount: Number(r.amount),
      _extraId: r.id,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <PageHeader
        title="الإيرادات"
        description="كل واردات الأكاديمية: اشتراكات اللاعبين والإيرادات الإضافية"
        actions={<PrintExport filename={`revenues-${from}-${to}`} />}
        hidePrint
      />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5"><Label htmlFor="from">من</Label><Input id="from" name="from" type="date" defaultValue={from} /></div>
              <div className="space-y-1.5"><Label htmlFor="to">إلى</Label><Input id="to" name="to" type="date" defaultValue={to} /></div>
              <Button type="submit" variant="outline">تطبيق</Button>
              <div className="flex-1 min-w-48 grid grid-cols-2 gap-3">
                <Stat label="الاشتراكات" value={formatCurrency(subTotal)} />
                <Stat label="إيرادات إضافية" value={formatCurrency(extraTotal)} />
                <Stat label="الإجمالي" value={formatCurrency(subTotal + extraTotal)} highlight />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>إضافة إيراد إضافي (رعاية، تبرع، إلخ)</CardTitle></CardHeader>
          <CardContent>
            <form action={async (fd) => { "use server"; await addRevenue(academyId, fd); }}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5"><Label htmlFor="source">المصدر</Label><Input id="source" name="source" required /></div>
              <div className="space-y-1.5"><Label htmlFor="amount">القيمة</Label><Input id="amount" name="amount" type="number" step="0.01" required /></div>
              <div className="space-y-1.5"><Label htmlFor="received_at">التاريخ</Label><Input id="received_at" name="received_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div className="space-y-1.5 md:col-span-1"><Label htmlFor="notes">ملاحظات</Label><Input id="notes" name="notes" /></div>
              <Button type="submit">حفظ</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>كل الواردات في الفترة</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr><Th>التاريخ</Th><Th>النوع</Th><Th>المصدر</Th><Th>التفاصيل</Th><Th>رقم الإيصال</Th><Th>القيمة</Th><Th></Th></Tr>
              </THead>
              <TBody>
                {unified.map((r) => (
                  <Tr key={r.id}>
                    <Td>{formatDate(r.date, true)}</Td>
                    <Td><Badge variant={r.type === "اشتراك" ? "default" : "muted"}>{r.type}</Badge></Td>
                    <Td className="font-medium">{r.source}</Td>
                    <Td className="text-xs text-muted-foreground">{r.details}</Td>
                    <Td className="ltr-numbers font-mono">{r.receipt}</Td>
                    <Td>{formatCurrency(r.amount)}</Td>
                    <Td className="text-left">
                      {(r as any)._extraId && (
                        <form action={async () => { "use server"; await deleteRevenue(academyId, (r as any)._extraId); }}>
                          <button className="text-destructive text-xs hover:underline" type="submit">حذف</button>
                        </form>
                      )}
                    </Td>
                  </Tr>
                ))}
                {unified.length === 0 && <Tr><Td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد إيرادات في الفترة</Td></Tr>}
                {unified.length > 0 && (
                  <Tr className="bg-muted/30 font-bold">
                    <Td colSpan={5} className="text-left">الإجمالي</Td>
                    <Td>{formatCurrency(subTotal + extraTotal)}</Td>
                    <Td></Td>
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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-md border ${highlight ? "bg-primary/5 border-primary/30" : "border-border"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-bold ${highlight ? "text-primary text-lg" : ""}`}>{value}</div>
    </div>
  );
}
