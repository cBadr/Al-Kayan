import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { SettingsCms, HeroSlidesCms, FeaturesCms, TestimonialsCms } from "./cms-clients";
import { GalleryCms, CareerCms, AchievementsCms } from "./cms-extra";

export const dynamic = "force-dynamic";

export default async function LandingCmsPage() {
  await requireSuperAdmin();
  const sb = await createClient();

  const [
    { data: settings },
    { data: slides },
    { data: features },
    { data: testimonials },
    { data: gallery },
    { data: career },
    { data: achievements },
  ] = await Promise.all([
    sb.from("landing_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("landing_hero_slides").select("*").order("display_order"),
    sb.from("landing_features").select("*").order("display_order"),
    sb.from("landing_testimonials").select("*").order("display_order"),
    sb.from("landing_gallery_images").select("*").order("display_order"),
    sb.from("landing_founder_career").select("*").order("display_order"),
    sb.from("landing_founder_achievements").select("*").order("display_order"),
  ]);

  return (
    <>
      <PageHeader
        title="إدارة الواجهة العامة (CMS)"
        description="تحكَّم في كل أقسام الـ Landing Page: شرائح Hero، المميزات، الآراء، نبذة المؤسس، التواصل، والفوتر."
        actions={
          <Button asChild variant="outline">
            <Link href="/" target="_blank">معاينة الصفحة الرئيسية ↗</Link>
          </Button>
        }
        hidePrint
      />
      <PageBody>
        <div className="space-y-6 max-w-5xl">
          {/* Hero slides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎬</span> Hero Slideshow ({(slides ?? []).length} شريحة)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                الشرائح تتبدَّل تلقائياً كل 6 ثوانٍ. لكل شريحة عنوان + وصف + زر CTA + صورة خلفية.
              </p>
            </CardHeader>
            <CardContent>
              <HeroSlidesCms slides={slides ?? []} />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span> بطاقات المميزات ({(features ?? []).length} بطاقة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturesCms features={features ?? []} />
            </CardContent>
          </Card>

          {/* Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💬</span> الآراء والتقييمات ({(testimonials ?? []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestimonialsCms items={testimonials ?? []} />
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🖼</span> معرض الصور ({(gallery ?? []).length} صورة)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                ارفع صوراً مع وسوم (مثل: تدريبات / مباريات / تتويج) لتُعرض في قسم المعرض مع فلتر تصفية بالوسم.
              </p>
            </CardHeader>
            <CardContent>
              <GalleryCms images={gallery ?? []} />
            </CardContent>
          </Card>

          {/* Founder career timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🛤</span> المسيرة المهنية للمؤسس ({(career ?? []).length} محطة)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                المحطات تظهر كـ Timeline تفاعلي في قسم "عن المؤسس". الترتيب يحدد التسلسل.
              </p>
            </CardHeader>
            <CardContent>
              <CareerCms stops={career ?? []} />
            </CardContent>
          </Card>

          {/* Founder achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> إنجازات المؤسس ({(achievements ?? []).length} إنجاز)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementsCms items={achievements ?? []} />
            </CardContent>
          </Card>

          {/* Settings (founder, contact, footer, labels) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span> الإعدادات العامة (المؤسس · العناوين · التواصل · الفوتر)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsCms settings={settings ?? {}} />
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
