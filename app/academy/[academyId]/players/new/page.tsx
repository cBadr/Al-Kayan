import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { createPlayer } from "../actions";

export default async function NewPlayerPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId).eq("active", true);
  const { data: academy } = await sb.from("academies").select("name, settings").eq("id", academyId).maybeSingle();
  const required: string[] = (academy?.settings as any)?.required_fields ?? ["full_name"];
  const isReq = (k: string) => required.includes(k);

  // Academies the current user can manage (or all if super admin).
  let academies: { id: string; name: string }[] = [];
  if (me.isSuperAdmin) {
    const { data } = await sb.from("academies").select("id, name").order("name");
    academies = data ?? [];
  } else if (me.managedAcademyIds.length > 0) {
    const { data } = await sb.from("academies").select("id, name").in("id", me.managedAcademyIds).order("name");
    academies = data ?? [];
  }

  return (
    <>
      <PageHeader title="إضافة لاعب" description="بيانات اللاعب الأساسية" />
      <PageBody>
        <Card className="max-w-3xl">
          <CardContent className="pt-6">
            <form action={async (fd) => {
              "use server";
              const targetAcademy = String(fd.get("academy_id") || academyId);
              await createPlayer(targetAcademy, fd);
            }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="academy_id">الأكاديمية *</Label>
                {academies.length > 1 ? (
                  <select id="academy_id" name="academy_id" defaultValue={academyId} required
                          className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ) : (
                  <>
                    <input type="hidden" name="academy_id" value={academyId} />
                    <Input value={academy?.name ?? ""} disabled />
                  </>
                )}
              </div>
              <F name="full_name" label="الاسم رباعي" required={isReq("full_name")} />
              <div className="space-y-1.5">
                <Label htmlFor="category_id">التصنيف{isReq("category_id") && " *"}</Label>
                <select id="category_id" name="category_id" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">— بدون تصنيف —</option>
                  {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <F name="birth_date" label="تاريخ الميلاد" type="date" required={isReq("birth_date")} />
              <F name="phone" label="الهاتف" dir="ltr" required={isReq("phone")} />
              <F name="email" label="البريد الإلكتروني" type="email" dir="ltr" required={isReq("email")} />
              <F name="national_id" label="الرقم القومي" dir="ltr" required={isReq("national_id")} />
              <F name="guardian_name" label="اسم ولي الأمر" required={isReq("guardian_name")} />
              <F name="guardian_phone" label="هاتف ولي الأمر" dir="ltr" required={isReq("guardian_phone")} />
              <div className="space-y-1.5">
                <Label htmlFor="position">المركز</Label>
                <select id="position" name="position" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                  <option value="">— غير محدد —</option>
                  <option value="GK">حارس مرمى</option>
                  <option value="DF">دفاع</option>
                  <option value="MF">وسط</option>
                  <option value="FW">هجوم</option>
                </select>
              </div>
              <F name="preferred_jersey" label="رقم القميص" type="number" min={1} max={99} />
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="photo">الصورة الشخصية</Label>
                <Input id="photo" name="photo" type="file" accept="image/*" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">حفظ — توليد كود وإيصال السداد الأول</Button>
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
      <Label htmlFor={props.name}>{label}{props.required && " *"}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
