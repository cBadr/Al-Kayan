import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { recordPayment, deleteSubscription } from "../actions";
import Link from "next/link";

export default async function SubscriptionDetail({ params }: { params: Promise<{ academyId: string; subId: string }> }) {
  const { academyId, subId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const [{ data: sub }, { data: payments }] = await Promise.all([
    sb.from("subscriptions").select("*, players(code, full_name, photo_url)").eq("id", subId).maybeSingle(),
    sb.from("payments").select("*").eq("subscription_id", subId).order("paid_at", { ascending: false }),
  ]);
  if (!sub) return <PageBody><p>الإيصال غير موجود</p></PageBody>;
  const remaining = Number(sub.amount_due) - Number(sub.amount_paid);

  return (
    <>
      <PageHeader
        title={`إيصال — ${sub.players?.full_name}`}
        description={`فترة ${formatDate(sub.period_start)} → ${formatDate(sub.period_end)} • الكود: ${sub.players?.code}`}
        actions={
          payments && payments.length > 0 ? (
            <Button asChild variant="outline">
              <Link href={`/academy/${academyId}/finance/receipts/${payments[0].id}`}>طباعة آخر إيصال</Link>
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>الملخص</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="فترة الاشتراك" v={`${formatDate(sub.period_start)} → ${formatDate(sub.period_end)}`} />
              <Row k="المستحق" v={formatCurrency(sub.amount_due)} />
              <Row k="المدفوع" v={formatCurrency(sub.amount_paid)} />
              <Row k="المتبقي" v={<span className="text-warning font-bold">{formatCurrency(remaining)}</span>} />
              <Row k="الحالة" v={sub.status === "paid" ? "مدفوع" : sub.status === "partial" ? "جزئي" : "غير مدفوع"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>تسجيل دفعة</CardTitle></CardHeader>
            <CardContent>
              {remaining > 0 ? (
                <form action={async (fd) => { "use server"; await recordPayment(academyId, subId, fd); }} className="space-y-3">
                  <div className="space-y-1.5"><Label htmlFor="amount">المبلغ</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" min="0.01" max={remaining} required />
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="method">طريقة الدفع</Label>
                    <Input id="method" name="method" placeholder="نقدي / تحويل / فيزا..." />
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="notes">ملاحظات</Label><Input id="notes" name="notes" /></div>
                  <Button type="submit">حفظ الدفعة وإصدار إيصال</Button>
                </form>
              ) : (
                <p className="text-success font-medium">✓ هذا الإيصال مدفوع بالكامل. سيُولَّد الإيصال التالي تلقائياً عند نهاية الفترة.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader><CardTitle>دفعات هذا الإيصال</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><Tr><Th>رقم الإيصال</Th><Th>المبلغ</Th><Th>التاريخ</Th><Th>الطريقة</Th><Th></Th></Tr></THead>
              <TBody>
                {(payments ?? []).map((p: any) => (
                  <Tr key={p.id}>
                    <Td className="ltr-numbers font-mono">{p.receipt_no}</Td>
                    <Td>{formatCurrency(p.amount)}</Td>
                    <Td>{formatDate(p.paid_at, true)}</Td>
                    <Td>{p.method ?? "—"}</Td>
                    <Td className="text-left">
                      <Link href={`/academy/${academyId}/finance/receipts/${p.id}`} className="text-primary text-sm hover:underline">طباعة</Link>
                    </Td>
                  </Tr>
                ))}
                {(payments ?? []).length === 0 && <Tr><Td colSpan={5} className="text-center text-muted-foreground py-6">لم تُسجَّل دفعات بعد</Td></Tr>}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <form action={async () => { "use server"; await deleteSubscription(academyId, subId); }}>
            <Button type="submit" variant="destructive">حذف هذا الإيصال</Button>
          </form>
        </div>
      </PageBody>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
