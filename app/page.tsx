import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getAppSettings } from "@/lib/app-settings";
import { redirect } from "next/navigation";
import { Reveal, Counter } from "@/components/landing/scroll-reveal";
import { WhatsappFloating } from "@/components/landing/whatsapp-floating";
import { HeroSlideshow } from "@/components/landing/hero-slideshow";
import { Gallery } from "@/components/landing/gallery";
import {
  getLandingContent,
  waLink,
  type FeatureCard,
  type Testimonial,
  type CareerStop,
  type Achievement,
} from "@/lib/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const u = await getCurrentUser();
  if (u) {
    if (u.isSuperAdmin) redirect("/super-admin");
    if (u.managedAcademyIds.length > 0) redirect(`/academy/${u.managedAcademyIds[0]}`);
    if (u.coachedAcademyIds.length > 0) redirect(`/academy/${u.coachedAcademyIds[0]}/attendance`);
    redirect("/me");
  }

  const [appSettings, content] = await Promise.all([
    getAppSettings(),
    getLandingContent(),
  ]);
  const { settings, slides, features, testimonials, gallery, career, achievements } = content;
  const wa = waLink(settings.whatsapp_number);

  return (
    <div className="flex-1 overflow-x-hidden" style={{ background: "#060d08", color: "#e8f0ea" }}>

      {/* ── NAV ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass-dark border-b border-[#fbbf24]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo className="w-9 h-9 transition-transform group-hover:scale-105" rounded="rounded-xl" />
            <div className="leading-tight">
              <div className="font-black text-white text-lg tracking-tight">{appSettings.app_name}</div>
              <div className="text-[10px] text-[#fbbf24]/65 font-semibold tracking-widest uppercase">إدارة احترافية</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {settings.show_founder && <NavLink href="#about" label="عن المؤسس" />}
            {settings.show_features && <NavLink href="#features" label="المميزات" />}
            {settings.show_gallery && gallery.length > 0 && <NavLink href="#gallery" label="المعرض" />}
            {settings.show_testimonials && <NavLink href="#testimonials" label="الآراء" />}
            <NavLink href="#contact" label="تواصل" />
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-white/60 hover:text-white hover:bg-white/8">
              <Link href="/login">دخول</Link>
            </Button>
            <Button asChild size="sm" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-emerald-950 font-black shadow-lg shadow-[#fbbf24]/20 border-0 hover:scale-105 transition-all">
              <Link href="/join">انضمام لاعب</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────── */}
      <HeroSlideshow
        slides={slides}
        overlayOpacity={Number(settings.hero_overlay_opacity ?? 0.55)}
        fallbackTagline={settings.brand_tagline}
      />

      {/* ── STATS STRIP ──────────────────────────────── */}
      <div className="py-8 border-y border-[#fbbf24]/8" style={{ background: "rgba(6,13,8,0.98)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#fbbf24]/12">
            <StatPill value={8} suffix="+" label="سنوات خبرة" />
            <StatPill value={500} suffix="+" label="لاعب مسجّل" />
            <StatPill value={5} suffix="+" label="أكاديمية" />
          </div>
        </div>
      </div>

      {/* ── FOUNDER ──────────────────────────────────── */}
      {settings.show_founder && (
        <section id="about" className="py-20 md:py-32" style={{ background: "linear-gradient(180deg, #060d08 0%, #081209 100%)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <Reveal className="mb-14">
              <SectionLabel>عن المؤسس</SectionLabel>
              <h2 className="text-3xl md:text-5xl font-black mt-3 text-white">
                {settings.founder_section_title ?? "الرؤية خلف المنصة"}
              </h2>
              {settings.founder_section_subtitle && (
                <p className="text-white/40 mt-3 max-w-xl leading-relaxed">{settings.founder_section_subtitle}</p>
              )}
            </Reveal>

            <Reveal>
              <div className="grid md:grid-cols-[320px_1fr] gap-10 lg:gap-16 items-start">

                {/* Photo column */}
                <div className="relative">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                    {settings.founder_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.founder_photo_url}
                        alt={settings.founder_name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-8xl font-black text-[#fbbf24] bg-emerald-950">
                        {settings.founder_name?.charAt(0) ?? "أ"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
                    {settings.founder_title && (
                      <div className="absolute bottom-4 inset-x-4 text-center">
                        <div className="text-sm font-bold text-[#fbbf24] drop-shadow">{settings.founder_title}</div>
                      </div>
                    )}
                  </div>

                  {/* Year badge */}
                  <div
                    className="absolute -top-4 -end-4 w-20 h-20 rounded-xl flex flex-col items-center justify-center text-emerald-950 shadow-xl rotate-3"
                    style={{ background: "#fbbf24", boxShadow: "0 8px 24px rgba(251,191,36,0.35)" }}
                  >
                    <div className="text-2xl font-black leading-none">٢٠١٨</div>
                    <div className="text-[9px] font-bold mt-0.5">منذ</div>
                  </div>

                  {settings.founder_secondary_photo_url && (
                    <div className="absolute -bottom-6 -start-6 w-32 h-32 rounded-xl overflow-hidden border-2 border-[#fbbf24]/30 shadow-2xl animate-float hidden sm:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.founder_secondary_photo_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Bio column */}
                <div className="space-y-6 md:pt-4">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-black text-white">{settings.founder_name}</h3>
                    {settings.founder_title && (
                      <p className="text-sm text-emerald-400 font-semibold mt-1">{settings.founder_title}</p>
                    )}
                  </div>
                  {settings.founder_bio && (
                    <p className="text-white/65 leading-[2.1] text-base whitespace-pre-line">
                      {settings.founder_bio}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-5 border-t border-white/8">
                    <FounderStat value={8} suffix="+" label="سنوات خبرة" />
                    <FounderStat value={5} suffix="+" label="أكاديميات" />
                    <FounderStat value={500} suffix="+" label="لاعب" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Achievements */}
            {settings.show_achievements && achievements.length > 0 && (
              <Reveal className="mt-20">
                <SectionLabel>{settings.achievements_section_title ?? "الإنجازات"}</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {achievements.map((a, i) => (
                    <Reveal key={a.id} delay={i * 70}>
                      <AchievementCard a={a} />
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Timeline */}
            {settings.show_career && career.length > 0 && (
              <Reveal className="mt-20">
                <SectionLabel>{settings.career_section_title ?? "المسيرة المهنية"}</SectionLabel>
                <CareerTimeline stops={career} />
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── FEATURES (BENTO) ─────────────────────────── */}
      {settings.show_features && features.length > 0 && (
        <section id="features" className="py-20 md:py-32 relative overflow-hidden" style={{ background: "#040a06" }}>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-96 blur-[120px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(6,95,70,0.14) 0%, transparent 70%)" }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-14">
              <SectionLabel>{settings.features_section_title ?? "المميزات"}</SectionLabel>
              <h2 className="text-3xl md:text-5xl font-black mt-3 text-white max-w-2xl">
                {settings.features_section_subtitle ?? "كل ما تحتاجه في مكان واحد"}
              </h2>
            </Reveal>
            <BentoGrid features={features} />
          </div>
        </section>
      )}

      {/* ── GALLERY ──────────────────────────────────── */}
      {settings.show_gallery && gallery.length > 0 && (
        <section id="gallery" className="py-20 md:py-28" style={{ background: "#060d08" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-10">
              <SectionLabel>{settings.gallery_section_title ?? "معرض الصور"}</SectionLabel>
              {settings.gallery_section_subtitle && (
                <p className="text-white/40 mt-2 text-sm">{settings.gallery_section_subtitle}</p>
              )}
            </Reveal>
            <Reveal>
              <Gallery images={gallery} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      {settings.show_testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="relative py-20 md:py-32 overflow-hidden" style={{ background: "#030808" }}>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.10) 0%, transparent 50%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-14">
              <SectionLabel>{settings.testimonials_section_title ?? "الآراء والتقييمات"}</SectionLabel>
              {settings.testimonials_section_subtitle && (
                <p className="text-white/40 mt-2 max-w-xl text-sm">{settings.testimonials_section_subtitle}</p>
              )}
            </Reveal>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 70} className="break-inside-avoid mb-5">
                  <TestimonialItem t={t} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────── */}
      {settings.show_cta && (
        <section id="contact" className="relative py-24 md:py-36 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #022c22 55%, #0a1510 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 30% 55%, rgba(251,191,36,0.14) 0%, transparent 60%)", opacity: 0.9 }}
          />
          <div className="absolute inset-0 noise-overlay opacity-20" />
          <div className="absolute -top-40 -end-40 w-[32rem] h-[32rem] rounded-full border border-[#fbbf24]/8" />
          <div className="absolute -bottom-56 -start-56 w-[44rem] h-[44rem] rounded-full border border-emerald-500/5" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Reveal>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#fbbf24]/30 text-[#fbbf24] text-xs font-bold mb-6"
                style={{ background: "rgba(251,191,36,0.06)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse" />
                ابدأ خلال دقائق — بدون تعقيدات
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-6">
                {settings.cta_title}
              </h2>

              {settings.cta_subtitle && (
                <p className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-loose whitespace-pre-line">
                  {settings.cta_subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-base transition-all hover:scale-105 hover:brightness-110"
                  style={{ background: "#fbbf24", color: "#022c22", boxShadow: "0 8px 32px rgba(251,191,36,0.28)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {settings.cta_button_label?.replace(/^[\s\S]*?[؀-ۿ]/, (m) => m) ?? "احجز عرضاً مجانياً عبر واتساب"}
                </a>
                {settings.contact_email && (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white/70 border border-white/12 hover:bg-white/5 hover:border-white/25 hover:text-white transition-all"
                  >
                    راسلنا بالبريد
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-14">
                {settings.whatsapp_number && (
                  <ContactCard type="wa" label="واتساب" value={settings.whatsapp_number} href={wa} external />
                )}
                {settings.contact_phone && (
                  <ContactCard type="phone" label="هاتف مباشر" value={settings.contact_phone} href={`tel:${settings.contact_phone}`} />
                )}
                {settings.contact_email && (
                  <ContactCard type="email" label="البريد الإلكتروني" value={settings.contact_email} href={`mailto:${settings.contact_email}`} />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ background: "#020804" }} className="border-t border-white/5 text-white/55 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <BrandLogo className="w-10 h-10" rounded="rounded-xl" />
              <div className="font-black text-white text-xl">{appSettings.app_name}</div>
            </div>
            <p className="leading-relaxed text-white/35 max-w-sm text-sm">
              {settings.brand_tagline ?? "منصة عربية متكاملة لإدارة أكاديميات كرة القدم."}
            </p>
            {(settings.facebook_url || settings.instagram_url || settings.youtube_url) && (
              <div className="flex gap-2 mt-5" dir="ltr">
                {settings.facebook_url && (
                  <SocialIcon href={settings.facebook_url} label="Facebook">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </SocialIcon>
                )}
                {settings.instagram_url && (
                  <SocialIcon href={settings.instagram_url} label="Instagram">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  </SocialIcon>
                )}
                {settings.youtube_url && (
                  <SocialIcon href={settings.youtube_url} label="YouTube">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </SocialIcon>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">روابط سريعة</h4>
            <ul className="space-y-2.5">
              {settings.show_founder && (
                <li><a href="#about" className="hover:text-[#fbbf24] transition-colors">عن المؤسس</a></li>
              )}
              {settings.show_features && (
                <li><a href="#features" className="hover:text-[#fbbf24] transition-colors">المميزات</a></li>
              )}
              {settings.show_gallery && gallery.length > 0 && (
                <li><a href="#gallery" className="hover:text-[#fbbf24] transition-colors">المعرض</a></li>
              )}
              {settings.show_testimonials && (
                <li><a href="#testimonials" className="hover:text-[#fbbf24] transition-colors">الآراء</a></li>
              )}
              <li><Link href="/login" className="hover:text-[#fbbf24] transition-colors">تسجيل الدخول</Link></li>
              <li><Link href="/join" className="hover:text-[#fbbf24] transition-colors">طلب انضمام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">تواصل</h4>
            <ul className="space-y-2.5" dir="ltr">
              {settings.whatsapp_number && (
                <li>
                  <a href={wa} className="hover:text-[#fbbf24] transition-colors" target="_blank" rel="noopener noreferrer">
                    +{settings.whatsapp_number}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li>
                  <a href={`tel:${settings.contact_phone}`} className="hover:text-[#fbbf24] transition-colors">
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-[#fbbf24] transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_address && <li dir="rtl">{settings.contact_address}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between gap-3 text-xs text-white/22">
          <div>
            {settings.footer_text ?? `© ${new Date().getFullYear()} ${appSettings.app_name}. جميع الحقوق محفوظة.`}
          </div>
          <div>صُمِّم بشغف للأكاديميات العربية</div>
        </div>
      </footer>

      {settings.whatsapp_number && <WhatsappFloating phone={settings.whatsapp_number} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════ */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/6 transition-colors text-sm font-medium"
    >
      {label}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="w-6 h-0.5 rounded-full" style={{ background: "#fbbf24" }} />
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#fbbf24" }}>
        {children}
      </span>
    </div>
  );
}

function StatPill({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="text-center px-6 py-2">
      <div className="text-3xl md:text-4xl font-black text-white">
        <Counter value={value} suffix={suffix} />
      </div>
      <div className="text-xs text-white/35 mt-1 font-semibold">{label}</div>
    </div>
  );
}

function FounderStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div
      className="text-center p-3 rounded-xl border"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="text-2xl md:text-3xl font-black" style={{ color: "#fbbf24" }}>
        <Counter value={value} suffix={suffix} />
      </div>
      <div className="text-[11px] text-white/35 font-semibold mt-1">{label}</div>
    </div>
  );
}

/* ── Bento Grid ──────────────────────────────────────── */

function BentoGrid({ features }: { features: FeatureCard[] }) {
  if (!features.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:auto-rows-[220px]">
      {features.map((f, i) => {
        const isHero = i === 0;
        const isTall = i === 3 && features.length >= 5;
        const spanCls = [
          "lg:h-full",
          isHero ? "lg:col-span-2 lg:row-span-2" : "",
          isTall ? "lg:row-span-2" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <Reveal key={f.id} delay={i * 50} className={spanCls}>
            <BentoFeatureCard feature={f} isHero={isHero} />
          </Reveal>
        );
      })}
    </div>
  );
}

const DARK_ACCENT: Record<string, { iconBg: string; iconText: string; glow: string }> = {
  emerald: { iconBg: "rgba(16,185,129,0.12)", iconText: "#6ee7b7", glow: "rgba(16,185,129,0.14)" },
  gold:    { iconBg: "rgba(251,191,36,0.12)",  iconText: "#fcd34d", glow: "rgba(251,191,36,0.14)" },
  sky:     { iconBg: "rgba(56,189,248,0.12)",  iconText: "#7dd3fc", glow: "rgba(56,189,248,0.14)" },
  amber:   { iconBg: "rgba(251,191,36,0.12)",  iconText: "#fcd34d", glow: "rgba(251,191,36,0.14)" },
  rose:    { iconBg: "rgba(244,63,94,0.12)",   iconText: "#fda4af", glow: "rgba(244,63,94,0.14)" },
};

function BentoFeatureCard({ feature, isHero }: { feature: FeatureCard; isHero?: boolean }) {
  const acc = DARK_ACCENT[feature.accent_color] ?? DARK_ACCENT.emerald;
  return (
    <div
      className="group relative h-full rounded-2xl border border-white/8 overflow-hidden transition-all duration-300 hover:border-white/16 hover:shadow-2xl"
      style={{
        background: isHero
          ? "linear-gradient(135deg, #0a2010 0%, #071510 100%)"
          : "#0d1810",
      }}
    >
      {feature.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feature.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-18 transition-all duration-500 group-hover:scale-105"
        />
      )}
      <div
        className="absolute -top-20 -end-20 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500 opacity-50 group-hover:opacity-100 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${acc.glow} 0%, transparent 70%)` }}
      />
      <div className="relative h-full p-6 flex flex-col justify-end">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shrink-0"
          style={{ background: acc.iconBg, color: acc.iconText }}
        >
          {feature.icon ?? "✦"}
        </div>
        <h3
          className={`font-black text-white leading-tight mb-2 ${
            isHero ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          {feature.title}
        </h3>
        {feature.description && (
          <p
            className={`text-white/42 leading-relaxed ${
              isHero ? "text-sm md:text-base line-clamp-4" : "text-sm line-clamp-3"
            }`}
          >
            {feature.description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Testimonials ────────────────────────────────────── */

function TestimonialItem({ t }: { t: Testimonial }) {
  return (
    <div
      className="rounded-2xl border border-white/8 p-6 relative overflow-hidden hover:border-white/14 transition-colors"
      style={{ background: "#0d1710" }}
    >
      <div
        className="absolute top-3 start-4 text-7xl font-black select-none leading-none pointer-events-none"
        style={{ color: "rgba(16,185,129,0.12)", fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        "
      </div>
      <div className="relative">
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
            <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <p className="text-white/80 leading-[1.9] text-sm mb-5">"{t.quote}"</p>
        <div className="flex items-center gap-3 pt-4 border-t border-white/8">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-black text-sm shrink-0"
            style={{ background: "#0a2010", color: "#fbbf24" }}
          >
            {t.author_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.author_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              t.author_name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{t.author_name}</div>
            {t.author_role && (
              <div className="text-[11px] truncate" style={{ color: "rgba(251,191,36,0.6)" }}>
                {t.author_role}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Contact Card ────────────────────────────────────── */

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  wa: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  ),
  email: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
};

function ContactCard({
  type,
  label,
  value,
  href,
  external,
}: {
  type: string;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block rounded-xl border border-white/10 p-4 transition-all hover:border-[#fbbf24]/25 hover:bg-white/4 text-start group"
    >
      <div className="text-white/50 mb-2 group-hover:text-[#fbbf24] transition-colors">
        {CONTACT_ICONS[type] ?? CONTACT_ICONS.phone}
      </div>
      <div className="text-xs font-bold text-white/35 tracking-widest uppercase mb-0.5">{label}</div>
      <div className="font-bold text-white text-sm ltr-numbers" dir="ltr">{value}</div>
    </a>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#fbbf24";
        (e.currentTarget as HTMLElement).style.color = "#022c22";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
      }}
    >
      {children}
    </a>
  );
}

/* ── Achievement Card ────────────────────────────────── */

function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div
      className="rounded-2xl border border-white/8 p-5 relative overflow-hidden hover:border-white/16 transition-all group h-full"
      style={{ background: "#0d1810" }}
    >
      <div
        className="absolute -top-10 -end-10 w-28 h-28 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)" }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
        >
          {a.icon ?? "★"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-white text-sm leading-snug">{a.title}</h4>
          {a.description && (
            <p className="text-xs text-white/40 mt-1 leading-relaxed">{a.description}</p>
          )}
          {a.year && (
            <div
              className="text-[10px] font-bold mt-2 inline-block px-2 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,0.1)", color: "rgba(251,191,36,0.7)" }}
              dir="ltr"
            >
              {a.year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Career Timeline ─────────────────────────────────── */

function CareerTimeline({ stops }: { stops: CareerStop[] }) {
  return (
    <div className="relative mt-6">
      <div
        className="absolute end-4 sm:end-6 top-4 bottom-4 w-px"
        style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.6), rgba(16,185,129,0.3), transparent)" }}
      />
      <ol className="space-y-4">
        {stops.map((stop, i) => (
          <Reveal key={stop.id} delay={i * 90}>
            <li className="relative pe-14 sm:pe-18 group">
              <span
                className="absolute end-0 top-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-lg ring-4 transition-transform group-hover:scale-110 ltr-numbers"
                style={
                  stop.is_current
                    ? { background: "#fbbf24", color: "#022c22", ringColor: "rgba(251,191,36,0.2)" }
                    : { background: "#0a1f10", color: "rgba(255,255,255,0.65)", ringColor: "rgba(255,255,255,0.05)" }
                }
              >
                {stops.length - i}
              </span>
              <div
                className="rounded-xl border p-4 transition-all"
                style={
                  stop.is_current
                    ? { borderColor: "rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.04)" }
                    : { borderColor: "rgba(255,255,255,0.08)", background: "#0d1810" }
                }
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h4 className="font-black text-white text-sm">{stop.role}</h4>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">{stop.organization}</div>
                  </div>
                  {stop.is_current && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "#fbbf24", color: "#022c22" }}
                    >
                      حالياً
                    </span>
                  )}
                </div>
                {stop.period_label && (
                  <div className="text-[11px] text-white/30 mt-2 font-mono" dir="ltr">
                    {stop.period_label}
                  </div>
                )}
                {stop.description && (
                  <p className="text-sm text-white/45 mt-2 leading-relaxed">{stop.description}</p>
                )}
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
