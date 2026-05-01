import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { createMatch } from "./actions";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ q?: string; type?: string; result?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  // Build matches query with filters
  let q = sb.from("matches").select("*").eq("academy_id", academyId).order("match_date", { ascending: false });
  if (sp.q) q = q.ilike("opponent", `%${sp.q}%`);
  if (sp.type === "home" || sp.type === "away") q = q.eq("match_type", sp.type);

  const { data: matchesRaw } = await q;
  let matches = matchesRaw ?? [];

  // Filter by result client-side (since we need score comparison)
  if (sp.result === "win") matches = matches.filter((m) => m.our_score != null && m.their_score != null && m.our_score > m.their_score);
  else if (sp.result === "loss") matches = matches.filter((m) => m.our_score != null && m.their_score != null && m.our_score < m.their_score);
  else if (sp.result === "draw") matches = matches.filter((m) => m.our_score != null && m.their_score != null && m.our_score === m.their_score);

  // Fetch totals separately and join in JS (Supabase can't auto-join a view without FK)
  const matchIds = matches.map((m) => m.id);
  let totalsMap = new Map<string, { starting: number; bench: number; yellows: number; reds: number; goals: number }>();
  if (matchIds.length > 0) {
    const { data: totals } = await sb
      .from("match_team_totals")
      .select("match_id, starting_count, bench_count, yellows, reds, goals")
      .in("match_id", matchIds);
    for (const t of totals ?? []) {
      totalsMap.set(t.match_id, {
        starting: t.starting_count ?? 0,
        bench: t.bench_count ?? 0,
        yellows: t.yellows ?? 0,
        reds: t.reds ?? 0,
        goals: t.goals ?? 0,
      });
    }
  }

  // Headline stats (across all filtered matches)
  const decided = matches.filter((m) => m.our_score != null && m.their_score != null);
  const wins = decided.filter((m) => m.our_score! > m.their_score!).length;
  const losses = decided.filter((m) => m.our_score! < m.their_score!).length;
  const draws = decided.filter((m) => m.our_score! === m.their_score!).length;
  const goalsFor = decided.reduce((s, m) => s + (m.our_score ?? 0), 0);
  const goalsAgainst = decided.reduce((s, m) => s + (m.their_score ?? 0), 0);
  const winRate = decided.length > 0 ? Math.round((wins / decided.length) * 100) : 0;

  const upcoming = matches.find((m) => new Date(m.match_date).getTime() > Date.now());

  const filterChips = [
    { key: "result", value: "win", label: "فوز فقط" },
    { key: "result", value: "draw", label: "تعادل" },
    { key: "result", value: "loss", label: "خسارة" },
    { key: "type", value: "home", label: "🏠 داخلي" },
    { key: "type", value: "away", label: "✈️ خارجي" },
  ];

  return (
    <>
      <PageHeader
        title="المباريات"
        description="إدارة المباريات وقوائم اللاعبين والتشكيلة على الملعب"
        actions={
          <Button asChild variant="gold">
            <Link href={`/academy/${academyId}/matches/reports`}>📊 تقارير المباريات</Link>
          </Button>
        }
      />
      <PageBody>
        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          <Stat label="إجمالي" value={matches.length} />
          <Stat label="فوز" value={wins} tone="success" />
          <Stat label="تعادل" value={draws} tone="muted" />
          <Stat label="خسارة" value={losses} tone="danger" />
          <Stat label="نسبة الفوز" value={`${winRate}%`} />
          <Stat
            label={`أهداف ${goalsFor}:${goalsAgainst}`}
            value={goalsFor - goalsAgainst >= 0 ? `+${goalsFor - goalsAgainst}` : `${goalsFor - goalsAgainst}`}
            tone={goalsFor - goalsAgainst >= 0 ? "success" : "danger"}
          />
        </div>

        {/* Upcoming match banner */}
        {upcoming && (
          <Card className="mb-4 border-amber-300 bg-gradient-to-l from-amber-50 to-white">
            <CardContent className="pt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="warning">⏰ المباراة القادمة</Badge>
                <div className="font-bold text-lg mt-1">{upcoming.opponent}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {formatDate(upcoming.match_date, true)} • {upcoming.venue ?? "—"}
                </div>
              </div>
              <Button asChild>
                <Link href={`/academy/${academyId}/matches/${upcoming.id}`}>
                  تجهيز التشكيلة →
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add match (collapsible) */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <details>
              <summary className="cursor-pointer font-bold text-emerald-900 select-none">
                ➕ إضافة مباراة جديدة
              </summary>
              <form
                action={async (fd) => { "use server"; await createMatch(academyId, fd); }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-4"
              >
                <div className="space-y-1.5"><Label htmlFor="opponent">الخصم *</Label><Input id="opponent" name="opponent" required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="match_type">نوع المباراة *</Label>
                  <select id="match_type" name="match_type" required defaultValue="home" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="home">داخلي</option>
                    <option value="away">خارجي</option>
                  </select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="venue">الملعب</Label><Input id="venue" name="venue" placeholder="مثل: ملعب نادي السلام" /></div>
                <div className="space-y-1.5"><Label htmlFor="match_date">التاريخ والوقت *</Label><Input id="match_date" name="match_date" type="datetime-local" required /></div>
                <div className="space-y-1.5"><Label htmlFor="duration_min">المدة (د)</Label><Input id="duration_min" name="duration_min" type="number" min="1" defaultValue={90} /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="formation">الخطة</Label>
                  <select id="formation" name="formation" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="">— —</option>
                    <option>4-4-2</option>
                    <option>4-3-3</option>
                    <option>4-2-3-1</option>
                    <option>3-5-2</option>
                  </select>
                </div>

                <div className="space-y-1.5"><Label htmlFor="our_score">لنا</Label><Input id="our_score" name="our_score" type="number" min="0" /></div>
                <div className="space-y-1.5"><Label htmlFor="their_score">للخصم</Label><Input id="their_score" name="their_score" type="number" min="0" /></div>
                <div></div>

                <div className="md:col-span-3 mt-3">
                  <h4 className="font-semibold text-sm text-emerald-900 mb-2">طاقم التحكيم</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label htmlFor="referee_name">اسم حكم الساحة</Label><Input id="referee_name" name="referee_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="referee_phone">موبايل حكم الساحة</Label><Input id="referee_phone" name="referee_phone" dir="ltr" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant1_name">اسم مساعد الحكم الأول</Label><Input id="assistant1_name" name="assistant1_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant1_phone">موبايل مساعد الحكم الأول</Label><Input id="assistant1_phone" name="assistant1_phone" dir="ltr" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant2_name">اسم مساعد الحكم الثاني</Label><Input id="assistant2_name" name="assistant2_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant2_phone">موبايل مساعد الحكم الثاني</Label><Input id="assistant2_phone" name="assistant2_phone" dir="ltr" /></div>
                    <div className="space-y-1.5"><Label htmlFor="observer_name">اسم مراقب المباراة</Label><Input id="observer_name" name="observer_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="observer_phone">موبايل مراقب المباراة</Label><Input id="observer_phone" name="observer_phone" dir="ltr" /></div>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5"><Label htmlFor="notes">ملاحظات</Label><Input id="notes" name="notes" /></div>

                <div className="md:col-span-3 flex justify-end"><Button type="submit">حفظ المباراة</Button></div>
              </form>
            </details>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="q">بحث عن خصم</Label>
                <Input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="اكتب اسم الفريق..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">النوع</Label>
                <select id="type" name="type" defaultValue={sp.type ?? ""} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  <option value="home">داخلي</option>
                  <option value="away">خارجي</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="result">النتيجة</Label>
                <select id="result" name="result" defaultValue={sp.result ?? ""} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  <option value="win">فوز</option>
                  <option value="draw">تعادل</option>
                  <option value="loss">خسارة</option>
                </select>
              </div>
              <Button type="submit">تطبيق</Button>
              {(sp.q || sp.type || sp.result) && (
                <Button asChild variant="ghost"><Link href={`/academy/${academyId}/matches`}>مسح</Link></Button>
              )}
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
              {filterChips.map((c) => {
                const isActive = (sp as any)[c.key] === c.value;
                const usp = new URLSearchParams();
                if (sp.q) usp.set("q", sp.q);
                if (!isActive) usp.set(c.key, c.value);
                else {
                  if (sp.type && c.key !== "type") usp.set("type", sp.type);
                  if (sp.result && c.key !== "result") usp.set("result", sp.result);
                }
                return (
                  <Link
                    key={`${c.key}-${c.value}`}
                    href={`/academy/${academyId}/matches?${usp.toString()}`}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      isActive ? "bg-emerald-700 text-white border-emerald-700" : "border-border hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Match cards grid */}
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              لا توجد مباريات. أضف مباراة جديدة من الزر أعلاه.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((m) => {
              const totals = totalsMap.get(m.id) ?? { starting: 0, bench: 0, yellows: 0, reds: 0, goals: 0 };
              const result = m.our_score == null ? null
                : m.our_score > m.their_score ? "win"
                : m.our_score < m.their_score ? "loss" : "draw";
              const isFuture = new Date(m.match_date).getTime() > Date.now();
              return (
                <MatchCard
                  key={m.id}
                  href={`/academy/${academyId}/matches/${m.id}`}
                  match={m}
                  totals={totals}
                  result={result}
                  isFuture={isFuture}
                />
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "danger" | "muted" }) {
  const cls = tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-600" : tone === "muted" ? "text-muted-foreground" : "text-emerald-900";
  return (
    <div className="rounded-xl bg-white border border-border p-3 text-center">
      <div className={`text-2xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function MatchCard({
  href, match: m, totals, result, isFuture,
}: {
  href: string;
  match: any;
  totals: { starting: number; bench: number; yellows: number; reds: number; goals: number };
  result: "win" | "loss" | "draw" | null;
  isFuture: boolean;
}) {
  const resultColor = result === "win" ? "from-emerald-700 to-emerald-600"
    : result === "loss" ? "from-red-700 to-red-600"
    : result === "draw" ? "from-gray-500 to-gray-400"
    : "from-emerald-900 to-emerald-700";

  return (
    <Link
      href={href}
      className="group block rounded-2xl overflow-hidden border border-border bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {/* Header strip */}
      <div className={`bg-gradient-to-l ${resultColor} text-white px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Badge variant={m.match_type === "home" ? "success" : "muted"} className="bg-white/20 text-white border-white/30">
            {m.match_type === "home" ? "🏠 داخلي" : "✈️ خارجي"}
          </Badge>
          {isFuture && <Badge className="bg-amber-400 text-emerald-950">قادمة</Badge>}
          {result && (
            <Badge className={`${result === "win" ? "bg-emerald-300" : result === "loss" ? "bg-red-300" : "bg-gray-300"} text-emerald-950`}>
              {result === "win" ? "فوز" : result === "loss" ? "خسارة" : "تعادل"}
            </Badge>
          )}
        </div>
        <span className="text-[10px] opacity-80" dir="ltr">{formatDate(m.match_date, true)}</span>
      </div>

      {/* Score */}
      <div className="px-4 py-5 grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">نحن</div>
          <div className="text-4xl font-black text-emerald-700 ltr-numbers mt-1">{m.our_score ?? "—"}</div>
        </div>
        <div className="text-center text-2xl font-bold text-muted-foreground">VS</div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate px-1">{m.opponent}</div>
          <div className="text-4xl font-black text-emerald-900 ltr-numbers mt-1">{m.their_score ?? "—"}</div>
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 pb-4 space-y-2 text-xs">
        {m.venue && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>📍</span>
            <span className="truncate">{m.venue}</span>
          </div>
        )}
        {m.formation && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>📋</span>
            <span>الخطة: <strong className="text-emerald-900">{m.formation}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border">
          <Mini label="أساسي" value={`${totals.starting}/11`} good={totals.starting === 11} />
          <Mini label="احتياطي" value={`${totals.bench}/9`} good={totals.bench === 9} />
          <Mini label="بطاقات" value={
            <span className="flex items-center gap-1.5 justify-center">
              <span className="text-amber-600">🟨{totals.yellows}</span>
              <span className="text-red-600">🟥{totals.reds}</span>
            </span>
          } />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border bg-muted/30 text-center text-xs font-semibold text-emerald-700 group-hover:bg-emerald-50 transition-colors">
        عرض الملعب والتشكيلة →
      </div>
    </Link>
  );
}

function Mini({ label, value, good }: { label: string; value: React.ReactNode; good?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-bold ltr-numbers ${good ? "text-emerald-700" : "text-emerald-950"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
