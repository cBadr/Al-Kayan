"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

function bumpAll() {
  revalidatePath("/", "layout");
  revalidatePath("/super-admin/landing");
}

/* ============================================================================
   SETTINGS (singleton)
   ========================================================================= */
export async function saveLandingSettings(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();

  const founderPhoto = await uploadIfPresent("logos", fd, "founder_photo", "landing/founder");
  const founderSecondary = await uploadIfPresent("logos", fd, "founder_secondary_photo", "landing/founder");

  const update: Record<string, any> = {
    brand_tagline: textOrNull(fd.get("brand_tagline")),
    show_founder: fd.get("show_founder") === "on",
    founder_name: textOrNull(fd.get("founder_name")),
    founder_title: textOrNull(fd.get("founder_title")),
    founder_bio: textOrNull(fd.get("founder_bio")),
    founder_section_title: textOrNull(fd.get("founder_section_title")),
    founder_section_subtitle: textOrNull(fd.get("founder_section_subtitle")),
    show_features: fd.get("show_features") === "on",
    features_section_title: textOrNull(fd.get("features_section_title")),
    features_section_subtitle: textOrNull(fd.get("features_section_subtitle")),
    show_testimonials: fd.get("show_testimonials") === "on",
    testimonials_section_title: textOrNull(fd.get("testimonials_section_title")),
    testimonials_section_subtitle: textOrNull(fd.get("testimonials_section_subtitle")),
    show_gallery: fd.get("show_gallery") === "on",
    gallery_section_title: textOrNull(fd.get("gallery_section_title")),
    gallery_section_subtitle: textOrNull(fd.get("gallery_section_subtitle")),
    show_career: fd.get("show_career") === "on",
    career_section_title: textOrNull(fd.get("career_section_title")),
    show_achievements: fd.get("show_achievements") === "on",
    achievements_section_title: textOrNull(fd.get("achievements_section_title")),
    show_cta: fd.get("show_cta") === "on",
    cta_title: textOrNull(fd.get("cta_title")),
    cta_subtitle: textOrNull(fd.get("cta_subtitle")),
    cta_button_label: textOrNull(fd.get("cta_button_label")),
    whatsapp_number: textOrNull(fd.get("whatsapp_number"))?.replace(/[^\d]/g, "") ?? null,
    contact_email: textOrNull(fd.get("contact_email")),
    contact_phone: textOrNull(fd.get("contact_phone")),
    contact_address: textOrNull(fd.get("contact_address")),
    facebook_url: textOrNull(fd.get("facebook_url")),
    instagram_url: textOrNull(fd.get("instagram_url")),
    youtube_url: textOrNull(fd.get("youtube_url")),
    footer_text: textOrNull(fd.get("footer_text")),
    hero_overlay_opacity: Number(fd.get("hero_overlay_opacity") ?? 0.55),
  };
  if (founderPhoto) update.founder_photo_url = founderPhoto;
  if (founderSecondary) update.founder_secondary_photo_url = founderSecondary;

  const { error } = await sb.from("landing_settings").update(update).eq("id", 1);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

/* ============================================================================
   HERO SLIDES
   ========================================================================= */
export async function createHeroSlide(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const imagePath = await uploadIfPresent("logos", fd, "image", "landing/hero");
  const { data: existing } = await sb.from("landing_hero_slides")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { error } = await sb.from("landing_hero_slides").insert({
    title: String(fd.get("title") ?? "").trim(),
    subtitle: textOrNull(fd.get("subtitle")),
    description: textOrNull(fd.get("description")),
    image_url: imagePath,
    cta_label: textOrNull(fd.get("cta_label")),
    cta_link: textOrNull(fd.get("cta_link")),
    text_position: String(fd.get("text_position") ?? "right"),
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateHeroSlide(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const update: Record<string, any> = {
    title: String(fd.get("title") ?? "").trim(),
    subtitle: textOrNull(fd.get("subtitle")),
    description: textOrNull(fd.get("description")),
    cta_label: textOrNull(fd.get("cta_label")),
    cta_link: textOrNull(fd.get("cta_link")),
    text_position: String(fd.get("text_position") ?? "right"),
    active: fd.get("active") === "on",
  };
  const newImage = await uploadIfPresent("logos", fd, "image", "landing/hero");
  if (newImage) update.image_url = newImage;
  const { error } = await sb.from("landing_hero_slides").update(update).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteHeroSlide(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_hero_slides").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function moveHeroSlide(id: string, direction: "up" | "down"): Promise<void> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { data: all } = await sb.from("landing_hero_slides").select("id, display_order").order("display_order");
  if (!all) return;
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  const a = all[idx], b = all[swap];
  await sb.from("landing_hero_slides").update({ display_order: b.display_order }).eq("id", a.id);
  await sb.from("landing_hero_slides").update({ display_order: a.display_order }).eq("id", b.id);
  bumpAll();
}

/* ============================================================================
   FEATURES
   ========================================================================= */
export async function createFeature(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const imagePath = await uploadIfPresent("logos", fd, "image", "landing/features");
  const { data: existing } = await sb.from("landing_features")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { error } = await sb.from("landing_features").insert({
    icon: textOrNull(fd.get("icon")),
    title: String(fd.get("title") ?? "").trim(),
    description: textOrNull(fd.get("description")),
    image_url: imagePath,
    accent_color: String(fd.get("accent_color") ?? "emerald"),
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateFeature(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const update: Record<string, any> = {
    icon: textOrNull(fd.get("icon")),
    title: String(fd.get("title") ?? "").trim(),
    description: textOrNull(fd.get("description")),
    accent_color: String(fd.get("accent_color") ?? "emerald"),
    active: fd.get("active") === "on",
  };
  const newImage = await uploadIfPresent("logos", fd, "image", "landing/features");
  if (newImage) update.image_url = newImage;
  const { error } = await sb.from("landing_features").update(update).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteFeature(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_features").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

/* ============================================================================
   TESTIMONIALS
   ========================================================================= */
export async function createTestimonial(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const photoPath = await uploadIfPresent("logos", fd, "author_photo", "landing/testimonials");
  const { data: existing } = await sb.from("landing_testimonials")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { error } = await sb.from("landing_testimonials").insert({
    author_name: String(fd.get("author_name") ?? "").trim(),
    author_role: textOrNull(fd.get("author_role")),
    author_photo_url: photoPath,
    quote: String(fd.get("quote") ?? "").trim(),
    rating: Number(fd.get("rating") ?? 5),
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateTestimonial(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const update: Record<string, any> = {
    author_name: String(fd.get("author_name") ?? "").trim(),
    author_role: textOrNull(fd.get("author_role")),
    quote: String(fd.get("quote") ?? "").trim(),
    rating: Number(fd.get("rating") ?? 5),
    active: fd.get("active") === "on",
  };
  const newPhoto = await uploadIfPresent("logos", fd, "author_photo", "landing/testimonials");
  if (newPhoto) update.author_photo_url = newPhoto;
  const { error } = await sb.from("landing_testimonials").update(update).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_testimonials").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

function textOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

/* ============================================================================
   GALLERY
   ========================================================================= */
export async function createGalleryImage(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const imagePath = await uploadIfPresent("logos", fd, "image", "landing/gallery");
  if (!imagePath) return { error: "اختر صورة" };
  const { data: existing } = await sb.from("landing_gallery_images")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { error } = await sb.from("landing_gallery_images").insert({
    image_url: imagePath,
    title: textOrNull(fd.get("title")),
    caption: textOrNull(fd.get("caption")),
    tag: textOrNull(fd.get("tag")),
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateGalleryImage(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const update: Record<string, any> = {
    title: textOrNull(fd.get("title")),
    caption: textOrNull(fd.get("caption")),
    tag: textOrNull(fd.get("tag")),
    active: fd.get("active") === "on",
  };
  const newImage = await uploadIfPresent("logos", fd, "image", "landing/gallery");
  if (newImage) update.image_url = newImage;
  const { error } = await sb.from("landing_gallery_images").update(update).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteGalleryImage(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_gallery_images").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

/* ============================================================================
   FOUNDER CAREER (timeline)
   ========================================================================= */
export async function createCareerStop(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { data: existing } = await sb.from("landing_founder_career")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { error } = await sb.from("landing_founder_career").insert({
    role: String(fd.get("role") ?? "").trim(),
    organization: String(fd.get("organization") ?? "").trim(),
    period_label: textOrNull(fd.get("period_label")),
    description: textOrNull(fd.get("description")),
    is_current: fd.get("is_current") === "on",
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateCareerStop(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_founder_career").update({
    role: String(fd.get("role") ?? "").trim(),
    organization: String(fd.get("organization") ?? "").trim(),
    period_label: textOrNull(fd.get("period_label")),
    description: textOrNull(fd.get("description")),
    is_current: fd.get("is_current") === "on",
    active: fd.get("active") === "on",
  }).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteCareerStop(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_founder_career").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

/* ============================================================================
   FOUNDER ACHIEVEMENTS
   ========================================================================= */
export async function createAchievement(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { data: existing } = await sb.from("landing_founder_achievements")
    .select("display_order").order("display_order", { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { error } = await sb.from("landing_founder_achievements").insert({
    icon: textOrNull(fd.get("icon")),
    title: String(fd.get("title") ?? "").trim(),
    description: textOrNull(fd.get("description")),
    year: textOrNull(fd.get("year")),
    display_order: nextOrder,
    active: true,
  });
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function updateAchievement(id: string, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_founder_achievements").update({
    icon: textOrNull(fd.get("icon")),
    title: String(fd.get("title") ?? "").trim(),
    description: textOrNull(fd.get("description")),
    year: textOrNull(fd.get("year")),
    active: fd.get("active") === "on",
  }).eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<{ ok?: boolean; error?: string }> {
  await requireSuperAdmin();
  const sb = await createClient();
  const { error } = await sb.from("landing_founder_achievements").delete().eq("id", id);
  if (error) return { error: error.message };
  bumpAll();
  return { ok: true };
}
