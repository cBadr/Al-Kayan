import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ThanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: academy } = await sb.from("academies").select("name, phone, whatsapp, email").eq("slug", slug).maybeSingle();

  return (
    <div className="flex-1 bg-mesh-emerald flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full animate-scale-in">
        <CardContent className="pt-10 pb-8 text-center space-y-5">
          <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center text-success text-4xl">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-primary">شكراً لاهتمامك!</h1>
          <p className="text-lg text-slate-700 leading-relaxed">
            تم استلام طلب انضمامك إلى <strong>{academy?.name ?? "الأكاديمية"}</strong> بنجاح.
          </p>
          <div className="bg-warning/5 border border-warning/30 rounded-lg p-4 text-warning-foreground">
            <p className="text-sm font-medium text-warning">
              ⏳ طلبك قيد المراجعة من قِبل إدارة الأكاديمية
            </p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              سيتم إبلاغك عبر <strong>البريد الإلكتروني</strong> و <strong>الواتس آب</strong> فور تفعيل حسابك،
              مع كود اللاعب الخاص بك ومعلومات تسجيل الدخول.
            </p>
          </div>
          {(academy?.phone || academy?.whatsapp || academy?.email) && (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-2">للتواصل المباشر مع الأكاديمية:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {academy?.phone && <span dir="ltr">📞 {academy.phone}</span>}
                {academy?.whatsapp && <span dir="ltr">💬 {academy.whatsapp}</span>}
                {academy?.email && <span dir="ltr">✉️ {academy.email}</span>}
              </div>
            </div>
          )}
          <div className="pt-4">
            <Button asChild variant="outline"><Link href="/">العودة إلى الصفحة الرئيسية</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
