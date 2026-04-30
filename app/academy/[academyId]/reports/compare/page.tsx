import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { CompareChart } from "./compare-chart";
import { CompareSelector } from "./compare-selector";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const ids = (sp.ids ?? "").split(",").filter(Boolean);

  const { data: allPlayers } = await sb
    .from("players")
    .select("id, code, full_name, position, categories(name)")
    .eq("academy_id", academyId)
    .order("full_name");

  let stats: any[] = [];
  if (ids.length > 0) {
    const [{ data: att }, { data: matches }, { data: discipline }] = await Promise.all([
      sb.from("player_attendance_summary").select("*").in("player_id", ids),
      sb.from("player_match_summary").select("*").in("player_id", ids),
      sb.from("player_discipline").select("*").in("player_id", ids),
    ]);

    const players = (allPlayers ?? []).filter((p: any) => ids.includes(p.id));
    stats = players.map((p: any) => {
      const a = (att ?? []).find((x: any) => x.player_id === p.id) ?? {};
      const m = (matches ?? []).find((x: any) => x.player_id === p.id) ?? {};
      const d = (discipline ?? []).find((x: any) => x.player_id === p.id) ?? {};
      return {
        player_id: p.id,
        full_name: p.full_name,
        code: p.code,
        position: posLabel(p.position),
        category: p.categories?.name ?? "—",
        attendance_pct: Number(a.attendance_pct ?? 0),
        present_count: a.present_count ?? 0,
        absent_count: a.absent_count ?? 0,
        late_count: a.late_count ?? 0,
        matches_played: m.matches_played ?? 0,
        goals: m.goals ?? 0,
        yellow_cards: m.yellow_cards ?? 0,
        red_cards: m.red_cards ?? 0,
        active_yellows: d.active_yellows ?? 0,
        total_minutes: d.total_minutes ?? 0,
      };
    });
  }

  return (
    <>
      <PageHeader
        title="مقارنة بين لاعبين"
        description="قارن إحصائيات لاعبَين أو أكثر جنباً إلى جنب"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/academy/${academyId}/reports`}>← العودة للتقارير</Link>
            </Button>
            {stats.length >= 2 && <PrintButton />}
          </>
        }
      />
      <PageBody>
        <Card className="mb-6 no-print">
          <CardContent className="pt-6">
            <CompareSelector
              players={(allPlayers ?? []) as any}
              initialIds={ids}
              academyId={academyId}
            />
          </CardContent>
        </Card>

        {stats.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              اختر لاعبَين أو أكثر لبدء المقارنة.
            </CardContent>
          </Card>
        )}

        {stats.length === 1 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لقد اخترت لاعباً واحداً فقط — اختر لاعباً آخر للمقارنة.
            </CardContent>
          </Card>
        )}

        {stats.length >= 2 && (
          <>
            <div className={`grid gap-4 mb-6 grid-cols-1 ${stats.length === 2 ? "sm:grid-cols-2" : stats.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
              {stats.map((s) => (
                <Card key={s.player_id}>
                  <CardContent className="pt-6 text-center space-y-2">
                    <h3 className="font-bold text-lg text-emerald-950 truncate">{s.full_name}</h3>
                    <div className="text-xs text-muted-foreground">{s.code} · {s.category}</div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-right">
                      <Metric label="نسبة الحضور" value={`${s.attendance_pct}%`} highlight />
                      <Metric label="مباريات" value={s.matches_played} />
                      <Metric label="أهداف" value={s.goals} highlight={s.goals > 0} positive />
                      <Metric label="دقائق" value={s.total_minutes} />
                      <Metric label="بطاقات صفراء" value={`${s.active_yellows}/${s.yellow_cards}`} negative={s.active_yellows >= 2} />
                      <Metric label="بطاقات حمراء" value={s.red_cards} negative={s.red_cards > 0} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mb-6 print-keep">
              <CardContent className="pt-6 overflow-x-auto">
                <h3 className="font-bold mb-3">جدول المقارنة الكامل</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-emerald-50 text-right">
                      <th className="p-2 border border-emerald-200">المؤشر</th>
                      {stats.map((s) => (
                        <th key={s.player_id} className="p-2 border border-emerald-200 min-w-32">{s.full_name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <Row label="الكود" rows={stats} k="code" />
                    <Row label="المركز" rows={stats} k="position" />
                    <Row label="التصنيف" rows={stats} k="category" />
                    <Row label="نسبة الحضور %" rows={stats} k="attendance_pct" suffix="%" winner="max" />
                    <Row label="الحاضر" rows={stats} k="present_count" winner="max" />
                    <Row label="الغائب" rows={stats} k="absent_count" winner="min" />
                    <Row label="المتأخر" rows={stats} k="late_count" winner="min" />
                    <Row label="المباريات" rows={stats} k="matches_played" winner="max" />
                    <Row label="الأهداف" rows={stats} k="goals" winner="max" />
                    <Row label="الدقائق" rows={stats} k="total_minutes" winner="max" />
                    <Row label="البطاقات الصفراء" rows={stats} k="yellow_cards" winner="min" />
                    <Row label="الصفراء النشطة" rows={stats} k="active_yellows" winner="min" />
                    <Row label="البطاقات الحمراء" rows={stats} k="red_cards" winner="min" />
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="print-keep">
              <CardContent className="pt-6">
                <h3 className="font-bold mb-3">رسم بياني للمقارنة</h3>
                <CompareChart data={stats} />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </>
  );
}

function Metric({ label, value, highlight, positive, negative }: { label: string; value: React.ReactNode; highlight?: boolean; positive?: boolean; negative?: boolean }) {
  const cls = negative ? "text-red-600" : positive ? "text-emerald-700" : highlight ? "text-emerald-900 font-bold" : "text-emerald-950";
  return (
    <div className="rounded-md bg-muted/30 p-2 text-center">
      <div className={`text-xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, rows, k, suffix = "", winner }: { label: string; rows: any[]; k: string; suffix?: string; winner?: "max" | "min" }) {
  let bestIdx = -1;
  if (winner && rows.length > 1) {
    const numeric = rows.map((r) => Number(r[k]));
    if (numeric.every((n) => !Number.isNaN(n))) {
      bestIdx = winner === "max"
        ? numeric.indexOf(Math.max(...numeric))
        : numeric.indexOf(Math.min(...numeric));
    }
  }
  return (
    <tr className="border-b border-emerald-100">
      <td className="p-2 border border-emerald-100 bg-emerald-50/30 font-semibold">{label}</td>
      {rows.map((r, i) => (
        <td key={r.player_id} className={`p-2 border border-emerald-100 text-center ${
          i === bestIdx ? "bg-amber-100 font-bold text-emerald-800" : ""
        }`}>
          {r[k]}{suffix}
          {i === bestIdx && <span className="ms-1 text-[10px]">🏆</span>}
        </td>
      ))}
    </tr>
  );
}

function posLabel(p: string | null) {
  if (!p) return "—";
  return ({ GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}
