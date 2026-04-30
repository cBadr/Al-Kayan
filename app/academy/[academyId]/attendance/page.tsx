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
