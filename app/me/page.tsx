import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/logo";
import { signedUrl } from "@/lib/storage";

export default async function MePage() {
  const me = await requireUser();
  const sb = await createClient();
  const { data: players } = await sb.from("players")
    .select("*, academies(name), categories(name, monthly_fee)")
    .eq("user_id", me.id);
  const player = (players ?? [])[0];

  if (!player) {
    return (
      <div className="flex-1 bg-mesh-emerald flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto"><BrandLogo className="w-16 h-16" rounded="rounded-2xl" /></div>
            <p className="text-muted-foreground">لم يتم ربط حسابك بأي لاعب بعد. تواصل مع الأكاديمية.</p>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const photo = await signedUrl(player.photo_url);
  const { data: subs } = await sb.from("subscriptions").select("*").eq("player_id", player.id).order("period_start", { ascending: false });
  const { data: notifications } = await sb.from("notifications").select("*").eq("recipient_user_id", me.id).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="flex-1 bg-pitch">
      {/* Hero player card */}
      <div className="bg-mesh-emerald text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 80% 50%, white 0.5px, transparent 0.5px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="max-w-5xl mx-auto px-6 py-10 relative z-10 flex items-center gap-6 flex-wrap">
          <div className="avatar-ring">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-emerald-900 flex items-center justify-center">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl text-gold-400 font-black">
                  {player.full_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">{player.academies?.name}</div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{player.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="chip chip-gold">⚽ {player.categories?.name ?? "—"}</span>
              <span className="chip text-white border-white/20 bg-white/10">
                <span className="ltr-numbers">رقم {player.code}</span>
              </span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
          <Card>
            <CardHeader><CardTitle>إيصالات السداد</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><Tr><Th>الفترة</Th><Th>المستحق</Th><Th>المتبقي</Th><Th>الحالة</Th></Tr></THead>
                <TBody>
                  {(subs ?? []).map((s: any) => (
                    <Tr key={s.id}>
                      <Td className="text-xs">{formatDate(s.period_start)} → {formatDate(s.period_end)}</Td>
                      <Td>{formatCurrency(s.amount_due)}</Td>
                      <Td>{formatCurrency(Number(s.amount_due) - Number(s.amount_paid))}</Td>
                      <Td><Badge variant={s.status === "paid" ? "success" : s.status === "partial" ? "warning" : "destructive"}>
                        {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                      </Badge></Td>
                    </Tr>
                  ))}
                  {(subs ?? []).length === 0 && <Tr><Td colSpan={4} className="text-center py-4 text-muted-foreground">لا توجد إيصالات</Td></Tr>}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الإشعارات الأخيرة</CardTitle></CardHeader>
            <CardContent>
              {(notifications ?? []).length === 0 && <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>}
              <ul className="space-y-3">
                {(notifications ?? []).map((n: any) => (
                  <li key={n.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex justify-between gap-2 items-start">
                      <span className="font-semibold text-emerald-950">{n.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(n.created_at, true)}</span>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.body}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
