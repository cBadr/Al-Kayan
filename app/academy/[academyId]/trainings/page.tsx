import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { createSingleTraining, updateTraining } from "./actions";
import { TrainingsCalendar } from "@/components/trainings-calendar";
import { TrainingsTable } from "./trainings-table";
import { WeeklyScheduler } from "./weekly-scheduler";

export default async function TrainingsPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId).eq("active", true);
  const { data: trainings } = await sb
    .from("trainings")
    .select("*, categories(name)")
    .eq("academy_id", academyId)
    .order("scheduled_at", { ascending: false })
    .limit(500);

  const editing = sp.edit ? (trainings ?? []).find((t: any) => t.id === sp.edit) : null;

  return (
    <>
      <PageHeader
        title="التدريبات"
        description="جدولة التدريبات الأسبوعية والشهرية متعددة التصنيفات"
        actions={
          <Button asChild variant="outline">
            <Link href={`/academy/${academyId}`}>← العودة للوحة الرئيسية</Link>
          </Button>
        }
      />
      <PageBody>
        {editing && (
          <Card className="mb-6 border-amber-300 bg-amber-50/30">
            <CardHeader><CardTitle>✏️ تعديل تدريب</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await updateTraining(academyId, editing.id, fd); }}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="category_id">التصنيف</Label>
                  <select id="category_id" name="category_id" defaultValue={editing.category_id ?? ""} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="">—</option>
                    {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduled_at">الموعد</Label>
                  <Input id="scheduled_at" name="scheduled_at" type="datetime-local"
                         defaultValue={new Date(editing.scheduled_at).toISOString().slice(0, 16)} required />
                </div>
                <div className="space-y-1.5"><Label htmlFor="duration_min">المدة</Label><Input id="duration_min" name="duration_min" type="number" defaultValue={editing.duration_min} /></div>
                <div className="space-y-1.5"><Label htmlFor="location">الموقع</Label><Input id="location" name="location" defaultValue={editing.location ?? ""} /></div>
                <div className="flex gap-2">
                  <Button type="submit">حفظ</Button>
                  <Button type="button" variant="outline" asChild><Link href={`/academy/${academyId}/trainings`}>إلغاء</Link></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!editing && (
          <>
            {/* Smart weekly scheduler */}
            <Card className="mb-6">
              <CardHeader>
                <div>
                  <CardTitle>🗓 جدول أسبوعي ذكي (تصنيفات متعددة)</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    حدّد فترات متعددة (تصنيف + يوم + وقت) ثم نطاق التواريخ — سيُولِّد النظام كل التدريبات تلقائياً.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <WeeklyScheduler academyId={academyId} categories={(cats ?? []) as any} />
              </CardContent>
            </Card>

            {/* Quick single training */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">⚡ إضافة تدريب فردي</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={async (fd) => { "use server"; await createSingleTraining(academyId, fd); }}
                      className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="single_category">التصنيف</Label>
                    <select id="single_category" name="category_id" required className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                      <option value="">— اختر —</option>
                      {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="single_when">الموعد</Label><Input id="single_when" name="scheduled_at" type="datetime-local" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="single_dur">المدة</Label><Input id="single_dur" name="duration_min" type="number" defaultValue="90" /></div>
                  <div className="space-y-1.5"><Label htmlFor="single_loc">الموقع</Label><Input id="single_loc" name="location" /></div>
                  <Button type="submit">إضافة</Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Calendar view */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">📅 عرض التقويم</CardTitle></CardHeader>
          <CardContent>
            <TrainingsCalendar
              academyId={academyId}
              trainings={(trainings ?? []).map((t: any) => ({
                id: t.id,
                scheduled_at: t.scheduled_at,
                duration_min: t.duration_min,
                location: t.location,
                category_name: t.categories?.name ?? null,
              }))}
            />
          </CardContent>
        </Card>

        <TrainingsTable
          academyId={academyId}
          trainings={(trainings ?? []) as any}
          categories={(cats ?? []) as any}
        />
      </PageBody>
    </>
  );
}
