import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAcademy } from "../actions";
import { assignManagerByEmail, removeManager } from "./actions";
import Link from "next/link";

export default async function AcademyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: a } = await sb.from("academies").select("*").eq("id", id).maybeSingle();
  if (!a) return <PageBody><p>الأكاديمية غير موجودة</p></PageBody>;

  const { data: managers } = await sb
    .from("memberships")
    .select("id, role, user_id")
    .eq("academy_id", id)
    .in("role", ["academy_manager", "coach"]);

  return (
    <>
      <PageHeader
        title={a.name}
        description={`المعرّف: ${a.slug}`}
        actions={<Button asChild variant="outline"><Link href={`/academy/${id}`}>الدخول إلى لوحة الأكاديمية</Link></Button>}
      />
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>البيانات الأساسية</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await updateAcademy(id, fd); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F name="name" label="الاسم" defaultValue={a.name} />
                <F name="phone" label="الهاتف" dir="ltr" defaultValue={a.phone ?? ""} />
                <F name="whatsapp" label="واتساب" dir="ltr" defaultValue={a.whatsapp ?? ""} />
                <F name="email" label="البريد" type="email" dir="ltr" defaultValue={a.email ?? ""} />
                <F name="attendance_lock_minutes" label="دقائق قفل الحضور" type="number"
                   defaultValue={String((a.settings as any)?.attendance_lock_minutes ?? 25)} />
                <div className="md:col-span-2">
                  <F name="address" label="العنوان" defaultValue={a.address ?? ""} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">حفظ</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>تعيين مدير / مدرب</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await assignManagerByEmail(id, fd); }} className="space-y-3">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني للمستخدم</Label>
                  <Input id="email" name="email" type="email" required dir="ltr" />
                </div>
                <div>
                  <Label htmlFor="role">الدور</Label>
                  <select id="role" name="role" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm" required>
                    <option value="academy_manager">مدير أكاديمية</option>
                    <option value="coach">مدرب</option>
                  </select>
                </div>
                <Button type="submit">إضافة</Button>
              </form>

              <div className="mt-6">
                <h3 className="font-medium text-sm mb-2">الفريق الإداري</h3>
                {(managers ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا يوجد بعد</p>
                ) : (
                  <ul className="text-sm divide-y divide-border">
                    {(managers ?? []).map((m) => (
                      <li key={m.id} className="py-2 flex items-center justify-between">
                        <span>
                          <span dir="ltr">{m.user_id}</span>{" "}
                          <span className="text-muted-foreground text-xs">
                            ({m.role === "academy_manager" ? "مدير" : "مدرب"})
                          </span>
                        </span>
                        <form action={async () => { "use server"; await removeManager(m.id, id); }}>
                          <Button size="sm" variant="ghost" type="submit">إزالة</Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
