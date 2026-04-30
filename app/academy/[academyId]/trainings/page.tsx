import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { createTrainingBulk, createSingleTraining, updateTraining } from "./actions";
import { TrainingsCalendar } from "@/components/trainings-calendar";
import { TrainingsTable } from "./trainings-table";

const WEEKDAYS = [
  { value: 6, label: "السبت" },
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
];

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
    .limit(200);

  const today = new Date().toISOString().slice(0, 10);
  const monthEnd = new Date();
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const defaultTo = monthEnd.toISOString().slice(0, 10);

  const editing = sp.edit ? (trainings ?? []).find((t: any) => t.id === sp.edit) : null;

  return (
    <>
      <PageHeader title="التدريبات" description="جدولة بأيام الأسبوع أو إضافة تدريب فردي" />
      <PageBody>
        {!editing && (
          <Card className="mb-6">
            <CardHeader><CardTitle>إضافة جدول أسبوعي</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await createTrainingBulk(academyId, fd); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category_id">التصنيف</Label>
                    <select id="category_id" name="category_id" required className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                      <option value="">— اختر —</option>
                      {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="time">التوقيت</Label><Input id="time" name="time" type="time" defaultValue="20:00" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="duration_min">المدة (دقيقة)</Label><Input id="duration_min" name="duration_min" type="number" defaultValue="90" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="from">من تاريخ</Label><Input id="from" name="from" type="date" defaultValue={today} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="to">إلى تاريخ</Label><Input id="to" name="to" type="date" defaultValue={defaultTo} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="location">الموقع</Label><Input id="location" name="location" /></div>
                </div>
                <div>
                  <Label className="mb-2 block">أيام الأسبوع</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((w) => (
                      <label key={w.value} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted cursor-pointer text-sm">
                        <input type="checkbox" name="weekdays" value={w.value} />
                        {w.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit">توليد جدول التدريبات</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editing && (
          <Card className="mb-6 border-primary">
            <CardHeader><CardTitle>تعديل تدريب</CardTitle></CardHeader>
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
                <div className="space-y-1.5"><Label htmlFor="scheduled_at">الموعد</Label>
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

        <Card className="mb-6">
          <CardHeader><CardTitle>إضافة تدريب فردي</CardTitle></CardHeader>
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

        <Card className="mb-6">
          <CardHeader><CardTitle>عرض التقويم</CardTitle></CardHeader>
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
