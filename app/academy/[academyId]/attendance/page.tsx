import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { AttendanceGrid } from "./attendance-grid";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ date?: string; category?: string; training?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  const me = await requireAcademyAccess(academyId);
  const sb = await createClient();

  const date = sp.date || todayStr();
  const dayStart = new Date(`${date}T00:00:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59`).toISOString();

  // Categories — used for filter tabs
  const { data: categories } = await sb.from("categories")
    .select("id, name")
    .eq("academy_id", academyId)
    .eq("active", true)
    .order("name");

  // Trainings on selected date (and optional category)
  let trainQ = sb.from("trainings")
    .select("id, scheduled_at, category_id, location, categories(name)")
    .eq("academy_id", academyId)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .order("scheduled_at");
  if (sp.category) trainQ = trainQ.eq("category_id", sp.category);
  const { data: dayTrainings } = await trainQ;

  // Pick training: explicit query > first matching > none
  const trainingId = sp.training || (dayTrainings && dayTrainings[0]?.id) || null;
  let activeTraining: any = null;
  let players: any[] = [];
  let existing: any[] = [];

  if (trainingId) {
    const { data: t } = await sb.from("trainings")
      .select("id, scheduled_at, category_id, location, categories(name)")
      .eq("id", trainingId)
      .maybeSingle();
    activeTraining = t;
    if (activeTraining) {
      const pq = sb.from("players")
        .select("id, code, full_name, category_id, photo_url, notes")
        .eq("academy_id", academyId)
        .eq("status", "active")
        .order("code");
      if (activeTraining.category_id) pq.eq("category_id", activeTraining.category_id);
      const { data: pls } = await pq;
      players = pls ?? [];
      const { data: att } = await sb.from("attendance_records")
        .select("player_id, status, locked_at")
        .eq("training_id", trainingId);
      existing = att ?? [];
    }
  }

  const isManager = me.isSuperAdmin || me.managedAcademyIds.includes(academyId);

  // Honor board — top players by attendance % (academy-wide, optionally filtered by category)
  let honorQ = sb.from("player_attendance_summary")
    .select("player_id, full_name, code, attendance_pct, present_count, late_count, total_records, academy_id")
    .eq("academy_id", academyId)
    .gt("total_records", 4) // at least 5 records for a meaningful %
    .order("attendance_pct", { ascending: false })
    .limit(10);
  const { data: honorAll } = await honorQ;

  // If a category filter is active, filter honor board to that category's players
  let honorBoard: any[] = honorAll ?? [];
  if (sp.category && honorBoard.length > 0) {
    const { data: catPlayers } = await sb.from("players").select("id").eq("academy_id", academyId).eq("category_id", sp.category);
    const catIds = new Set((catPlayers ?? []).map((p: any) => p.id));
    honorBoard = honorBoard.filter((h: any) => catIds.has(h.player_id));
  }

  // Stat counts
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of existing) {
    if (r.status === "present") counts.present++;
    else if (r.status === "absent") counts.absent++;
    else if (r.status === "late") counts.late++;
    else if (r.status === "excused") counts.excused++;
  }
  const total = players.length;

  const buildHref = (next: { date?: string; category?: string; training?: string }) => {
    const usp = new URLSearchParams();
    usp.set("date", next.date ?? date);
    if (next.category ?? sp.category) usp.set("category", (next.category ?? sp.category)!);
    if (next.training) usp.set("training", next.training);
    return `/academy/${academyId}/attendance?${usp.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="الحضور والغياب"
        description={new Date(date).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      />
      <PageBody>
        {/* Date + category filter */}
        <Card className="mb-4">
          <CardContent className="pt-6 space-y-4">
            <form className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-48">
                <label className="text-xs font-semibold text-muted-foreground">التصنيف</label>
                <select name="category" defaultValue={sp.category ?? ""} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">جميع التصنيفات</option>
                  {(categories ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="h-10 px-4 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold">
                عرض
              </button>
            </form>

            {/* Training selector — only when multiple on same day */}
            {(dayTrainings ?? []).length > 1 && (
              <div className="flex flex-wrap gap-2">
                {(dayTrainings ?? []).map((t: any) => (
                  <Link
                    key={t.id}
                    href={buildHref({ training: t.id })}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
                      trainingId === t.id
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {t.categories?.name ?? "تدريب"}
                    <span className="text-[10px] opacity-70 ms-2" dir="ltr">
                      {new Date(t.scheduled_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          <StatBox label="متأخر" value={counts.late} tone="warning" />
          <StatBox label="غائب" value={counts.absent} tone="destructive" />
          <StatBox label="بعذر" value={counts.excused} tone="info" />
          <StatBox label="حاضر" value={counts.present} tone="success" />
        </div>
        <div className="text-center text-sm text-muted-foreground mb-4">
          <strong className="text-emerald-900 text-lg">{total}</strong> الإجمالي • مُسجَّل: {counts.present + counts.late + counts.absent + counts.excused}
        </div>

        {/* Honor board */}
        {honorBoard.length > 0 && (
          <Card className="mb-4 border-amber-300 bg-gradient-to-l from-amber-50/50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-amber-900 flex items-center gap-2">
                  🏆 لوحة الشرف <span className="text-xs font-normal text-muted-foreground">(الأكثر التزاماً)</span>
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {sp.category ? "ضمن التصنيف المختار" : "كل الأكاديمية"}
                </span>
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {honorBoard.slice(0, 10).map((h, i) => (
                  <li key={h.player_id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        i === 0 ? "bg-gradient-to-l from-amber-300/40 to-amber-100/40 border border-amber-400" :
                        i === 1 ? "bg-gradient-to-l from-gray-200 to-gray-50 border border-gray-300" :
                        i === 2 ? "bg-gradient-to-l from-amber-700/20 to-amber-100/20 border border-amber-700/40" :
                        "bg-white border border-border"
                      }`}>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ltr-numbers ${
                      i === 0 ? "bg-amber-400 text-emerald-950" :
                      i === 1 ? "bg-gray-400 text-white" :
                      i === 2 ? "bg-amber-700 text-white" :
                      "bg-emerald-700 text-white"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <Link href={`/academy/${academyId}/players/${h.player_id}`} className="flex-1 min-w-0 hover:underline">
                      <div className="font-semibold text-sm truncate">{h.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {h.present_count} حضور · {h.late_count} تأخير
                      </div>
                    </Link>
                    <div className="text-emerald-700 font-black text-sm ltr-numbers">{h.attendance_pct}%</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {!activeTraining ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              لا يوجد تدريب مجدول في هذا اليوم. أضف تدريباً من{" "}
              <Link href={`/academy/${academyId}/trainings`} className="text-emerald-700 font-semibold hover:underline">
                صفحة التدريبات
              </Link>.
            </CardContent>
          </Card>
        ) : (
          <AttendanceGrid
            academyId={academyId}
            trainingId={activeTraining.id}
            players={players}
            existing={existing}
            isManager={isManager}
          />
        )}
      </PageBody>
    </>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "destructive" | "info" }) {
  const ring = {
    success: "ring-emerald-500/40 text-emerald-700",
    warning: "ring-amber-400/50 text-amber-700",
    destructive: "ring-red-400/40 text-red-600",
    info: "ring-sky-400/40 text-sky-700",
  }[tone];
  return (
    <div className={`rounded-xl bg-white border border-border ring-1 ${ring} p-3 text-center`}>
      <div className={`text-3xl font-black ltr-numbers ${ring.split(" ")[1]}`}>{value}</div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
