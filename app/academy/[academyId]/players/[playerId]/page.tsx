import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { signedUrl } from "@/lib/storage";
import Link from "next/link";
import { AttendanceTrend } from "@/components/attendance-trend";

export default async function PlayerProfilePage({ params }: { params: Promise<{ academyId: string; playerId: string }> }) {
  const { academyId, playerId } = await params;
  const me = await requireAcademyAccess(academyId);
  const sb = await createClient();
  const [{ data: p }, { data: attSummary }, { data: matchSummary }, { data: roi }, { data: injuries }, { data: subs }, { data: attRecords }, { data: matchParts }] = await Promise.all([
    sb.from("players").select("*, categories(name, monthly_fee)").eq("id", playerId).maybeSingle(),
    sb.from("player_attendance_summary").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("player_match_summary").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("player_roi").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("injuries").select("*").eq("player_id", playerId).order("occurred_at", { ascending: false }),
    sb.from("subscriptions").select("*").eq("player_id", playerId).order("period_start", { ascending: false }),
    sb.from("attendance_records")
      .select("status, recorded_at, trainings!inner(scheduled_at)")
      .eq("player_id", playerId),
    sb.from("match_participations")
      .select("goals, yellow_cards, red_cards, sent_off, minutes_played, notes, matches!inner(id, opponent, match_date, our_score, their_score, duration_min)")
      .eq("player_id", playerId)
      .order("match_date", { ascending: false, referencedTable: "matches" }),
  ]);

  if (!p) return <PageBody><p>اللاعب غير موجود</p></PageBody>;
  const photo = await signedUrl(p.photo_url);
  const isManager = me.isSuperAdmin || me.managedAcademyIds.includes(academyId);

  return (
    <>
      <PageHeader
        title={p.full_name}
        description={`الكود: ${p.code} • ${p.categories?.name ?? "بدون تصنيف"}`}
        actions={
          <>
            {isManager && (
              <Button asChild variant="outline">
                <Link href={`/academy/${academyId}/players/${playerId}/edit`}>تعديل</Link>
              </Button>
            )}
            <Button asChild variant="gold">
              <Link href={`/academy/${academyId}/players/${playerId}/card`}>بطاقة العضوية</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/academy/${academyId}/players/${playerId}/print`}>🖨 طباعة الملف</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>البيانات</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex justify-center mb-4">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-primary/20" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted" />
                )}
              </div>
              <Row k="تاريخ الميلاد" v={formatDate(p.birth_date)} />
              <Row k="الهاتف" v={p.phone || "—"} />
              <Row k="البريد" v={p.email || "—"} />
              <Row k="ولي الأمر" v={p.guardian_name || "—"} />
              <Row k="هاتف الولي" v={p.guardian_phone || "—"} />
              <Row k="الرقم القومي" v={p.national_id || "—"} />
              <Row k="الحالة" v={<Badge variant={p.status === "active" ? "success" : "muted"}>{p.status === "active" ? "نشط" : p.status === "suspended" ? "موقوف" : "مؤرشف"}</Badge>} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الأداء</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <Row k="نسبة الحضور" v={`${attSummary?.attendance_pct ?? 0}%`} />
              <Row k="حضور" v={String(attSummary?.present_count ?? 0)} />
              <Row k="غياب" v={String(attSummary?.absent_count ?? 0)} />
              <Row k="تأخير" v={String(attSummary?.late_count ?? 0)} />
              <Row k="مباريات" v={String(matchSummary?.matches_played ?? 0)} />
              <Row k="أهداف" v={String(matchSummary?.goals ?? 0)} />
              <Row k="صفراء/حمراء" v={`${matchSummary?.yellow_cards ?? 0} / ${matchSummary?.red_cards ?? 0}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الاشتراك والحضور</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <Row k="الاشتراك الشهري" v={formatCurrency(roi?.monthly_fee ?? 0)} />
              <Row k="ساعات الحضور" v={String(Math.round((Number(roi?.attended_hours ?? 0)) * 100) / 100)} />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader><CardTitle>تطور نسبة الحضور</CardTitle></CardHeader>
          <CardContent>
            <AttendanceTrend records={((attRecords ?? []) as any[]).map((r: any) => ({
              date: r.trainings?.scheduled_at ?? r.recorded_at,
              status: r.status,
            }))} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>إيصالات السداد</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr><Th>الفترة</Th><Th>المبلغ</Th><Th>المدفوع</Th><Th>المتبقي</Th><Th>الحالة</Th><Th></Th></Tr>
              </THead>
              <TBody>
                {(subs ?? []).map((s: any) => (
                  <Tr key={s.id}>
                    <Td className="ltr-numbers text-xs">{formatDate(s.period_start)} → {formatDate(s.period_end)}</Td>
                    <Td>{formatCurrency(s.amount_due)}</Td>
                    <Td>{formatCurrency(s.amount_paid)}</Td>
                    <Td>{formatCurrency(Number(s.amount_due) - Number(s.amount_paid))}</Td>
                    <Td><Badge variant={s.status === "paid" ? "success" : s.status === "partial" ? "warning" : "destructive"}>
                      {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                    </Badge></Td>
                    <Td className="text-left">
                      <Link href={`/academy/${academyId}/finance/subscriptions/${s.id}`} className="text-primary text-sm hover:underline">عرض</Link>
                    </Td>
                  </Tr>
                ))}
                {(subs ?? []).length === 0 && <Tr><Td colSpan={6} className="text-center text-muted-foreground py-6">لا توجد إيصالات</Td></Tr>}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>سجل المباريات والبطاقات</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>التاريخ</Th>
                  <Th>الخصم</Th>
                  <Th>النتيجة</Th>
                  <Th>الدقائق</Th>
                  <Th>أهداف</Th>
                  <Th>إنذار (صفراء)</Th>
                  <Th>طرد (حمراء)</Th>
                  <Th>ملاحظات</Th>
                </Tr>
              </THead>
              <TBody>
                {((matchParts ?? []) as any[]).map((mp, i) => {
                  const m = mp.matches;
                  return (
                    <Tr key={`${m?.id}-${i}`}>
                      <Td>{formatDate(m?.match_date, true)}</Td>
                      <Td className="font-medium">
                        <Link href={`/academy/${academyId}/matches/${m?.id}`} className="hover:underline">
                          {m?.opponent}
                        </Link>
                      </Td>
                      <Td className="ltr-numbers">{m?.our_score ?? "-"} : {m?.their_score ?? "-"}</Td>
                      <Td>{mp.minutes_played ?? 0} / {m?.duration_min ?? 90}</Td>
                      <Td>{mp.goals ?? 0}</Td>
                      <Td>
                        {mp.yellow_cards > 0 ? (
                          <Badge variant="warning">{mp.yellow_cards}</Badge>
                        ) : "—"}
                      </Td>
                      <Td>
                        {mp.red_cards > 0 || mp.sent_off ? (
                          <Badge variant="destructive">{mp.red_cards || (mp.sent_off ? 1 : 0)}</Badge>
                        ) : "—"}
                      </Td>
                      <Td className="text-xs text-muted-foreground">{mp.notes ?? "—"}</Td>
                    </Tr>
                  );
                })}
                {(matchParts ?? []).length === 0 && (
                  <Tr><Td colSpan={8} className="text-center text-muted-foreground py-6">لا توجد مشاركات في مباريات</Td></Tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>السجل الصحي (الإصابات)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><Tr><Th>التاريخ</Th><Th>المصدر</Th><Th>النوع</Th><Th>المكان</Th><Th>العودة المتوقعة</Th><Th>ملاحظات</Th></Tr></THead>
              <TBody>
                {(injuries ?? []).map((i: any) => (
                  <Tr key={i.id}>
                    <Td>{formatDate(i.occurred_at)}</Td>
                    <Td>{i.source === "match" ? "مباراة" : "تدريب"}</Td>
                    <Td>{i.injury_type ?? "—"}</Td>
                    <Td>{i.body_location ?? "—"}</Td>
                    <Td>{formatDate(i.expected_return_at)}</Td>
                    <Td className="text-xs text-muted-foreground">{i.notes ?? "—"}</Td>
                  </Tr>
                ))}
                {(injuries ?? []).length === 0 && <Tr><Td colSpan={6} className="text-center text-muted-foreground py-6">لا توجد إصابات مسجلة</Td></Tr>}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
