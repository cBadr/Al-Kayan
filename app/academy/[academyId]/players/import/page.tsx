import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { importPlayersCsv } from "./actions";
import Link from "next/link";

export default async function ImportPlayersPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ ok?: string; created?: string; skipped?: string; error?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId);

  return (
    <>
      <PageHeader
        title="استيراد لاعبين من CSV"
        description="استيراد دفعة كبيرة من اللاعبين بسرعة"
      />
      <PageBody>
        {sp.ok === "1" && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            ✓ تم الاستيراد بنجاح — أُنشئ <strong className="ltr-numbers">{sp.created}</strong> لاعب،
            تم تخطي <strong className="ltr-numbers">{sp.skipped}</strong> سطر.
          </div>
        )}
        {sp.error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            خطأ: {sp.error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>رفع ملف CSV</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await importPlayersCsv(academyId, fd); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="file">الملف</Label>
                  <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="default_category">التصنيف الافتراضي (اختياري — لو ما حُدِّد في CSV)</Label>
                  <select id="default_category" name="default_category" className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="">— —</option>
                    {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline"><Link href={`/academy/${academyId}/players`}>إلغاء</Link></Button>
                  <Button type="submit">استيراد</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>صيغة الملف</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>الأعمدة المدعومة (السطر الأول = العناوين):</p>
              <code className="block bg-muted/50 p-3 rounded-md text-xs leading-loose ltr-numbers font-mono" dir="ltr">
                full_name,birth_date,phone,email,national_id,guardian_name,guardian_phone,category
              </code>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>full_name</strong> إجباري</li>
                <li><strong>birth_date</strong> بصيغة <span dir="ltr">YYYY-MM-DD</span></li>
                <li><strong>category</strong> اسم التصنيف (يطابق التصنيفات الموجودة)</li>
                <li>لو ما حُدِّد التصنيف في الصف يستخدم الافتراضي</li>
                <li>الكود يُولَّد تلقائياً</li>
              </ul>
              <a href="data:text/csv;charset=utf-8,full_name,birth_date,phone,email,guardian_name,guardian_phone,category%0Aمحمد علي,2015-03-12,01000000001,,أبو محمد,01200000001,كيدز"
                 download="players-template.csv"
                 className="inline-block text-emerald-700 hover:underline font-semibold text-sm">
                ⬇ تحميل قالب فارغ
              </a>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
