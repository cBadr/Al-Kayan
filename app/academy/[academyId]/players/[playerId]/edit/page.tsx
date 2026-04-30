import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { signedUrl } from "@/lib/storage";
import { updatePlayer, deletePlayer } from "../../actions";
import Link from "next/link";

export default async function EditPlayerPage({ params }: { params: Promise<{ academyId: string; playerId: string }> }) {
  const { academyId, playerId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: p } = await sb.from("players").select("*").eq("id", playerId).maybeSingle();
  if (!p) return <PageBody><p>اللاعب غير موجود</p></PageBody>;
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId);
  const photo = await signedUrl(p.photo_url);

  return (
    <>
      <PageHeader
        title={`تعديل بيانات: ${p.full_name}`}
        description={`الكود: ${p.code}`}
        actions={<Button asChild variant="outline"><Link href={`/academy/${academyId}/players/${playerId}`}>عرض البروفايل</Link></Button>}
      />
      <PageBody>
        <Card className="max-w-3xl">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await updatePlayer(academyId, playerId, fd); }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-4">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted" />
                )}
                <div className="flex-1">
                  <Label htmlFor="photo">تغيير الصورة الشخصية</Label>
                  <Input id="photo" name="photo" type="file" accept="image/*" />
                </div>
              </div>

              <F name="full_name" label="الاسم رباعي" defaultValue={p.full_name} required />
              <div className="space-y-1.5">
                <Label htmlFor="category_id">التصنيف</Label>
                <select id="category_id" name="category_id" defaultValue={p.category_id ?? ""} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">— بدون تصنيف —</option>
                  {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <F name="birth_date" label="تاريخ الميلاد" type="date" defaultValue={p.birth_date ?? ""} />
              <F name="phone" label="الهاتف" dir="ltr" defaultValue={p.phone ?? ""} />
              <F name="email" label="البريد" type="email" dir="ltr" defaultValue={p.email ?? ""} />
              <F name="national_id" label="الرقم القومي" dir="ltr" defaultValue={p.national_id ?? ""} />
              <F name="guardian_name" label="اسم ولي الأمر" defaultValue={p.guardian_name ?? ""} />
              <F name="guardian_phone" label="هاتف ولي الأمر" dir="ltr" defaultValue={p.guardian_phone ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="position">المركز</Label>
                <select id="position" name="position" defaultValue={p.position ?? ""} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">— غير محدد —</option>
                  <option value="GK">حارس مرمى</option>
                  <option value="DF">دفاع</option>
                  <option value="MF">وسط</option>
                  <option value="FW">هجوم</option>
                </select>
              </div>
              <F name="preferred_jersey" label="رقم القميص" type="number" min={1} max={99} defaultValue={p.preferred_jersey ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="status">الحالة</Label>
                <select id="status" name="status" defaultValue={p.status} className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-between items-center pt-3 border-t border-border">
                <form action={async () => { "use server"; await deletePlayer(academyId, playerId); }}>
                  <Button type="submit" variant="destructive">حذف اللاعب نهائياً</Button>
                </form>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><Link href={`/academy/${academyId}/players`}>إلغاء</Link></Button>
                  <Button type="submit">حفظ التعديلات</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}

function F({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
