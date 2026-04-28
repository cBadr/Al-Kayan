import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitJoinRequest } from "./actions";

export const dynamic = "force-dynamic";

export default async function JoinFormPage({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: academy } = await sb.from("academies").select("*").eq("slug", slug).maybeSingle();
  if (!academy) notFound();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academy.id).eq("active", true);
  const required: string[] = (academy.settings as any)?.required_fields ?? ["full_name"];
  const isReq = (k: string) => required.includes(k);

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-1 text-primary">{academy.name}</h1>
      <p className="text-muted-foreground mb-6">طلب انضمام لاعب جديد</p>

      <Card>
        <CardContent className="pt-6">
          <form action={async (fd) => { "use server"; await submitJoinRequest(academy.id, slug, fd); }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F name="full_name" label="الاسم رباعي" required={isReq("full_name")} />
            <div className="space-y-1.5">
              <Label htmlFor="desired_category_id">التصنيف المرغوب</Label>
              <select id="desired_category_id" name="desired_category_id"
                className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                <option value="">— اختر —</option>
                {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <F name="birth_date" label="تاريخ الميلاد" type="date" required={isReq("birth_date")} />
            <F name="phone" label="الهاتف" dir="ltr" required={isReq("phone")} />
            <F name="email" label="البريد الإلكتروني" type="email" dir="ltr" required={isReq("email")} />
            <F name="national_id" label="الرقم القومي" dir="ltr" required={isReq("national_id")} />
            <F name="guardian_name" label="اسم ولي الأمر" required={isReq("guardian_name")} />
            <F name="guardian_phone" label="هاتف ولي الأمر" dir="ltr" required={isReq("guardian_phone")} />
            <FFile name="photo" label="صورة شخصية" required={isReq("photo")} />
            <FFile name="id_doc" label="صورة الهوية / شهادة الميلاد" required={isReq("id_doc")} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">إرسال الطلب</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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
function FFile({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type="file" accept="image/*" required={required} />
    </div>
  );
}
