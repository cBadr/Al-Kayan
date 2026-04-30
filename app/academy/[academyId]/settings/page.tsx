import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { saveAcademyInfo, saveAcademySettings } from "./actions";

const ALL_FIELDS = [
  ["full_name", "الاسم رباعي"],
  ["birth_date", "تاريخ الميلاد"],
  ["phone", "الهاتف"],
  ["email", "البريد الإلكتروني"],
  ["national_id", "الرقم القومي"],
  ["guardian_name", "اسم ولي الأمر"],
  ["guardian_phone", "هاتف ولي الأمر"],
  ["photo", "صورة شخصية"],
  ["id_doc", "صورة الهوية"],
] as const;

export default async function SettingsPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: a } = await sb.from("academies").select("*").eq("id", academyId).maybeSingle();
  if (!a) return <PageBody><p>الأكاديمية غير موجودة</p></PageBody>;

  const s: any = a.settings ?? {};
  const required: string[] = s.required_fields ?? ["full_name"];

  return (
    <>
      <PageHeader title="إعدادات الأكاديمية" hidePrint />
      <PageBody>
        <div className="space-y-6 max-w-4xl">
          {/* Academy info */}
          <Card>
            <CardHeader><CardTitle>بيانات الأكاديمية</CardTitle></CardHeader>
            <CardContent>
              <form action={async (fd) => { "use server"; await saveAcademyInfo(academyId, fd); }} className="space-y-4">
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center overflow-hidden border-2 border-gold-400/30">
                    {a.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gold-400 font-black text-2xl">{a.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-64 space-y-1.5">
                    <Label htmlFor="logo">شعار الأكاديمية</Label>
                    <Input id="logo" name="logo" type="file" accept="image/*" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F name="name" label="اسم الأكاديمية" defaultValue={a.name} required />
                  <F name="slug" label="المعرّف (slug)" defaultValue={a.slug} dir="ltr" required />
                  <F name="phone" label="الهاتف" dir="ltr" defaultValue={a.phone ?? ""} />
                  <F name="whatsapp" label="واتساب" dir="ltr" defaultValue={a.whatsapp ?? ""} />
                  <F name="email" label="البريد الإلكتروني" type="email" dir="ltr" defaultValue={a.email ?? ""} />
                  <F name="address" label="العنوان" defaultValue={a.address ?? ""} />
                  <F name="manager_name" label="اسم المدير (للمستندات الرسمية)" defaultValue={(a as any).manager_name ?? ""} />
                </div>

                <div className="border-t border-border pt-4 mt-4 space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm">الختم والتوقيع للمستندات الرسمية</h4>
                  <p className="text-xs text-muted-foreground">تظهر في أسفل ملفات الطباعة وإيصالات السداد. يُفضَّل صور بخلفية شفافة (PNG).</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seal">ختم الأكاديمية</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                          {(a as any).seal_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(a as any).seal_url} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-muted-foreground text-xs">لا يوجد</span>
                          )}
                        </div>
                        <Input id="seal" name="seal" type="file" accept="image/*" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager_signature">توقيع المدير</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                          {(a as any).manager_signature_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(a as any).manager_signature_url} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-muted-foreground text-xs">لا يوجد</span>
                          )}
                        </div>
                        <Input id="manager_signature" name="manager_signature" type="file" accept="image/*" className="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">حفظ بيانات الأكاديمية</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Other settings */}
          <form action={async (fd) => { "use server"; await saveAcademySettings(academyId, fd); }} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>إعدادات عامة</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F name="attendance_lock_minutes" label="دقائق قفل الحضور" type="number" defaultValue={s.attendance_lock_minutes ?? 25} />
                <F name="cycle_days" label="مدة دورة الاشتراك (أيام)" type="number" defaultValue={a.cycle_days ?? 30} />
                <div className="md:col-span-2">
                  <F name="receipt_footer" label="تذييل الإيصال" defaultValue={s.receipt_footer ?? ""} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>الحقول الإجبارية في نموذج التسجيل</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_FIELDS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="required_fields" value={key} defaultChecked={required.includes(key)} />
                    {label}
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>الإشعارات التلقائية للمتأخرات</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <F name="overdue_every_days" label="كل كم يوم تذكير" type="number" defaultValue={s.overdue_reminders?.every_days ?? 7} />
                <F name="overdue_before_due_days" label="قبل المهلة بـ (أيام)" type="number" defaultValue={s.overdue_reminders?.before_due_days ?? 3} />
                <F name="overdue_final_after_days" label="إنذار نهائي بعد (أيام)" type="number" defaultValue={s.overdue_reminders?.final_after_days ?? 30} />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit">حفظ الإعدادات</Button>
            </div>
          </form>
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
