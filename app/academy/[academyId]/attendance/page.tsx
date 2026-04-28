import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { AttendanceGrid } from "./attendance-grid";

export default async function AttendancePage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ training?: string; category?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  const me = await requireAcademyAccess(academyId);
  const sb = await createClient();

  const { data: trainings } = await sb
    .from("trainings")
    .select("id, scheduled_at, category_id, categories(name)")
    .eq("academy_id", academyId)
    .order("scheduled_at", { ascending: false })
    .limit(60);

  let activeTraining: any = null;
  let players: any[] = [];
  let existing: any[] = [];

  if (sp.training) {
    const { data } = await sb.from("trainings").select("*, categories(name)").eq("id", sp.training).maybeSingle();
    activeTraining = data;
    if (activeTraining) {
      const q = sb.from("players").select("id, code, full_name, category_id").eq("academy_id", academyId).eq("status", "active").order("code");
      if (activeTraining.category_id) q.eq("category_id", activeTraining.category_id);
      const { data: pls } = await q;
      players = pls ?? [];
      const { data: att } = await sb.from("attendance_records").select("player_id, status, locked_at").eq("training_id", sp.training);
      existing = att ?? [];
    }
  }

  const isManager = me.isSuperAdmin || me.managedAcademyIds.includes(academyId);

  return (
    <>
      <PageHeader title="تسجيل الحضور" description="اختر التدريب لتسجيل حضور اللاعبين" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label>التدريب</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(trainings ?? []).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/academy/${academyId}/attendance?training=${t.id}`}
                  className={`block p-3 rounded-md border text-sm ${sp.training === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <div className="font-medium">{t.categories?.name ?? "بدون تصنيف"}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(t.scheduled_at).toLocaleString("ar-EG")}
                  </div>
                </Link>
              ))}
              {(trainings ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">لا توجد تدريبات. أضف تدريباً من صفحة التدريبات.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {activeTraining && (
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
