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
import { AnimatedCardStack } from "@/components/landing/animated-cards";

export const dynamic = "force-dynamic";

/* ── Design Tokens ───────────────────────────────────── */
const BG      = "#030711";
const SURF    = "#0C1526";
const SURF2   = "#0F1D36";
const BLUE    = "#3B82F6";
const CYAN    = "#06B6D4";
const AMBER   = "#F59E0B";
const TEXT    = "#F1F5F9";
const BORD    = "rgba(59,130,246,0.14)";
const BORD_HI = "rgba(59,130,246,0.38)";

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
    <div
      className="flex-1 overflow-x-hidden bg-mesh-blue"
      style={{ background: BG, color: TEXT }}
    >

      {/* ══ NAV ════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(3,7,17,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: BORD,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo className="w-9 h-9 transition-transform group-hover:scale-105" rounded="rounded-xl" />
            <div className="leading-tight">
              <div className="font-black text-white text-[17px] tracking-tight">{appSettings.app_name}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                إدارة أكاديميات كرة القدم
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {settings.show_features && <NavLink href="#features" label="المميزات" />}
            <NavLink href="#how" label="كيف يعمل" />
            {settings.show_founder && <NavLink href="#about" label="عن المؤسس" />}
            {settings.show_gallery && gallery.length > 0 && <NavLink href="#gallery" label="المعرض" />}
            {settings.show_testimonials && testimonials.length > 0 && <NavLink href="#testimonials" label="الآراء" />}
            <NavLink href="#contact" label="تواصل" />
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"
              className="hidden sm:inline-flex text-white/55 hover:text-white hover:bg-white/6 transition-all">
              <Link href="/login">دخول</Link>
            </Button>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all hover:scale-105 animate-glow-pulse-blue"
              style={{
                background: `linear-gradient(135deg, ${BLUE} 0%, #2563EB 100%)`,
                color: "#fff",
                boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
              }}
            >
              انضمام لاعب
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO ═══════════════════════════════════════ */}
      <HeroSlideshow
        slides={slides}
        overlayOpacity={Number(settings.hero_overlay_opacity ?? 0.6)}
        fallbackTagline={settings.brand_tagline}
      />

      {/* ══ MARQUEE STRIP ══════════════════════════════ */}
      <div
        className="relative overflow-hidden border-y py-3"
        style={{ background: "rgba(3,7,17,0.98)", borderColor: "rgba(59,130,246,0.1)" }}
        aria-hidden="true"
      >
        <div className="flex animate-marquee whitespace-nowrap" dir="ltr">
          {[0, 1].map((pass) => (
            <span key={pass} className="inline-flex items-center shrink-0">
              {TICKER_ITEMS.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-3 mx-8">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: i % 2 === 0 ? BLUE : CYAN }}
                  />
                  <span
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: i % 2 === 0 ? "rgba(96,165,250,0.8)" : "rgba(34,211,238,0.75)" }}
                    dir="rtl"
                  >
                    {item}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══ DRAMATIC STATS ═════════════════════════════ */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: BG }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 25% 50%, rgba(37,99,235,0.08) 0%, transparent 60%), radial-gradient(ellipse at 75% 50%, rgba(6,182,212,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
              بأرقام حقيقية
            </span>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <Reveal delay={0}><MegaStat value={8} suffix="+" label="سنوات خبرة" icon={<IcoTime />} /></Reveal>
            <Reveal delay={100}><MegaStat value={500} suffix="+" label="لاعب مسجّل" icon={<IcoUsers />} /></Reveal>
            <Reveal delay={200}><MegaStat value={5} suffix="+" label="أكاديمية" icon={<IcoShield />} /></Reveal>
            <Reveal delay={300}><MegaStat value={50} suffix="+" label="معسكر تدريبي" icon={<IcoFlag />} /></Reveal>
          </div>
        </div>
      </section>

      {/* ══ EDITORIAL FEATURES ═════════════════════════ */}
      {settings.show_features && features.length > 0 && (
        <section id="features" className="py-20 md:py-32 relative" style={{ background: SURF }}>
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)" }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-16">
              <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                {settings.features_section_title ?? "المميزات"}
              </span>
              <h2
                className="font-black text-white mt-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}
              >
                {settings.features_section_subtitle ?? "كل ما تحتاجه في مكان واحد"}
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-sm md:text-base" style={{ color: "rgba(241,245,249,0.5)" }}>
                منصة متكاملة صُمِّمت خصيصاً لأكاديميات كرة القدم العربية
              </p>
            </Reveal>

            {/* Mobile: horizontal snap scroll */}
            <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
              {features.map((f, i) => (
                <div key={f.id} className="snap-start shrink-0 w-[82vw] max-w-[320px]">
                  <FeatureMobileCard f={f} i={i} />
                </div>
              ))}
            </div>

            {/* Desktop: editorial alternating layout */}
            <div className="hidden md:flex flex-col gap-6">
              {features.map((f, i) => {
                const isEven = i % 2 === 0;
                return (
                  <Reveal key={f.id} delay={Math.min(i * 80, 400)}>
                    <div
                      className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border card-glow-blue card-shimmer card-reveal"
                      style={{ background: SURF2, borderColor: BORD }}
                    >
                      {/* In RTL: even → visual on RIGHT (first in DOM), odd → visual on LEFT (second in DOM) */}
                      {isEven ? (
                        <>
                          <FeatureVisualBox f={f} i={i} />
                          <FeatureTextBox f={f} i={i} />
                        </>
                      ) : (
                        <>
                          <FeatureTextBox f={f} i={i} />
                          <FeatureVisualBox f={f} i={i} />
                        </>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
          <div
            className="absolute bottom-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)" }}
          />
        </section>
      )}

      {/* ══ HOW IT WORKS ═══════════════════════════════ */}
      <section id="how" className="py-20 md:py-32 relative overflow-hidden" style={{ background: BG }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(ellipse at 50% 60%, rgba(6,182,212,0.07) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
              البداية بسيطة
            </span>
            <h2
              className="font-black text-white mt-4"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3rem)", lineHeight: 1.15 }}
            >
              كيف يعمل النظام؟
            </h2>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* connector line on desktop */}
            <div
              className="hidden md:block absolute top-14 start-[16%] end-[16%] h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, ${BLUE}44, ${CYAN}44, ${BLUE}44)` }}
              aria-hidden="true"
            />
            {HOW_STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 130}>
                <div className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div
                      className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto icon-pop-hover float-bob float-bob-delay-${i}`}
                      style={{
                        background: step.bg,
                        border: `1px solid ${step.border}`,
                        boxShadow: `0 8px 32px ${step.shadow}`,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div
                      className="absolute -top-3 -end-3 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, color: "#fff" }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-black text-white text-xl mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(241,245,249,0.5)" }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center mt-14">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm text-white transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${BLUE} 0%, #2563EB 100%)`,
                boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
              }}
            >
              <IcoWhatsApp />
              ابدأ الآن مجاناً
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══ FOUNDER ════════════════════════════════════ */}
      {settings.show_founder && (
        <section id="about" className="py-20 md:py-32 relative" style={{ background: SURF }}>
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${BLUE}44, transparent)` }}
          />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-14">
              <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                عن المؤسس
              </span>
              <h2
                className="font-black text-white mt-4"
                style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)", lineHeight: 1.1 }}
              >
                {settings.founder_section_title ?? "الرؤية خلف المنصة"}
              </h2>
              {settings.founder_section_subtitle && (
                <p className="mt-3 max-w-xl leading-relaxed text-sm md:text-base" style={{ color: "rgba(241,245,249,0.5)" }}>
                  {settings.founder_section_subtitle}
                </p>
              )}
            </Reveal>

            <Reveal>
              <div className="grid md:grid-cols-[300px_1fr] gap-10 lg:gap-16 items-start">
                {/* Photo */}
                <div className="relative">
                  <div
                    className="relative aspect-[3/4] rounded-3xl overflow-hidden"
                    style={{ boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${BORD}` }}
                  >
                    {settings.founder_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.founder_photo_url} alt={settings.founder_name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-8xl font-black"
                        style={{ background: SURF2, color: BLUE }}
                      >
                        {settings.founder_name?.charAt(0) ?? "أ"}
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,7,17,0.7) 0%, transparent 50%)" }} />
                    {settings.founder_title && (
                      <div className="absolute bottom-4 inset-x-4 text-center">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: `${BLUE}22`, color: "#93C5FD", border: `1px solid ${BLUE}44` }}
                        >
                          {settings.founder_title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute -top-4 -end-4 w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xl rotate-3"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, color: "#fff" }}
                  >
                    <div className="text-2xl font-black leading-none">٢٠١٨</div>
                    <div className="text-[9px] font-bold mt-0.5 opacity-80">منذ</div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-6 md:pt-4">
                  <div>
                    <h3 className="text-2xl md:text-4xl font-black text-white">{settings.founder_name}</h3>
                    {settings.founder_title && (
                      <p className="text-sm font-semibold mt-1" style={{ color: CYAN }}>{settings.founder_title}</p>
                    )}
                  </div>
                  {settings.founder_bio && (
                    <p className="leading-[2.1] text-base whitespace-pre-line" style={{ color: "rgba(241,245,249,0.65)" }}>
                      {settings.founder_bio}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-5" style={{ borderTop: `1px solid ${BORD}` }}>
                    <FounderStat value={8} suffix="+" label="سنوات" />
                    <FounderStat value={5} suffix="+" label="أكاديميات" />
                    <FounderStat value={500} suffix="+" label="لاعب" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Achievements */}
            {settings.show_achievements && achievements.length > 0 && (
              <Reveal className="mt-20">
                <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                  {settings.achievements_section_title ?? "الإنجازات"}
                </span>
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
                <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                  {settings.career_section_title ?? "المسيرة المهنية"}
                </span>
                <CareerTimeline stops={career} />
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ══ GALLERY ════════════════════════════════════ */}
      {settings.show_gallery && gallery.length > 0 && (
        <section id="gallery" className="py-20 md:py-28" style={{ background: BG }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-10">
              <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                {settings.gallery_section_title ?? "معرض الصور"}
              </span>
              {settings.gallery_section_subtitle && (
                <p className="mt-2 text-sm" style={{ color: "rgba(241,245,249,0.4)" }}>
                  {settings.gallery_section_subtitle}
                </p>
              )}
            </Reveal>
            <Reveal><Gallery images={gallery} /></Reveal>
          </div>
        </section>
      )}

      {/* ══ TESTIMONIALS ═══════════════════════════════ */}
      {settings.show_testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="relative py-20 md:py-32 overflow-hidden" style={{ background: SURF }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 50%, rgba(59,130,246,0.07) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(6,182,212,0.05) 0%, transparent 55%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-14">
              <span className="label-cyan text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>
                {settings.testimonials_section_title ?? "الآراء والتقييمات"}
              </span>
              <h2
                className="font-black text-white mt-4"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: 1.15 }}
              >
                {settings.testimonials_section_subtitle ?? "ماذا يقول اللاعبون وأولياء الأمور؟"}
              </h2>
            </Reveal>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 70} className="break-inside-avoid mb-5 testimonial-sway">
                  <TestimonialCard t={t} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA SPLIT ══════════════════════════════════ */}
      {settings.show_cta && (
        <section id="contact" className="relative overflow-hidden py-20 md:py-32" style={{ background: BG }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 25% 50%, rgba(37,99,235,0.14) 0%, transparent 60%), radial-gradient(ellipse at 75% 50%, rgba(6,182,212,0.08) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${BLUE}55, transparent)` }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Text side */}
              <Reveal>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-6"
                  style={{ background: `${BLUE}10`, borderColor: `${BLUE}44`, color: "#93C5FD" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYAN }} />
                  ابدأ خلال دقائق — بدون تعقيدات
                </div>

                <h2
                  className="font-black text-white leading-tight mb-6"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
                >
                  {settings.cta_title}
                </h2>

                {settings.cta_subtitle && (
                  <p
                    className="text-base md:text-lg leading-loose mb-10 whitespace-pre-line"
                    style={{ color: "rgba(241,245,249,0.55)" }}
                  >
                    {settings.cta_subtitle}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl font-black text-sm text-white transition-all hover:scale-105 animate-glow-pulse-blue"
                    style={{
                      background: `linear-gradient(135deg, ${BLUE} 0%, #1D4ED8 100%)`,
                      boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
                    }}
                  >
                    <IcoWhatsApp />
                    {settings.cta_button_label?.replace(/^[^؀-ۿ]+/, "") ?? "احجز عرضاً مجانياً عبر واتساب"}
                  </a>
                  {settings.contact_email && (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
                      style={{ color: "rgba(241,245,249,0.6)", border: `1px solid ${BORD_HI}` }}
                    >
                      راسلنا
                    </a>
                  )}
                </div>

                {/* Contact pills */}
                <div className="flex flex-wrap gap-3 mt-8">
                  {settings.whatsapp_number && (
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <ContactPill icon={<IcoWhatsApp />} label={settings.whatsapp_number} />
                    </a>
                  )}
                  {settings.contact_phone && (
                    <a href={`tel:${settings.contact_phone}`}>
                      <ContactPill icon={<IcoPhone />} label={settings.contact_phone} />
                    </a>
                  )}
                  {settings.contact_email && (
                    <a href={`mailto:${settings.contact_email}`}>
                      <ContactPill icon={<IcoMail />} label={settings.contact_email} />
                    </a>
                  )}
                </div>
              </Reveal>

              {/* Visual side: animated card stack */}
              <Reveal delay={200} className="hidden md:block">
                <AnimatedCardStack />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ FOOTER ═════════════════════════════════════ */}
      <footer
        className="border-t py-14"
        style={{ background: "rgba(3,7,17,0.98)", borderColor: BORD }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo className="w-10 h-10" rounded="rounded-xl" />
              <div className="font-black text-white text-xl">{appSettings.app_name}</div>
            </div>
            <p className="leading-relaxed max-w-sm text-sm" style={{ color: "rgba(241,245,249,0.3)" }}>
              {settings.brand_tagline ?? "منصة عربية متكاملة لإدارة أكاديميات كرة القدم."}
            </p>
            {(settings.facebook_url || settings.instagram_url || settings.youtube_url) && (
              <div className="flex gap-2 mt-5" dir="ltr">
                {settings.facebook_url && (
                  <SocialIcon href={settings.facebook_url} label="Facebook">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </SocialIcon>
                )}
                {settings.instagram_url && (
                  <SocialIcon href={settings.instagram_url} label="Instagram">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </SocialIcon>
                )}
                {settings.youtube_url && (
                  <SocialIcon href={settings.youtube_url} label="YouTube">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </SocialIcon>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">روابط سريعة</h4>
            <ul className="space-y-2.5" style={{ color: "rgba(241,245,249,0.45)" }}>
              {settings.show_features && <li><a href="#features" className="hover:text-white transition-colors">المميزات</a></li>}
              <li><a href="#how" className="hover:text-white transition-colors">كيف يعمل</a></li>
              {settings.show_founder && <li><a href="#about" className="hover:text-white transition-colors">عن المؤسس</a></li>}
              {settings.show_gallery && gallery.length > 0 && <li><a href="#gallery" className="hover:text-white transition-colors">المعرض</a></li>}
              {settings.show_testimonials && testimonials.length > 0 && <li><a href="#testimonials" className="hover:text-white transition-colors">الآراء</a></li>}
              <li><Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
              <li><Link href="/join" className="hover:text-white transition-colors">طلب انضمام</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-widest uppercase">تواصل</h4>
            <ul className="space-y-2.5" dir="ltr" style={{ color: "rgba(241,245,249,0.45)" }}>
              {settings.whatsapp_number && (
                <li>
                  <a href={wa} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                    +{settings.whatsapp_number}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li><a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">{settings.contact_phone}</a></li>
              )}
              {settings.contact_email && (
                <li><a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">{settings.contact_email}</a></li>
              )}
              {settings.contact_address && <li dir="rtl">{settings.contact_address}</li>}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between gap-3 text-xs"
          style={{ borderTop: `1px solid ${BORD}`, color: "rgba(241,245,249,0.2)" }}
        >
          <div>{settings.footer_text ?? `© ${new Date().getFullYear()} ${appSettings.app_name}. جميع الحقوق محفوظة.`}</div>
          <div>صُمِّم بشغف للأكاديميات العربية</div>
        </div>
      </footer>

      {settings.whatsapp_number && <WhatsappFloating phone={settings.whatsapp_number} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════ */

const TICKER_ITEMS = [
  "إدارة اللاعبين والحضور",
  "تسجيل الرسوم والمدفوعات",
  "تقارير وإحصائيات فورية",
  "متابعة الأداء والمهارات",
  "إشعارات للاعبين وأولياء الأمور",
  "إدارة المدربين والجداول",
  "دعم متعدد الأكاديميات",
];

const HOW_STEPS = [
  {
    title: "سجّل أكاديميتك",
    desc: "أنشئ حسابك في دقائق وأعدّ بياناتك دون أي تعقيد تقني",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(59,130,246,0.25)",
    shadow: "rgba(37,99,235,0.15)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    title: "أضف اللاعبين والمدربين",
    desc: "استورد أو أدخل بيانات اللاعبين وحدد الفرق والمجموعات",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    shadow: "rgba(6,182,212,0.12)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    title: "أدر كل شيء من مكان واحد",
    desc: "تابع الحضور والمدفوعات والأداء وأرسل الإشعارات — لوحة تحكم موحدة",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    shadow: "rgba(245,158,11,0.12)",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
];

/* ═══════════════════════════════════════════════════════
   FEATURE COMPONENTS
═══════════════════════════════════════════════════════ */

const FEAT_COLORS = [
  { bg: "rgba(37,99,235,0.08)",  icon: "#60A5FA",  glow: "rgba(37,99,235,0.18)",  num: "#3B82F6" },
  { bg: "rgba(6,182,212,0.08)",  icon: "#22D3EE",  glow: "rgba(6,182,212,0.15)",  num: "#06B6D4" },
  { bg: "rgba(245,158,11,0.08)", icon: "#FCD34D",  glow: "rgba(245,158,11,0.15)", num: "#F59E0B" },
  { bg: "rgba(167,139,250,0.08)",icon: "#C4B5FD",  glow: "rgba(167,139,250,0.14)",num: "#8B5CF6" },
  { bg: "rgba(16,185,129,0.08)", icon: "#6EE7B7",  glow: "rgba(16,185,129,0.14)", num: "#10B981" },
];

function FeatureVisualBox({ f, i }: { f: FeatureCard; i: number }) {
  const c = FEAT_COLORS[i % FEAT_COLORS.length];
  return (
    <div
      className="relative flex items-center justify-center min-h-[260px] md:min-h-[320px] overflow-hidden"
      style={{ background: c.bg }}
    >
      {/* glow blob */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{ background: c.glow }}
      />
      {/* large decorative number */}
      <div
        className="absolute text-[12rem] font-black leading-none select-none pointer-events-none"
        style={{ color: "rgba(255,255,255,0.03)", lineHeight: 1 }}
        aria-hidden="true"
      >
        {String(i + 1).padStart(2, "0")}
      </div>
      {/* icon */}
      <div className="relative z-10 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-4xl"
          style={{
            background: `${c.bg.replace("0.08", "0.18")}`,
            border: `1px solid ${c.icon}33`,
            color: c.icon,
          }}
        >
          {f.icon ?? "⚽"}
        </div>
      </div>
      {f.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-8 mix-blend-luminosity"
        />
      )}
    </div>
  );
}

function FeatureTextBox({ f, i }: { f: FeatureCard; i: number }) {
  const c = FEAT_COLORS[i % FEAT_COLORS.length];
  return (
    <div className="p-8 md:p-12 flex flex-col justify-center">
      <div
        className="text-6xl font-black leading-none mb-6 opacity-30 select-none"
        style={{ color: c.num }}
        aria-hidden="true"
      >
        {String(i + 1).padStart(2, "0")}
      </div>
      <h3
        className="font-black text-white leading-tight mb-4"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        {f.title}
      </h3>
      {f.description && (
        <p className="text-sm md:text-base leading-[1.9]" style={{ color: "rgba(241,245,249,0.55)" }}>
          {f.description}
        </p>
      )}
    </div>
  );
}

function FeatureMobileCard({ f, i }: { f: FeatureCard; i: number }) {
  const c = FEAT_COLORS[i % FEAT_COLORS.length];
  return (
    <div
      className="rounded-2xl border overflow-hidden h-full"
      style={{ background: SURF2, borderColor: BORD }}
    >
      <div
        className="flex items-center justify-center h-32 relative"
        style={{ background: c.bg }}
      >
        <div className="text-4xl">{f.icon ?? "⚽"}</div>
        <div
          className="absolute text-7xl font-black leading-none select-none pointer-events-none opacity-5"
          style={{ color: c.num }}
          aria-hidden="true"
        >
          {String(i + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-black text-white text-lg mb-2">{f.title}</h3>
        {f.description && (
          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "rgba(241,245,249,0.5)" }}>
            {f.description}
          </p>
        )}
      </div>
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
      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-white"
      style={{ color: "rgba(241,245,249,0.55)" }}
    >
      {label}
    </a>
  );
}

function MegaStat({ value, suffix, label, icon }: { value: number; suffix?: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center group">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: "rgba(59,130,246,0.1)", border: `1px solid ${BORD_HI}` }}
      >
        {icon}
      </div>
      <div className="font-black leading-none mb-2" style={{ fontSize: "clamp(2.75rem, 7vw, 5rem)" }}>
        <Counter value={value} suffix={suffix} className="text-gradient-blue" />
      </div>
      <div className="text-xs font-semibold tracking-wide" style={{ color: "rgba(241,245,249,0.4)" }}>{label}</div>
    </div>
  );
}

function FounderStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div
      className="text-center p-3 rounded-xl border"
      style={{ background: "rgba(59,130,246,0.05)", borderColor: BORD }}
    >
      <div className="text-2xl md:text-3xl font-black" style={{ color: BLUE }}>
        <Counter value={value} suffix={suffix} />
      </div>
      <div className="text-[11px] font-semibold mt-1" style={{ color: "rgba(241,245,249,0.35)" }}>{label}</div>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      className="rounded-2xl border p-6 relative overflow-hidden transition-all duration-300 card-glow-blue card-shimmer card-reveal"
      style={{ background: SURF2, borderColor: BORD }}
    >
      <div
        className="absolute top-3 start-5 text-7xl font-black select-none leading-none pointer-events-none"
        style={{ color: `${BLUE}18`, fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        "
      </div>
      <div className="relative">
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
            <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={AMBER} aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
        <p className="text-sm leading-[1.9] mb-5" style={{ color: "rgba(241,245,249,0.75)" }}>"{t.quote}"</p>
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${BORD}` }}>
          <div
            className="avatar-ring w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-sm"
            style={{ background: SURF, color: BLUE }}
          >
            {t.author_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.author_photo_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              t.author_name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate">{t.author_name}</div>
            {t.author_role && (
              <div className="text-[11px] truncate" style={{ color: `${CYAN}99` }}>{t.author_role}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:bg-white/4"
      style={{ background: "rgba(59,130,246,0.06)", borderColor: BORD, color: "rgba(241,245,249,0.6)" }}
    >
      <span style={{ color: BLUE }}>{icon}</span>
      <span className="ltr-numbers" dir="ltr">{label}</span>
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden transition-all group card-glow-blue h-full"
      style={{ background: SURF2, borderColor: BORD }}
    >
      <div
        className="absolute -top-10 -end-10 w-28 h-28 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${BLUE}25, transparent 70%)` }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(59,130,246,0.1)", border: `1px solid ${BORD_HI}`, color: BLUE }}
        >
          {a.icon ?? "★"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-white text-sm leading-snug">{a.title}</h4>
          {a.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(241,245,249,0.4)" }}>{a.description}</p>
          )}
          {a.year && (
            <div
              className="text-[10px] font-bold mt-2 inline-block px-2 py-0.5 rounded-full ltr-numbers"
              style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD" }}
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

/* Free Unsplash football/sports images — cycle by index */
const CAREER_IMGS = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1540747913346-19212a4cf528?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc595f5890?w=112&h=112&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=112&h=112&fit=crop&auto=format&q=80",
];

function CareerTimeline({ stops }: { stops: CareerStop[] }) {
  return (
    <div className="relative mt-8">
      {/* Animated connector line */}
      <div
        className="absolute end-7 top-8 bottom-8 w-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(59,130,246,0.08)" }}
        aria-hidden="true"
      >
        <div className="connector-flow absolute inset-0" />
      </div>

      <ol className="space-y-5">
        {stops.map((stop, i) => {
          const img = CAREER_IMGS[i % CAREER_IMGS.length];
          return (
            <Reveal key={stop.id} delay={i * 90}>
              <li className="relative pe-20 group">

                {/* ── Photo circle ── */}
                <div
                  className={`absolute end-0 top-0 z-10 w-14 h-14 rounded-full overflow-hidden
                    ${stop.is_current ? "ring-spin-gradient timeline-current-pulse" : ""}
                    transition-transform duration-300 group-hover:scale-110`}
                  style={
                    stop.is_current
                      ? {}
                      : { boxShadow: "0 0 0 2px rgba(59,130,246,0.22), 0 4px 16px rgba(0,0,0,0.4)" }
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="timeline-photo w-full h-full object-cover"
                    style={{ filter: stop.is_current ? "brightness(1.05) saturate(1.1)" : "brightness(0.65) saturate(0.6)" }}
                  />
                  {/* gradient overlay bottom */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: stop.is_current
                        ? "linear-gradient(to top, rgba(37,99,235,0.75) 0%, transparent 55%)"
                        : "linear-gradient(to top, rgba(3,7,17,0.7) 0%, transparent 55%)",
                    }}
                  />
                  {/* year inside circle */}
                  {stop.year && (
                    <div
                      className="absolute bottom-1 inset-x-0 text-center text-[9px] font-black text-white ltr-numbers"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                    >
                      {stop.year}
                    </div>
                  )}
                  {/* current checkmark badge */}
                  {stop.is_current && (
                    <div
                      className="absolute -top-1 -end-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, fontSize: 9, color: "#fff", fontWeight: 900 }}
                    >
                      ✓
                    </div>
                  )}
                </div>

                {/* ── Card ── */}
                <div
                  className={`rounded-2xl border p-5 transition-all duration-300 group-hover:-translate-y-0.5 card-reveal
                    ${stop.is_current ? "timeline-card-active" : ""}`}
                  style={
                    stop.is_current
                      ? {
                          background: "rgba(59,130,246,0.055)",
                          borderColor: `${BLUE}44`,
                          boxShadow: "0 4px 24px rgba(59,130,246,0.1)",
                        }
                      : { background: "rgba(255,255,255,0.025)", borderColor: "rgba(59,130,246,0.1)" }
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <h4 className="font-black text-white text-sm leading-snug">{stop.role}</h4>
                    {stop.year && (
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full ltr-numbers shrink-0"
                        style={
                          stop.is_current
                            ? { background: `${BLUE}22`, color: "#93C5FD", border: `1px solid ${BLUE}44` }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(241,245,249,0.35)" }
                        }
                      >
                        {stop.year}
                      </span>
                    )}
                  </div>
                  {stop.organization && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={stop.is_current ? CYAN : "rgba(241,245,249,0.3)"} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                      <p className="text-xs font-semibold" style={{ color: stop.is_current ? `${CYAN}cc` : "rgba(241,245,249,0.35)" }}>
                        {stop.organization}
                      </p>
                    </div>
                  )}
                  {stop.description && (
                    <p className="text-xs leading-relaxed mt-1" style={{ color: "rgba(241,245,249,0.45)" }}>
                      {stop.description}
                    </p>
                  )}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:bg-blue-500 hover:text-white"
      style={{ background: "rgba(59,130,246,0.1)", color: "rgba(96,165,250,0.6)", border: `1px solid ${BORD}` }}
    >
      {children}
    </a>
  );
}

/* ── SVG Icon Set ────────────────────────────────────── */

function IcoWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function IcoPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

function IcoMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function IcoTime() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}

function IcoUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function IcoShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IcoFlag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}
