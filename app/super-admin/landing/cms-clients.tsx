"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  saveLandingSettings,
  createHeroSlide, updateHeroSlide, deleteHeroSlide, moveHeroSlide,
  createFeature, updateFeature, deleteFeature,
  createTestimonial, updateTestimonial, deleteTestimonial,
} from "./actions";

/* ============================================================================
   GENERIC FORM WRAPPER WITH FEEDBACK
   ========================================================================= */
function FeedbackForm({
  action, children, saveLabel = "حفظ", encType,
}: {
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string }>;
  children: React.ReactNode;
  saveLabel?: string;
  encType?: "multipart/form-data";
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          setMsg(null);
          const res = await action(fd);
          if (res.error) setMsg({ kind: "err", text: res.error });
          else setMsg({ kind: "ok", text: "✅ تم الحفظ" });
        });
      }}
      encType={encType}
      className="space-y-3"
    >
      {children}
      {msg && (
        <div className={`text-xs rounded-md p-2 ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : saveLabel}</Button>
      </div>
    </form>
  );
}

/* ============================================================================
   SETTINGS FORM (singleton)
   ========================================================================= */
export function SettingsCms({ settings }: { settings: any }) {
  return (
    <FeedbackForm action={saveLandingSettings} encType="multipart/form-data" saveLabel="حفظ الإعدادات">
      <Section title="🌟 العامة" subtitle="نص شريط Hero ودرجة العتمة الافتراضية">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="brand_tagline" label="شعار الشريط (Tagline)" defaultValue={settings.brand_tagline ?? ""} />
          <Field name="hero_overlay_opacity" label="عتمة خلفية Hero (0..1)" type="number" min="0" max="1" step="0.05" defaultValue={settings.hero_overlay_opacity ?? 0.55} />
        </div>
      </Section>

      <Section title="👤 المؤسس" subtitle="قسم 'عن المؤسس'">
        <Toggle name="show_founder" label="إظهار قسم المؤسس" defaultChecked={settings.show_founder} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="founder_section_title" label="عنوان القسم" defaultValue={settings.founder_section_title ?? ""} />
          <Field name="founder_section_subtitle" label="عنوان فرعي" defaultValue={settings.founder_section_subtitle ?? ""} />
          <Field name="founder_name" label="اسم المؤسس" defaultValue={settings.founder_name ?? ""} />
          <Field name="founder_title" label="المسمى الوظيفي" defaultValue={settings.founder_title ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>السيرة (Bio)</Label>
          <textarea name="founder_bio" rows={5} defaultValue={settings.founder_bio ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FilePicker name="founder_photo" label="صورة المؤسس الرئيسية" current={settings.founder_photo_url} />
          <FilePicker name="founder_secondary_photo" label="صورة إضافية (اختياري)" current={settings.founder_secondary_photo_url} />
        </div>
      </Section>

      <Section title="✨ المميزات" subtitle="عناوين قسم المميزات">
        <Toggle name="show_features" label="إظهار قسم المميزات" defaultChecked={settings.show_features} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="features_section_title" label="عنوان القسم" defaultValue={settings.features_section_title ?? ""} />
          <Field name="features_section_subtitle" label="عنوان فرعي" defaultValue={settings.features_section_subtitle ?? ""} />
        </div>
      </Section>

      <Section title="💬 الآراء والتقييمات" subtitle="عناوين قسم التقييمات">
        <Toggle name="show_testimonials" label="إظهار قسم الآراء" defaultChecked={settings.show_testimonials} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="testimonials_section_title" label="عنوان القسم" defaultValue={settings.testimonials_section_title ?? ""} />
          <Field name="testimonials_section_subtitle" label="عنوان فرعي" defaultValue={settings.testimonials_section_subtitle ?? ""} />
        </div>
      </Section>

      <Section title="🖼 معرض الصور" subtitle="عناوين قسم المعرض">
        <Toggle name="show_gallery" label="إظهار قسم المعرض" defaultChecked={settings.show_gallery} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="gallery_section_title" label="عنوان القسم" defaultValue={settings.gallery_section_title ?? ""} />
          <Field name="gallery_section_subtitle" label="عنوان فرعي" defaultValue={settings.gallery_section_subtitle ?? ""} />
        </div>
      </Section>

      <Section title="🛤 المسيرة المهنية (Timeline)" subtitle="عنوان قسم المحطات المهنية">
        <Toggle name="show_career" label="إظهار قسم المسيرة المهنية" defaultChecked={settings.show_career} />
        <Field name="career_section_title" label="عنوان القسم" defaultValue={settings.career_section_title ?? ""} />
      </Section>

      <Section title="🏆 الإنجازات" subtitle="عنوان قسم الإنجازات والمحطات البارزة">
        <Toggle name="show_achievements" label="إظهار قسم الإنجازات" defaultChecked={settings.show_achievements} />
        <Field name="achievements_section_title" label="عنوان القسم" defaultValue={settings.achievements_section_title ?? ""} />
      </Section>

      <Section title="🚀 زر CTA النهائي" subtitle="بانر CTA قبل الفوتر">
        <Toggle name="show_cta" label="إظهار قسم CTA" defaultChecked={settings.show_cta} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="cta_title" label="عنوان CTA" defaultValue={settings.cta_title ?? ""} />
          <Field name="cta_button_label" label="نص الزر" defaultValue={settings.cta_button_label ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>وصف فرعي</Label>
          <textarea name="cta_subtitle" rows={2} defaultValue={settings.cta_subtitle ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
      </Section>

      <Section title="📞 التواصل والروابط" subtitle="هذه البيانات تظهر في أزرار CTA + الفوتر + الزر العائم">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="whatsapp_number" label="رقم واتساب (بدون + ورموز)" placeholder="201033504082" dir="ltr" defaultValue={settings.whatsapp_number ?? ""} />
          <Field name="contact_phone" label="هاتف للعرض" dir="ltr" defaultValue={settings.contact_phone ?? ""} />
          <Field name="contact_email" label="بريد التواصل" type="email" dir="ltr" defaultValue={settings.contact_email ?? ""} />
          <Field name="contact_address" label="العنوان" defaultValue={settings.contact_address ?? ""} />
          <Field name="facebook_url" label="رابط فيسبوك" type="url" dir="ltr" defaultValue={settings.facebook_url ?? ""} />
          <Field name="instagram_url" label="رابط إنستجرام" type="url" dir="ltr" defaultValue={settings.instagram_url ?? ""} />
          <Field name="youtube_url" label="رابط يوتيوب" type="url" dir="ltr" defaultValue={settings.youtube_url ?? ""} />
        </div>
      </Section>

      <Section title="📝 الفوتر" subtitle="نص حقوق الفوتر">
        <Field name="footer_text" label="نص الفوتر" defaultValue={settings.footer_text ?? ""} />
      </Section>
    </FeedbackForm>
  );
}

/* ============================================================================
   HERO SLIDES MANAGER
   ========================================================================= */
export function HeroSlidesCms({ slides }: { slides: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {slides.map((s, i) => (
          <SlideRow key={s.id} slide={s} index={i} totalCount={slides.length} />
        ))}
      </ul>
      {adding ? (
        <SlideForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة شريحة جديدة</Button>
      )}
    </div>
  );
}

function SlideRow({ slide, index, totalCount }: { slide: any; index: number; totalCount: number }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) return <SlideForm slide={slide} onClose={() => setEditing(false)} />;

  return (
    <div className="rounded-xl border border-border bg-white p-3 flex gap-3 items-start">
      <div className="w-20 h-14 sm:w-32 sm:h-20 rounded-lg bg-muted overflow-hidden shrink-0 relative">
        {slide.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">بدون صورة</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-bold">#{index + 1}</span>
          <span className="font-bold text-emerald-950 truncate">{slide.title}</span>
          {!slide.active && <Badge variant="muted" className="text-[10px]">معطَّل</Badge>}
        </div>
        {slide.subtitle && <div className="text-xs text-muted-foreground mt-0.5 truncate">{slide.subtitle}</div>}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled={pending || index === 0}
            onClick={() => startTransition(async () => { await moveHeroSlide(slide.id, "up"); })}>↑</Button>
          <Button size="sm" variant="ghost" disabled={pending || index === totalCount - 1}
            onClick={() => startTransition(async () => { await moveHeroSlide(slide.id, "down"); })}>↓</Button>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
          <Button size="sm" variant="ghost" className="text-red-600" disabled={pending}
            onClick={() => {
              if (!confirm(`حذف الشريحة "${slide.title}"؟`)) return;
              startTransition(async () => { await deleteHeroSlide(slide.id); });
            }}>حذف</Button>
        </div>
      </div>
    </div>
  );
}

function SlideForm({ slide, onClose }: { slide?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
      <FeedbackForm
        action={async (fd) => slide ? updateHeroSlide(slide.id, fd) : createHeroSlide(fd)}
        encType="multipart/form-data"
        saveLabel={slide ? "حفظ التعديلات" : "إضافة الشريحة"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="title" label="العنوان الرئيسي *" defaultValue={slide?.title ?? ""} required />
          <Field name="subtitle" label="عنوان فرعي" defaultValue={slide?.subtitle ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>الوصف</Label>
          <textarea name="description" rows={3} defaultValue={slide?.description ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field name="cta_label" label="نص الزر (CTA)" defaultValue={slide?.cta_label ?? ""} placeholder="مثال: ابدأ الآن" />
          <Field name="cta_link" label="رابط الزر" defaultValue={slide?.cta_link ?? ""} placeholder="/join" dir="ltr" />
          <div className="space-y-1.5">
            <Label>محاذاة النص</Label>
            <select name="text_position" defaultValue={slide?.text_position ?? "right"}
              className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
              <option value="right">يمين</option>
              <option value="center">وسط</option>
              <option value="left">يسار</option>
            </select>
          </div>
        </div>
        <FilePicker name="image" label="صورة الخلفية" current={slide?.image_url} />
        {slide && (
          <Toggle name="active" label="مفعَّل" defaultChecked={slide.active} />
        )}
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </FeedbackForm>
    </div>
  );
}

/* ============================================================================
   FEATURES MANAGER
   ========================================================================= */
const ACCENTS = [
  { value: "emerald", label: "أخضر زمردي" },
  { value: "gold", label: "ذهبي" },
  { value: "sky", label: "سماوي" },
  { value: "amber", label: "كهرماني" },
  { value: "rose", label: "وردي" },
];

export function FeaturesCms({ features }: { features: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <FeatureRow key={f.id} feature={f} />
        ))}
      </ul>
      {adding ? (
        <FeatureForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة ميزة</Button>
      )}
    </div>
  );
}

function FeatureRow({ feature }: { feature: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  if (editing) return <FeatureForm feature={feature} onClose={() => setEditing(false)} />;
  return (
    <div className="rounded-xl border border-border bg-white p-3 flex items-start gap-3">
      <div className="w-12 h-12 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-2xl">{feature.icon || "✨"}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-emerald-950 truncate">{feature.title}</div>
        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{feature.description}</div>
        <div className="flex gap-1 mt-2">
          <Badge variant="muted" className="text-[10px]">{feature.accent_color}</Badge>
          {!feature.active && <Badge variant="destructive" className="text-[10px]">معطَّل</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
        <Button size="sm" variant="ghost" className="text-red-600" disabled={pending}
          onClick={() => {
            if (!confirm(`حذف "${feature.title}"؟`)) return;
            startTransition(async () => { await deleteFeature(feature.id); });
          }}>حذف</Button>
      </div>
    </div>
  );
}

function FeatureForm({ feature, onClose }: { feature?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4 sm:col-span-2">
      <FeedbackForm
        action={async (fd) => feature ? updateFeature(feature.id, fd) : createFeature(fd)}
        encType="multipart/form-data"
        saveLabel={feature ? "حفظ التعديلات" : "إضافة الميزة"}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field name="icon" label="الأيقونة (إيموجي)" defaultValue={feature?.icon ?? ""} placeholder="⚽ أو 👥" />
          <Field name="title" label="عنوان الميزة *" defaultValue={feature?.title ?? ""} required className="md:col-span-2" />
        </div>
        <div className="space-y-1.5">
          <Label>الوصف</Label>
          <textarea name="description" rows={3} defaultValue={feature?.description ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label>اللون المميز</Label>
          <select name="accent_color" defaultValue={feature?.accent_color ?? "emerald"}
            className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
            {ACCENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        {feature && <Toggle name="active" label="مفعَّل" defaultChecked={feature.active} />}
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </FeedbackForm>
    </div>
  );
}

/* ============================================================================
   TESTIMONIALS MANAGER
   ========================================================================= */
export function TestimonialsCms({ items }: { items: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((t) => <TestimonialRow key={t.id} item={t} />)}
      </ul>
      {adding ? (
        <TestimonialForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة رأي/تقييم</Button>
      )}
    </div>
  );
}

function TestimonialRow({ item }: { item: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  if (editing) return <TestimonialForm item={item} onClose={() => setEditing(false)} />;
  return (
    <div className="rounded-xl border border-border bg-white p-3 flex items-start gap-3">
      <div className="w-12 h-12 rounded-full bg-emerald-100 overflow-hidden shrink-0 flex items-center justify-center text-emerald-700 font-black text-lg">
        {item.author_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.author_photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          item.author_name?.charAt(0)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-emerald-950">{item.author_name}</div>
        <div className="text-xs text-muted-foreground">{item.author_role}</div>
        <p className="text-sm text-emerald-900/80 mt-1 line-clamp-2 italic">"{item.quote}"</p>
        <div className="text-xs mt-1">{"⭐".repeat(item.rating ?? 5)}</div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
        <Button size="sm" variant="ghost" className="text-red-600" disabled={pending}
          onClick={() => {
            if (!confirm(`حذف رأي "${item.author_name}"؟`)) return;
            startTransition(async () => { await deleteTestimonial(item.id); });
          }}>حذف</Button>
      </div>
    </div>
  );
}

function TestimonialForm({ item, onClose }: { item?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
      <FeedbackForm
        action={async (fd) => item ? updateTestimonial(item.id, fd) : createTestimonial(fd)}
        encType="multipart/form-data"
        saveLabel={item ? "حفظ التعديلات" : "إضافة الرأي"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="author_name" label="اسم الشخص *" defaultValue={item?.author_name ?? ""} required />
          <Field name="author_role" label="الصفة (مثلاً: مدرب البراعم)" defaultValue={item?.author_role ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>الرأي *</Label>
          <textarea name="quote" rows={4} defaultValue={item?.quote ?? ""} required
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>التقييم (نجمات)</Label>
            <select name="rating" defaultValue={item?.rating ?? 5}
              className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"⭐".repeat(n)} ({n}/5)</option>)}
            </select>
          </div>
          <FilePicker name="author_photo" label="صورة الشخص" current={item?.author_photo_url} />
        </div>
        {item && <Toggle name="active" label="مفعَّل" defaultChecked={item.active} />}
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </FeedbackForm>
    </div>
  );
}

/* ============================================================================
   ATOMS
   ========================================================================= */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-0 first:pt-0 space-y-3">
      <div>
        <h4 className="font-bold text-emerald-900">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4" />
      {label}
    </label>
  );
}

function FilePicker({ name, label, current }: { name: string; label: string; current?: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="w-16 h-12 shrink-0 rounded border border-border bg-muted overflow-hidden">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">لا يوجد</div>
          )}
        </div>
        <Input id={name} name={name} type="file" accept="image/*" className="flex-1" />
      </div>
      {current && <p className="text-[10px] text-muted-foreground">اترك الحقل فارغاً للإبقاء على الصورة الحالية</p>}
    </div>
  );
}
