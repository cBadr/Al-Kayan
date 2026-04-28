import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { getAppSettings } from "@/lib/app-settings";
import { saveAppSettings } from "./actions";

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();
  const s = await getAppSettings();

  return (
    <>
      <PageHeader title="إعدادات النظام" description="تخصيص هوية المنصة وبيانات التواصل العامة" />
      <PageBody>
        <form action={async (fd) => { "use server"; await saveAppSettings(fd); }} className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>هوية التطبيق</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center overflow-hidden border-2 border-gold-400/30">
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gold-400 font-black text-3xl">{s.app_name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-64 space-y-1.5">
                  <Label htmlFor="logo">شعار التطبيق</Label>
                  <Input id="logo" name="logo" type="file" accept="image/*" />
                  <p className="text-xs text-muted-foreground">يُعرض في صفحة تسجيل الدخول وصفحة الهبوط والإيصالات</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F name="app_name" label="اسم التطبيق" defaultValue={s.app_name} required />
                <F name="tagline" label="الوصف المختصر" defaultValue={s.tagline ?? ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>بيانات التواصل العامة</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F name="contact_email" label="البريد الإلكتروني" type="email" dir="ltr" defaultValue={s.contact_email ?? ""} />
              <F name="contact_phone" label="الهاتف" dir="ltr" defaultValue={s.contact_phone ?? ""} />
              <F name="contact_whatsapp" label="واتساب" dir="ltr" defaultValue={s.contact_whatsapp ?? ""} />
              <F name="support_url" label="رابط الدعم/الموقع" dir="ltr" defaultValue={s.support_url ?? ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>إعدادات النظام</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F name="default_currency" label="العملة الافتراضية" dir="ltr" defaultValue={s.default_currency ?? "EGP"} />
              <F name="footer_text" label="نص التذييل" defaultValue={s.footer_text ?? ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                تكامل WhatsApp
                <Badge variant={s.whatsapp_enabled ? "success" : "muted"}>
                  {s.whatsapp_enabled ? "مفعَّل" : "غير مفعَّل"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="whatsapp_enabled" value="1" defaultChecked={s.whatsapp_enabled} />
                تفعيل قناة WhatsApp في الإشعارات
              </label>
              <F name="whatsapp_phone_id" label="WhatsApp Phone Number ID" dir="ltr" defaultValue={s.whatsapp_phone_id ?? ""} />
              <p className="text-xs text-muted-foreground">
                يحتاج إضافة <code className="bg-muted px-1 rounded">WHATSAPP_TOKEN</code> في متغيرات البيئة على Vercel.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">حفظ الإعدادات</Button>
          </div>
        </form>
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
