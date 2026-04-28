import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createPlayer } from "../actions";

export default async function NewPlayerPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId).eq("active", true);
  const { data: academy } = await sb.from("academies").select("settings").eq("id", academyId).maybeSingle();
  const required: string[] = (academy?.settings as any)?.required_fields ?? ["full_name"];
  const isReq = (k: string) => required.includes(k);

  return (
    <>
      <PageHeader title="إضافة لاعب" description="بيانات اللاعب الأساسية" />
      <PageBody>
        <Card className="max-w-3xl">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await createPlayer(academyId, fd); }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
