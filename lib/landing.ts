import { cache } from "react";
import { createAdminClient, hasSupabaseEnv } from "@/lib/supabase/admin";

export interface LandingSettings {
  brand_tagline: string | null;
  hero_overlay_opacity: number | null;

  show_founder: boolean;
  founder_name: string | null;
  founder_title: string | null;
  founder_bio: string | null;
  founder_photo_url: string | null;
  founder_secondary_photo_url: string | null;
  founder_section_title: string | null;
  founder_section_subtitle: string | null;

  show_features: boolean;
  features_section_title: string | null;
  features_section_subtitle: string | null;

  show_testimonials: boolean;
  testimonials_section_title: string | null;
  testimonials_section_subtitle: string | null;

  show_cta: boolean;
  cta_title: string | null;
  cta_subtitle: string | null;
  cta_button_label: string | null;

  show_gallery: boolean;
  gallery_section_title: string | null;
  gallery_section_subtitle: string | null;

  show_career: boolean;
  career_section_title: string | null;

  show_achievements: boolean;
  achievements_section_title: string | null;

  whatsapp_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;

  footer_text: string | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  text_position: "right" | "center" | "left";
  display_order: number;
  active: boolean;
}

export interface FeatureCard {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  accent_color: "emerald" | "gold" | "sky" | "amber" | "rose" | string;
  display_order: number;
  active: boolean;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  author_photo_url: string | null;
  quote: string;
  rating: number | null;
  display_order: number;
  active: boolean;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  tag: string | null;
  display_order: number;
  active: boolean;
}

export interface CareerStop {
  id: string;
  role: string;
  organization: string;
  period_label: string | null;
  description: string | null;
  is_current: boolean;
  display_order: number;
  active: boolean;
}

export interface Achievement {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
  year: string | null;
  display_order: number;
  active: boolean;
}

const DEFAULTS: LandingSettings = {
  brand_tagline: "منصة عربية متكاملة لأكاديميات كرة القدم",
  hero_overlay_opacity: 0.55,
  show_founder: true,
  founder_name: "أحمد سلامة",
  founder_title: "إداري كرة القدم · مؤسس النظام",
  founder_bio: null,
  founder_photo_url: null,
  founder_secondary_photo_url: null,
  founder_section_title: "عن المؤسس",
  founder_section_subtitle: null,
  show_features: true,
  features_section_title: "كل ما تحتاجه أكاديميتك في مكان واحد",
  features_section_subtitle: null,
  show_testimonials: true,
  testimonials_section_title: "ماذا يقول الإداريون والمدربون؟",
  testimonials_section_subtitle: null,
  show_cta: true,
  cta_title: "جاهز لنقل أكاديميتك إلى المستوى التالي؟",
  cta_subtitle: null,
  cta_button_label: "💬 احجز عرضاً مجانياً عبر واتساب",
  show_gallery: true,
  gallery_section_title: "معرض الصور",
  gallery_section_subtitle: "لقطات من الميدان — تدريبات، مباريات، وإنجازات.",
  show_career: true,
  career_section_title: "المسيرة المهنية",
  show_achievements: true,
  achievements_section_title: "الإنجازات والمحطات البارزة",
  whatsapp_number: "201033504082",
  contact_email: "ahmed01033504082@gmail.com",
  contact_phone: "+201225508447",
  contact_address: "شبرا الخيمة — القليوبية، مصر",
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  footer_text: "© ٢٠٢٦ منصة سلامة. جميع الحقوق محفوظة.",
};

export const getLandingContent = cache(async (): Promise<{
  settings: LandingSettings;
  slides: HeroSlide[];
  features: FeatureCard[];
  testimonials: Testimonial[];
  gallery: GalleryImage[];
  career: CareerStop[];
  achievements: Achievement[];
}> => {
  const empty = { settings: DEFAULTS, slides: [], features: [], testimonials: [], gallery: [], career: [], achievements: [] };
  if (!hasSupabaseEnv()) return empty;

  const sb = createAdminClient();
  try {
    const [
      { data: s },
      { data: slides },
      { data: features },
      { data: testimonials },
      { data: gallery },
      { data: career },
      { data: achievements },
    ] = await Promise.all([
      sb.from("landing_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("landing_hero_slides").select("*").eq("active", true).order("display_order"),
      sb.from("landing_features").select("*").eq("active", true).order("display_order"),
      sb.from("landing_testimonials").select("*").eq("active", true).order("display_order"),
      sb.from("landing_gallery_images").select("*").eq("active", true).order("display_order"),
      sb.from("landing_founder_career").select("*").eq("active", true).order("display_order"),
      sb.from("landing_founder_achievements").select("*").eq("active", true).order("display_order"),
    ]);
    return {
      settings: { ...DEFAULTS, ...(s ?? {}) } as LandingSettings,
      slides: (slides ?? []) as HeroSlide[],
      features: (features ?? []) as FeatureCard[],
      testimonials: (testimonials ?? []) as Testimonial[],
      gallery: (gallery ?? []) as GalleryImage[],
      career: (career ?? []) as CareerStop[],
      achievements: (achievements ?? []) as Achievement[],
    };
  } catch {
    return empty;
  }
});

export function waLink(phone: string | null | undefined, message?: string): string {
  const p = (phone ?? "").replace(/[^\d]/g, "") || "201033504082";
  return `https://wa.me/${p}?text=${encodeURIComponent(message ?? "أهلاً، أرغب في معرفة المزيد عن منصة سلامة")}`;
}

export const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", glow: "from-emerald-500/15" },
  gold:    { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   glow: "from-amber-400/15" },
  sky:     { bg: "bg-sky-100",     text: "text-sky-700",     border: "border-sky-200",     glow: "from-sky-400/15" },
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200",   glow: "from-amber-400/15" },
  rose:    { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200",    glow: "from-rose-400/15" },
};
