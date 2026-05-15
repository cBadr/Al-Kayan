import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { GoogleIntegrationsForm } from "./google-form";
import { CalendarIntegrationForm } from "./calendar-form";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  await requireSuperAdmin();
  const sb = await createClient();
  const { data: settings } = await sb.from("integrations_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <>
      <PageHeader
        title="التكاملات الخارجية"
        description="إدارة التكاملات مع خدمات Google والخدمات الخارجية الأخرى."
        hidePrint
      />
      <PageBody>
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 text-white font-black text-xs">
                  G
                </span>
                خدمات Google
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Google Analytics + Search Console — تتبع الزيارات وتحسين فهرسة الموقع في بحث Google.
              </p>
            </CardHeader>
            <CardContent>
              <GoogleIntegrationsForm settings={settings} />
            </CardContent>
          </Card>

          {/* Calendar Sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 text-white text-base">
                  📅
                </span>
                Google Calendar Sync
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                مشاركة جدول التدريبات والمباريات مع تقويم المستخدم (Google / Apple / Outlook) عبر iCalendar feed.
              </p>
            </CardHeader>
            <CardContent>
              <CalendarIntegrationForm settings={settings} />
            </CardContent>
          </Card>

          {/* Future integrations placeholder */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-base">🛡 Google reCAPTCHA</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">قريباً — حماية النماذج من البوتات.</p>
            </CardHeader>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
