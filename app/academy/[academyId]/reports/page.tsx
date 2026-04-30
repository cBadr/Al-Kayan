import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { PlayerReports } from "./player-reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    position?: string;
    from?: string;
    to?: string;
    view?: "summary" | "discipline" | "minutes";
  }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const [
    { data: categories },
    { data: playersRaw },
    { data: discipline },
    { data: matchSummary },
    { data: attSummary },
    { data: roi },
  ] = await Promise.all([
    sb.from("categories").select("id, name").eq("academy_id", academyId).order("name"),
    sb.from("players")
      .select("id, code, full_name, position, status, category_id, suspension_reason, categories(name)")
      .eq("academy_id", academyId)
      .order("full_name"),
    sb.from("player_discipline").select("*").eq("academy_id", academyId),
    sb.from("player_match_summary").select("*").eq("academy_id", academyId),
    sb.from("player_attendance_summary").select("*").eq("academy_id", academyId),
    sb.from("player_roi").select("*").eq("academy_id", academyId),
  ]);

  // Apply filters
  let players = playersRaw ?? [];
  if (sp.q) {
    const q = sp.q.toLowerCase();
    players = players.filter((p) =>
      p.full_name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }
  if (sp.category) players = players.filter((p) => p.category_id === sp.category);
  if (sp.status) players = players.filter((p) => p.status === sp.status);
  if (sp.position) players = players.filter((p) => p.position === sp.position);

  // Match list (for matrix views) within date range
  let matchQ = sb.from("matches")
    .select("id, opponent, match_date, our_score, their_score, match_type")
    .eq("academy_id", academyId)
    .order("match_date", { ascending: true });
  if (sp.from) matchQ = matchQ.gte("match_date", sp.from);
  if (sp.to) matchQ = matchQ.lte("match_date", `${sp.to}T23:59:59`);
  const { data: matches } = await matchQ;

  // Participations for matrix (only for filtered players + matches)
  const playerIds = players.map((p) => p.id);
  const matchIds = (matches ?? []).map((m) => m.id);
  let parts: any[] = [];
  if (playerIds.length > 0 && matchIds.length > 0) {
    const { data } = await sb.from("match_participations")
      .select("match_id, player_id, lineup_role, minutes_played, goals, yellow_cards, red_cards, sent_off")
      .in("player_id", playerIds)
      .in("match_id", matchIds);
    parts = data ?? [];
  }

  const view = sp.view ?? "summary";

  // Build maps for fast lookup
  const disciplineMap = new Map((discipline ?? []).map((d: any) => [d.player_id, d]));
  const matchSummaryMap = new Map((matchSummary ?? []).map((m: any) => [m.player_id, m]));
  const attSummaryMap = new Map((attSummary ?? []).map((a: any) => [a.player_id, a]));
  const roiMap = new Map((roi ?? []).map((r: any) => [r.player_id, r]));

  const filtersActive = !!(sp.q || sp.category || sp.status || sp.position || sp.from || sp.to);

  return (
    <>
      <PageHeader
        title="تقارير اللاعبين"
        description="إصدار تقارير مخصصة بفلاتر متعددة، مع مصفوفة البطاقات والدقائق لكل مباراة"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/academy/${academyId}/reports/compare`}>مقارنة بين لاعبين</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {/* Filters */}
        <Card className="mb-4 no-print">
          <CardContent className="pt-6">
            <form className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="q">بحث (الاسم/الكود)</Label>
                <Input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="اكتب الاسم..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">التصنيف</Label>
                <select id="category" name="category" defaultValue={sp.category ?? ""}
                        className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  {(categories ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">المركز</Label>
                <select id="position" name="position" defaultValue={sp.position ?? ""}
                        className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  <option value="GK">حارس</option>
                  <option value="DF">دفاع</option>
                  <option value="MF">وسط</option>
                  <option value="FW">هجوم</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">الحالة</Label>
                <select id="status" name="status" defaultValue={sp.status ?? ""}
                        className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="from">من تاريخ (للمصفوفة)</Label>
                <Input id="from" name="from" type="date" defaultValue={sp.from ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">إلى تاريخ</Label>
                <Input id="to" name="to" type="date" defaultValue={sp.to ?? ""} />
              </div>
              {sp.view && <input type="hidden" name="view" value={sp.view} />}
              <div className="md:col-span-6 flex flex-wrap gap-2">
                <Button type="submit">تطبيق الفلاتر</Button>
                {filtersActive && (
                  <Button asChild variant="ghost">
                    <Link href={`/academy/${academyId}/reports`}>مسح</Link>
                  </Button>
                )}
                <span className="ms-auto self-center text-sm text-muted-foreground">
                  النتائج: <strong className="text-emerald-700">{players.length}</strong> لاعب
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* View tabs */}
        <div className="flex flex-wrap gap-2 mb-3 no-print">
          <ViewTab
            current={view}
            value="summary"
            label="📋 الملخص"
            base={`/academy/${academyId}/reports`}
            sp={sp}
          />
          <ViewTab
            current={view}
            value="discipline"
            label="🟨 مصفوفة الإنذارات والطرد"
            base={`/academy/${academyId}/reports`}
            sp={sp}
          />
          <ViewTab
            current={view}
            value="minutes"
            label="⏱ مصفوفة الدقائق والمشاركات"
            base={`/academy/${academyId}/reports`}
            sp={sp}
          />
        </div>

        <PlayerReports
          view={view}
          players={players as any}
          matches={(matches ?? []) as any}
          parts={parts}
          discipline={Object.fromEntries(disciplineMap)}
          matchSummary={Object.fromEntries(matchSummaryMap)}
          attSummary={Object.fromEntries(attSummaryMap)}
          roi={Object.fromEntries(roiMap)}
          academyId={academyId}
        />
      </PageBody>
    </>
  );
}

function ViewTab({
  current, value, label, base, sp,
}: {
  current: string; value: string; label: string; base: string; sp: any;
}) {
  const usp = new URLSearchParams();
  for (const k of ["q", "category", "status", "position", "from", "to"] as const) {
    if (sp[k]) usp.set(k, sp[k]!);
  }
  usp.set("view", value);
  const isActive = current === value;
  return (
    <Link
      href={`${base}?${usp.toString()}`}
      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
        isActive
          ? "bg-emerald-700 text-white border-emerald-700"
          : "bg-white border-border hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}
