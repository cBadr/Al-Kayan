import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getAppSettings } from "@/lib/app-settings";
import { redirect } from "next/navigation";

export default async function Home() {
  const u = await getCurrentUser();
  if (u) {
    if (u.isSuperAdmin) redirect("/super-admin");
    if (u.managedAcademyIds.length > 0) redirect(`/academy/${u.managedAcademyIds[0]}`);
    if (u.coachedAcademyIds.length > 0) redirect(`/academy/${u.coachedAcademyIds[0]}/attendance`);
    redirect("/me");
  }

  const s = await getAppSettings();

  return (
    <div className="flex flex-1 relative overflow-hidden bg-mesh-emerald text-white">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />

      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
        <circle cx="600" cy="400" r="120" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="600" cy="400" r="4" fill="white" />
        <line x1="600" y1="0" x2="600" y2="800" stroke="white" strokeWidth="2" />
      </svg>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-7 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            {s.tagline ?? "منصة إدارة احترافية لأكاديميات كرة القدم"}
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            <span className="text-gradient-gold">{s.app_name}</span>
            <br />
            <span className="text-white/95">حيث تُصنع نجوم</span>
            <br />
            <span className="text-white/80 text-3xl md:text-4xl">كرة القدم</span>
          </h1>
          <p className="text-base md:text-lg text-white/75 max-w-lg leading-loose">
            نظام موحَّد متعدد الأكاديميات: تدريبات وحضور، مباريات وتقارير أداء،
            اشتراكات ومصروفات وأصول، إشعارات تلقائية، وكل ما تحتاجه لإدارة احترافية تليق بطموحك.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="gold" className="text-base">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base bg-white/5 border-white/20 text-white hover:bg-white/15 hover:text-white">
              <Link href="/join">طلب انضمام لاعب جديد</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 pt-4 text-xs text-white/60" dir="ltr">
            {s.contact_email && <a href={`mailto:${s.contact_email}`} className="hover:text-gold-400">✉ {s.contact_email}</a>}
            {s.contact_phone && <span>📞 {s.contact_phone}</span>}
            {s.contact_whatsapp && <a href={`https://wa.me/${s.contact_whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener" className="hover:text-gold-400">💬 {s.contact_whatsapp}</a>}
            {s.support_url && <a href={s.support_url} target="_blank" rel="noopener" className="hover:text-gold-400">🔗 الموقع</a>}
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end animate-scale-in">
          <div className="absolute inset-0 bg-gold-400/5 blur-3xl rounded-full" />
          <div className="relative">
            <BrandLogo className="w-72 h-72 md:w-96 md:h-96 drop-shadow-2xl animate-float" rounded="rounded-3xl" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 glass-dark rounded-2xl px-5 py-3 text-center min-w-56">
              <div className="text-[11px] uppercase tracking-widest text-gold-400 font-bold">{s.app_name}</div>
              <div className="text-sm font-semibold mt-0.5">احترافية بلا حدود</div>
            </div>
          </div>
        </div>
      </main>

      {s.footer_text && (
        <div className="absolute bottom-0 inset-x-0 text-center py-3 text-xs text-white/40 z-10 no-print">
          {s.footer_text}
        </div>
      )}
    </div>
  );
}
