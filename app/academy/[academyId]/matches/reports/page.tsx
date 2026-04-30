import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { PrintExport } from "@/components/print-export";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatchReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ from?: string; to?: string; type?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  let q = sb.from("matches")
    .select("id, match_date, opponent, our_score, their_score, match_type, venue")
    .eq("academy_id", academyId)
    .order("match_date", { ascending: false });

  if (sp.from) q = q.gte("match_date", sp.from);
  if (sp.to) q = q.lte("match_date", `${sp.to}T23:59:59`);
  if (sp.type === "home" || sp.type === "away") q = q.eq("match_type", sp.type);

  const { data: matches } = await q;

  const matchIds = (matches ?? []).map((m) => m.id);

  let parts: any[] = [];
  if (matchIds.length > 0) {
    const { data } = await sb.from("match_participations")
      .select("match_id, player_id, lineup_role, minutes_played, goals, yellow_cards, red_cards, players(full_name, code, position)")
      .in("match_id", matchIds);
    parts = data ?? [];
  }

  // Aggregates
  const total = (matches ?? []).length;
  const decided = (matches ?? []).filter((m: any) => m.our_score != null && m.their_score != null);
  const wins = decided.filter((m: any) => m.our_score > m.their_score).length;
  const losses = decided.filter((m: any) => m.our_score < m.their_score).length;
  const draws = decided.filter((m: any) => m.our_score === m.their_score).length;
  const goalsFor = decided.reduce((s: number, m: any) => s + (m.our_score ?? 0), 0);
  const goalsAgainst = decided.reduce((s: number, m: any) => s + (m.their_score ?? 0), 0);
  const winRate = decided.length > 0 ? Math.round((wins / decided.length) * 100) : 0;

  // Top performers
  type Agg = { name: string; code: string; position: string; goals: number; minutes: number; yellows: number; reds: number; matches: number };
  const byPlayer = new Map<string, Agg>();
  for (const p of parts) {
    const key = p.player_id;
    const cur = byPlayer.get(key) ?? {
      name: p.players?.full_name ?? "—",
      code: p.players?.code ?? "",
      position: p.players?.position ?? "—",
      goals: 0, minutes: 0, yellows: 0, reds: 0, matches: 0,
    };
    cur.goals += p.goals ?? 0;
    cur.minutes += p.minutes_played ?? 0;
    cur.yellows += p.yellow_cards ?? 0;
    cur.reds += p.red_cards ?? 0;
    if (p.lineup_role === "starting" || p.lineup_role === "bench") cur.matches += 1;
    byPlayer.set(key, cur);
  }
  const players = [...byPlayer.values()];
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const topMinutes = [...players].sort((a, b) => b.minutes - a.minutes).slice(0, 10);
  const topYellows = [...players].filter((p) => p.yellows > 0).sort((a, b) => b.yellows - a.yellows).slice(0, 10);
  const topReds = [...players].filter((p) => p.reds > 0).sort((a, b) => b.reds - a.reds).slice(0, 10);

  return (
    <>
      <PageHeader
        title="التقارير الرياضية"
        description="ملخصات وإحصائيات تفصيلية مبنية على المباريات المسجلة"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/academy/${academyId}/matches`}>← العودة للمباريات</Link>
            </Button>
            <PrintExport filename={`matches-report-${new Date().toISOString().slice(0,10)}`} />
          </>
        }
      />
      <PageBody>
        {/* Filters */}
        <Card className="mb-4 no-print">
          <CardContent className="pt-6">
            <form className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5"><Label htmlFor="from">من تاريخ</Label><Input id="from" name="from" type="date" defaultValue={sp.from ?? ""} /></div>
              <div className="space-y-1.5"><Label htmlFor="to">إلى تاريخ</Label><Input id="to" name="to" type="date" defaultValue={sp.to ?? ""} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="type">نوع المباراة</Label>
                <select id="type" name="type" defaultValue={sp.type ?? ""} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  <option value="home">داخلي</option>
                  <option value="away">خارجي</option>
                </select>
              </div>
              <Button type="submit">تطبيق</Button>
              <Button asChild variant="ghost"><Link href={`/academy/${academyId}/matches/reports`}>مسح</Link></Button>
            </form>
          </CardContent>
        </Card>

        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <StatBox label="مباريات" value={total} />
          <StatBox label="فوز" value={wins} tone="success" />
          <StatBox label="تعادل" value={draws} tone="muted" />
          <StatBox label="خسارة" value={losses} tone="danger" />
          <StatBox label="نسبة الفوز" value={`${winRate}%`} />
          <StatBox label={`الأهداف ${goalsFor} : ${goalsAgainst}`} value={goalsFor - goalsAgainst >= 0 ? `+${goalsFor - goalsAgainst}` : `${goalsFor - goalsAgainst}`} tone={goalsFor - goalsAgainst >= 0 ? "success" : "danger"} />
        </div>

        {/* Top performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Leaderboard
            title="🥇 أعلى الهدافين"
            rows={topScorers}
            valueKey="goals"
            valueLabel="هدف"
          />
          <Leaderboard
            title="⏱ أكثر اللاعبين دقائق"
            rows={topMinutes}
            valueKey="minutes"
            valueLabel="دقيقة"
          />
          <Leaderboard
            title="🟨 أكثر البطاقات الصفراء"
            rows={topYellows}
            valueKey="yellows"
            valueLabel="بطاقة"
            empty="لا توجد بطاقات صفراء"
          />
          <Leaderboard
            title="🟥 البطاقات الحمراء"
            rows={topReds}
            valueKey="reds"
            valueLabel="بطاقة"
            empty="لا توجد بطاقات حمراء"
          />
        </div>

        {/* Match list */}
        <Card>
          <CardHeader><CardTitle className="text-base">المباريات في النطاق المحدد</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>التاريخ</Th>
                  <Th>الخصم</Th>
                  <Th>النوع</Th>
                  <Th>الملعب</Th>
                  <Th>النتيجة</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {(matches ?? []).map((m: any) => {
                  const r = m.our_score == null ? null
                    : m.our_score > m.their_score ? "win"
                    : m.our_score < m.their_score ? "loss" : "draw";
                  return (
                    <Tr key={m.id}>
                      <Td>{formatDate(m.match_date, true)}</Td>
                      <Td className="font-medium">{m.opponent}</Td>
                      <Td><Badge variant={m.match_type === "home" ? "success" : "muted"}>{m.match_type === "home" ? "داخلي" : "خارجي"}</Badge></Td>
                      <Td className="text-xs">{m.venue ?? "—"}</Td>
                      <Td className="ltr-numbers">
                        {m.our_score ?? "-"} : {m.their_score ?? "-"}
                        {r && <Badge className="ms-2" variant={r === "win" ? "success" : r === "loss" ? "destructive" : "muted"}>{r === "win" ? "فوز" : r === "loss" ? "خسارة" : "تعادل"}</Badge>}
                      </Td>
                      <Td className="text-left no-print"><Link href={`/academy/${academyId}/matches/${m.id}`} className="text-primary text-sm hover:underline">عرض</Link></Td>
                    </Tr>
                  );
                })}
                {(matches ?? []).length === 0 && (
                  <Tr><Td colSpan={6} className="text-center text-muted-foreground py-8">لا توجد مباريات في النطاق المحدد</Td></Tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "danger" | "muted" }) {
  const cls = tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-600" : tone === "muted" ? "text-muted-foreground" : "text-emerald-900";
  return (
    <div className="rounded-xl bg-white border border-border p-3 text-center">
      <div className={`text-2xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Leaderboard({
  title, rows, valueKey, valueLabel, empty = "لا توجد بيانات",
}: {
  title: string;
  rows: any[];
  valueKey: "goals" | "minutes" | "yellows" | "reds";
  valueLabel: string;
  empty?: string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{empty}</p>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r, i) => (
              <li key={`${r.code}-${i}`} className="flex items-center gap-3 text-sm">
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  i === 0 ? "bg-amber-400 text-emerald-950" :
                  i === 1 ? "bg-gray-300 text-emerald-950" :
                  i === 2 ? "bg-amber-700 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {r.code} · {r.position} · {r.matches} مباراة
                  </div>
                </div>
                <div className="text-lg font-black ltr-numbers text-emerald-700">
                  {r[valueKey]}
                </div>
                <div className="text-[10px] text-muted-foreground">{valueLabel}</div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
