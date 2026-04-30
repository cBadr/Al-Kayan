import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintExport } from "@/components/print-export";
import { signedUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ReceiptPage({ params }: { params: Promise<{ academyId: string; paymentId: string }> }) {
  const { academyId, paymentId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: p } = await sb
    .from("payments")
    .select("*, subscriptions(amount_due, amount_paid, period_start, period_end, players(code, full_name, photo_url)), academies:academy_id(name, logo_url, seal_url, manager_signature_url, manager_name, settings, address, phone)")
    .eq("id", paymentId)
    .maybeSingle();

  if (!p) return <p className="p-6">الإيصال غير موجود</p>;
  const sub = p.subscriptions;
  const player = sub.players;
  const academy = p.academies;
  const remaining = Number(sub.amount_due) - Number(sub.amount_paid);
  const footer = (academy.settings as any)?.receipt_footer ?? "";
  const photo = await signedUrl(player.photo_url);

  return (
    <div className="bg-white">
      <div className="no-print p-4 border-b border-border flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/academy/${academyId}/finance/subscriptions/${p.subscription_id}`}>← العودة</Link>
          </Button>
          <h1 className="font-bold text-lg">إيصال سداد رقم <span className="ltr-numbers">{p.receipt_no}</span></h1>
        </div>
        <PrintExport filename={`receipt-${p.receipt_no}`} />
      </div>

      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-primary pb-6 mb-6">
          {academy.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={academy.logo_url} alt="" className="h-16 mx-auto mb-3" />
          )}
          <h2 className="text-2xl font-bold text-primary">{academy.name}</h2>
          {academy.address && <p className="text-sm text-muted-foreground mt-1">{academy.address}</p>}
          {academy.phone && <p className="text-sm text-muted-foreground" dir="ltr">{academy.phone}</p>}
        </div>

        <h3 className="text-xl font-bold text-center mb-6">إيصال سداد اشتراك</h3>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-2 text-sm">
            <Row k="رقم الإيصال" v={<span className="ltr-numbers font-mono">{p.receipt_no}</span>} />
            <Row k="التاريخ" v={formatDate(p.paid_at, true)} />
            <Row k="فترة الاشتراك" v={`${formatDate(sub.period_start)} → ${formatDate(sub.period_end)}`} />
            <Row k="طريقة الدفع" v={p.method ?? "نقدي"} />
          </div>
          <div className="flex flex-col items-center">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="w-24 h-24 rounded-full object-cover mb-2" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted mb-2" />
            )}
            <div className="font-bold">{player.full_name}</div>
            <div className="text-sm text-muted-foreground ltr-numbers font-mono">{player.code}</div>
          </div>
        </div>

        <table className="w-full border border-border text-sm mb-8">
          <tbody>
            <tr className="border-b border-border"><td className="p-3 bg-muted/30">قيمة الاشتراك</td><td className="p-3 text-left">{formatCurrency(sub.amount_due)}</td></tr>
            <tr className="border-b border-border"><td className="p-3 bg-muted/30">المبلغ المسدَّد (هذا الإيصال)</td><td className="p-3 text-left font-bold">{formatCurrency(p.amount)}</td></tr>
            <tr className="border-b border-border"><td className="p-3 bg-muted/30">إجمالي المسدَّد للفترة</td><td className="p-3 text-left">{formatCurrency(sub.amount_paid)}</td></tr>
            <tr><td className="p-3 bg-muted/30">المتبقي</td><td className="p-3 text-left text-warning font-bold">{formatCurrency(remaining)}</td></tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="mt-10 grid grid-cols-2 gap-6 text-center text-xs">
          <div>
            <div className="relative h-20 border-b border-emerald-300 mb-2 flex items-center justify-center">
              {(academy as any).manager_signature_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(academy as any).manager_signature_url}
                  alt=""
                  className="max-h-16 max-w-40 object-contain"
                />
              )}
            </div>
            <p className="text-muted-foreground">
              {(academy as any).manager_name ? `المدير / ${(academy as any).manager_name}` : "المدير"}
            </p>
          </div>
          <div>
            <div className="relative h-20 border-b border-emerald-300 mb-2 flex items-center justify-center">
              {(academy as any).seal_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(academy as any).seal_url}
                  alt=""
                  className="max-h-20 max-w-24 object-contain opacity-90"
                />
              )}
            </div>
            <p className="text-muted-foreground">ختم الأكاديمية</p>
          </div>
        </div>

        {footer && <p className="text-center text-xs text-muted-foreground border-t border-border pt-4 mt-6">{footer}</p>}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
