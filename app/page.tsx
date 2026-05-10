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
import { getLandingContent, waLink, ACCENT_CLASSES, type FeatureCard, type Testimonial, type CareerStop, type Achievement } from "@/lib/landing";

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
    <div className="flex-1 bg-white text-emerald-950 overflow-x-hidden">
      {/* ============================================================
          NAV
          ============================================================ */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/5 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo className="w-9 h-9 transition-transform group-hover:scale-110" rounded="rounded-xl" />
            <div className="leading-tight">
              <div className="font-black text-emerald-900 text-lg">{appSettings.app_name}</div>
              <div className="text-[10px] text-emerald-700/70 font-semibold">إدارة احترافية</div>
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
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">دخول</Link>
            </Button>
            <Button asChild size="sm" variant="gold">
              <Link href="/join">⚽ انضمام لاعب جديد</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO SLIDESHOW
          ============================================================ */}
      <HeroSlideshow
        slides={slides}
        overlayOpacity={Number(settings.hero_overlay_opacity ?? 0.55)}
        fallbackTagline={settings.brand_tagline}
      />

      {/* ============================================================
          FOUNDER
          ============================================================ */}
      {settings.show_founder && (
        <section id="about" className="py-16 md:py-24 bg-gradient-to-b from-white to-emerald-50/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-12 max-w-2xl mx-auto">
              <div className="divider-x-gold mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-black text-emerald-900">
                {settings.founder_section_title ?? "عن المؤسس"}
              </h2>
              {settings.founder_section_subtitle && (
                <p className="text-muted-foreground mt-3">{settings.founder_section_subtitle}</p>
              )}
            </Reveal>

            <Reveal>
              <div className="grid md:grid-cols-[300px_1fr] gap-6 lg:gap-10 items-start">
                <div className="relative">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-950 border-4 border-gold-400/20 shadow-2xl">
                    {settings.founder_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.founder_photo_url} alt={settings.founder_name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl font-black text-gold-400">
                        {settings.founder_name?.charAt(0) ?? "أ"}
                      </div>
                    )}
                  </div>
                  {settings.founder_secondary_photo_url && (
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-emerald-900 hidden sm:block animate-float">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.founder_secondary_photo_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="absolute -top-3 -right-3 bg-gold-400 text-emerald-950 font-black text-xs px-3 py-1.5 rounded-lg shadow-lg rotate-6">
                    منذ ٢٠١٨
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-950">{settings.founder_name}</h3>
                    {settings.founder_title && (
                      <p className="text-sm text-emerald-700 font-semibold mt-1">{settings.founder_title}</p>
                    )}
                  </div>
                  {settings.founder_bio && (
                    <p className="text-base leading-loose text-emerald-950 whitespace-pre-line">
                      {settings.founder_bio}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-100">
                    <FounderStat value={8} suffix="+" label="سنوات خبرة" />
                    <FounderStat value={5} suffix="+" label="أكاديميات" />
                    <FounderStat value={500} suffix="+" label="لاعب" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ACHIEVEMENTS */}
            {settings.show_achievements && achievements.length > 0 && (
              <Reveal className="mt-16">
                <h3 className="text-2xl font-black text-emerald-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  {settings.achievements_section_title ?? "الإنجازات"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((a, i) => (
                    <Reveal key={a.id} delay={i * 70}>
                      <AchievementCard a={a} />
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            )}

            {/* TIMELINE */}
            {settings.show_career && career.length > 0 && (
              <Reveal className="mt-16">
                <h3 className="text-2xl font-black text-emerald-900 mb-8 flex items-center gap-3">
                  <span className="text-3xl">🛤</span>
                  {settings.career_section_title ?? "المسيرة المهنية"}
                </h3>
                <CareerTimeline stops={career} />
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          FEATURES
          ============================================================ */}
      {settings.show_features && features.length > 0 && (
        <section id="features" className="relative py-16 md:py-24 bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-12 max-w-2xl mx-auto">
              <div className="divider-x-gold mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-black text-emerald-900">
                {settings.features_section_title ?? "المميزات"}
              </h2>
              {settings.features_section_subtitle && (
                <p className="text-muted-foreground mt-3">{settings.features_section_subtitle}</p>
              )}
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {features.map((f, i) => (
                <Reveal key={f.id} delay={i * 60}>
                  <FeatureItem feature={f} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          GALLERY
          ============================================================ */}
      {settings.show_gallery && gallery.length > 0 && (
        <section id="gallery" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-10 max-w-2xl mx-auto">
              <div className="divider-x-gold mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-black text-emerald-900">
                {settings.gallery_section_title ?? "معرض الصور"}
              </h2>
              {settings.gallery_section_subtitle && (
                <p className="text-muted-foreground mt-3">{settings.gallery_section_subtitle}</p>
              )}
            </Reveal>
            <Reveal>
              <Gallery images={gallery} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}
      {settings.show_testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="relative py-16 md:py-24 bg-emerald-950 text-white overflow-hidden">
          <div className="absolute inset-0 noise-overlay opacity-30" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-gold-400/5 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-12 max-w-2xl mx-auto">
              <div className="divider-x-gold mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-black">
                {settings.testimonials_section_title ?? "الآراء والتقييمات"}
              </h2>
              {settings.testimonials_section_subtitle && (
                <p className="text-white/70 mt-3">{settings.testimonials_section_subtitle}</p>
              )}
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 80}>
                  <TestimonialItem t={t} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          CTA
          ============================================================ */}
      {settings.show_cta && (
        <section id="contact" className="py-16 md:py-24 bg-mesh-emerald text-white relative overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-gold-400/10 blur-3xl animate-drift" />
          <div className="absolute inset-0 noise-overlay opacity-30" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-xs font-bold mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                ابدأ خلال دقائق — بدون تعقيدات
              </div>
              <h2 className="text-3xl md:text-5xl font-black leading-tight mb-5">
                {settings.cta_title}
              </h2>
              {settings.cta_subtitle && (
                <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-loose whitespace-pre-line">
                  {settings.cta_subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href={wa} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-6 py-4 rounded-lg bg-gold-400 hover:bg-gold-500 text-emerald-950 font-bold text-base shadow-2xl shadow-gold-400/30 animate-glow-pulse transition-colors">
                  {settings.cta_button_label ?? "💬 تواصل عبر واتساب"}
                </a>
                {settings.contact_email && (
                  <a href={`mailto:${settings.contact_email}`}
                     className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-semibold text-white/90 border border-white/20 bg-white/5 hover:bg-white/15 transition-colors">
                    ✉ راسلنا بالبريد
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 text-sm">
                {settings.whatsapp_number && (
                  <ContactCard icon="💬" label="واتساب" value={settings.whatsapp_number} href={wa} external />
                )}
                {settings.contact_phone && (
                  <ContactCard icon="📞" label="هاتف مباشر" value={settings.contact_phone} href={`tel:${settings.contact_phone}`} />
                )}
                {settings.contact_email && (
                  <ContactCard icon="✉" label="البريد" value={settings.contact_email} href={`mailto:${settings.contact_email}`} />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-emerald-950 text-white/70 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <BrandLogo className="w-9 h-9" rounded="rounded-xl" />
              <div className="font-black text-white text-lg">{appSettings.app_name}</div>
            </div>
            <p className="leading-relaxed text-white/60 max-w-md">
              {settings.brand_tagline ?? "منصة عربية متكاملة لإدارة أكاديميات كرة القدم."}
            </p>
            {(settings.facebook_url || settings.instagram_url || settings.youtube_url) && (
              <div className="flex gap-2 mt-4" dir="ltr">
                {settings.facebook_url && <SocialIcon href={settings.facebook_url} label="Facebook">f</SocialIcon>}
                {settings.instagram_url && <SocialIcon href={settings.instagram_url} label="Instagram">📷</SocialIcon>}
                {settings.youtube_url && <SocialIcon href={settings.youtube_url} label="YouTube">▶</SocialIcon>}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">روابط سريعة</h4>
            <ul className="space-y-1.5 text-white/60">
              {settings.show_founder && <li><a href="#about" className="hover:text-gold-400">عن المؤسس</a></li>}
              {settings.show_features && <li><a href="#features" className="hover:text-gold-400">المميزات</a></li>}
              {settings.show_gallery && gallery.length > 0 && <li><a href="#gallery" className="hover:text-gold-400">المعرض</a></li>}
              {settings.show_testimonials && <li><a href="#testimonials" className="hover:text-gold-400">الآراء</a></li>}
              <li><Link href="/login" className="hover:text-gold-400">تسجيل الدخول</Link></li>
              <li><Link href="/join" className="hover:text-gold-400">طلب انضمام</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">تواصل</h4>
            <ul className="space-y-1.5 text-white/60" dir="ltr">
              {settings.whatsapp_number && (
                <li><a href={wa} className="hover:text-gold-400" target="_blank" rel="noopener noreferrer">💬 +{settings.whatsapp_number}</a></li>
              )}
              {settings.contact_phone && (
                <li><a href={`tel:${settings.contact_phone}`} className="hover:text-gold-400">📞 {settings.contact_phone}</a></li>
              )}
              {settings.contact_email && (
                <li><a href={`mailto:${settings.contact_email}`} className="hover:text-gold-400">✉ {settings.contact_email}</a></li>
              )}
              {settings.contact_address && <li>📍 {settings.contact_address}</li>}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between gap-3 text-xs text-white/50">
          <div>{settings.footer_text ?? `© ${new Date().getFullYear()} ${appSettings.app_name}. جميع الحقوق محفوظة.`}</div>
          <div>صُمِّم بشغف للأكاديميات المصرية والعربية ⚽</div>
        </div>
      </footer>

      {settings.whatsapp_number && <WhatsappFloating phone={settings.whatsapp_number} />}
    </div>
  );
}

/* ============================================================
   ATOMS
   ============================================================ */
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="px-3 py-2 rounded-md text-emerald-900/80 hover:text-emerald-900 hover:bg-emerald-50">
      {label}
    </a>
  );
}

function FounderStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-black text-emerald-700">
        <Counter value={value} suffix={suffix} />
      </div>
      <div className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</div>
    </div>
  );
}

function FeatureItem({ feature }: { feature: FeatureCard }) {
  const accent = ACCENT_CLASSES[feature.accent_color] ?? ACCENT_CLASSES.emerald;
  return (
    <div className="lift-on-hover h-full rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden relative">
      {feature.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feature.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
      )}
      <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${accent.glow} to-transparent opacity-60`} />
      <div className="relative p-5 sm:p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 ${accent.bg} ${accent.text}`}>
          {feature.icon ?? "✨"}
        </div>
        <h3 className="font-black text-emerald-900 text-lg mb-1.5">{feature.title}</h3>
        {feature.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        )}
      </div>
    </div>
  );
}

function TestimonialItem({ t }: { t: Testimonial }) {
  return (
    <div className="lift-on-hover h-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 relative">
      <span className="absolute -top-3 -right-3 text-5xl text-gold-400/30 font-black select-none">"</span>
      <div className="relative">
        <div className="text-gold-400 mb-3 text-sm">{"⭐".repeat(t.rating ?? 5)}</div>
        <p className="text-white/90 leading-loose text-base mb-5 italic">"{t.quote}"</p>
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <div className="w-12 h-12 rounded-full bg-emerald-700 overflow-hidden flex items-center justify-center text-gold-400 font-black text-lg shrink-0">
            {t.author_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.author_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              t.author_name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{t.author_name}</div>
            {t.author_role && <div className="text-[11px] text-gold-300/80 truncate">{t.author_role}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href, external }: { icon: string; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="lift-on-hover block rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-gold-400/30 transition-colors"
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[11px] text-white/60 font-semibold">{label}</div>
      <div className="font-bold text-white mt-0.5 ltr-numbers" dir="ltr">{value}</div>
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
      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-gold-400 hover:text-emerald-950 text-white flex items-center justify-center font-bold transition-colors"
    >
      {children}
    </a>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div className="lift-on-hover h-full rounded-2xl border-2 border-amber-100 hover:border-amber-300 bg-gradient-to-br from-amber-50/40 to-white p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl shadow-lg">
          {a.icon ?? "🏆"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-emerald-950">{a.title}</h4>
          {a.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
          )}
          {a.year && (
            <div className="text-[10px] text-amber-700 font-bold mt-2 inline-block bg-amber-100 px-2 py-0.5 rounded-full" dir="ltr">
              {a.year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CareerTimeline({ stops }: { stops: CareerStop[] }) {
  return (
    <div className="relative">
      {/* Vertical timeline line on the right side (RTL) */}
      <div className="absolute right-4 sm:right-6 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-300 via-gold-400 to-emerald-300" />
      <ol className="space-y-6">
        {stops.map((stop, i) => (
          <Reveal key={stop.id} delay={i * 100}>
            <li className="relative ps-12 sm:ps-16 group">
              {/* Timeline dot */}
              <span className={`absolute right-0 top-2 w-9 h-9 rounded-full flex items-center justify-center font-black text-white shadow-md ring-4 ring-white transition-transform group-hover:scale-125 ltr-numbers ${
                stop.is_current ? "bg-gradient-to-br from-gold-400 to-gold-600 animate-pulse-gold" : "bg-gradient-to-br from-emerald-700 to-emerald-900"
              }`}>
                {stops.length - i}
              </span>
              {/* Content card */}
              <div className={`lift-on-hover rounded-2xl border-2 p-4 sm:p-5 bg-white ${
                stop.is_current ? "border-gold-400/50 shadow-lg shadow-gold-400/10" : "border-emerald-100"
              }`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h4 className="font-black text-emerald-950 text-base sm:text-lg">{stop.role}</h4>
                    <div className="text-sm text-emerald-700 font-bold mt-0.5">{stop.organization}</div>
                  </div>
                  {stop.is_current && (
                    <span className="text-[10px] font-bold bg-gold-400 text-emerald-950 px-2 py-1 rounded-full shrink-0 animate-pulse">
                      ● حالياً
                    </span>
                  )}
                </div>
                {stop.period_label && (
                  <div className="text-xs text-muted-foreground mt-2 font-mono" dir="ltr">📅 {stop.period_label}</div>
                )}
                {stop.description && (
                  <p className="text-sm text-emerald-950/80 mt-3 leading-relaxed">{stop.description}</p>
                )}
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
