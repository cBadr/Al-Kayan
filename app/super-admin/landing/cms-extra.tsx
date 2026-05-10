"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createGalleryImage, updateGalleryImage, deleteGalleryImage,
  createCareerStop, updateCareerStop, deleteCareerStop,
  createAchievement, updateAchievement, deleteAchievement,
} from "./actions";

/* ============================================================================
   FEEDBACK FORM (shared)
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
   GALLERY MANAGER
   ========================================================================= */
export function GalleryCms({ images }: { images: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">لا توجد صور بعد</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => <GalleryRow key={img.id} img={img} />)}
        </div>
      )}
      {adding ? (
        <GalleryForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة صورة</Button>
      )}
    </div>
  );
}

function GalleryRow({ img }: { img: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  if (editing) return <div className="col-span-2 sm:col-span-3 md:col-span-4"><GalleryForm img={img} onClose={() => setEditing(false)} /></div>;
  return (
    <div className={`relative group rounded-xl overflow-hidden border border-border bg-white ${!img.active ? "opacity-50" : ""}`}>
      <div className="aspect-square bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.image_url} alt={img.title ?? ""} className="w-full h-full object-cover" />
      </div>
      <div className="p-2 space-y-1">
        {img.title && <div className="font-semibold text-xs truncate">{img.title}</div>}
        {img.tag && <Badge variant="muted" className="text-[10px]">{img.tag}</Badge>}
        {!img.active && <Badge variant="destructive" className="text-[10px]">معطَّلة</Badge>}
      </div>
      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setEditing(true)}>تعديل</Button>
        <Button size="sm" variant="destructive" className="h-7 px-2 text-[10px]"
          disabled={pending}
          onClick={() => {
            if (!confirm("حذف هذه الصورة؟")) return;
            startTransition(async () => { await deleteGalleryImage(img.id); });
          }}>حذف</Button>
      </div>
    </div>
  );
}

function GalleryForm({ img, onClose }: { img?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
      <FeedbackForm
        action={async (fd) => img ? updateGalleryImage(img.id, fd) : createGalleryImage(fd)}
        encType="multipart/form-data"
        saveLabel={img ? "حفظ التعديلات" : "إضافة الصورة"}
      >
        <FilePicker name="image" label={img ? "استبدال الصورة (اختياري)" : "الصورة *"} current={img?.image_url} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="title" label="العنوان (اختياري)" defaultValue={img?.title ?? ""} />
          <Field name="tag" label="الوسم (للتصفية)" defaultValue={img?.tag ?? ""} placeholder="مثال: تدريبات / مباريات / تتويج" />
        </div>
        <div className="space-y-1.5">
          <Label>وصف موجز</Label>
          <textarea name="caption" rows={2} defaultValue={img?.caption ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        {img && <Toggle name="active" label="مفعَّلة" defaultChecked={img.active} />}
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </FeedbackForm>
    </div>
  );
}

/* ============================================================================
   CAREER MANAGER (timeline)
   ========================================================================= */
export function CareerCms({ stops }: { stops: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {stops.map((s) => <CareerRow key={s.id} stop={s} />)}
      </ul>
      {adding ? (
        <CareerForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة محطة مهنية</Button>
      )}
    </div>
  );
}

function CareerRow({ stop }: { stop: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  if (editing) return <CareerForm stop={stop} onClose={() => setEditing(false)} />;
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-white p-3 ${!stop.active ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-emerald-950">{stop.role}</span>
          {stop.is_current && <Badge variant="success" className="text-[10px]">حتى الآن</Badge>}
          {!stop.active && <Badge variant="destructive" className="text-[10px]">معطَّلة</Badge>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{stop.organization}</div>
        {stop.period_label && <div className="text-[10px] text-emerald-700 mt-0.5" dir="ltr">{stop.period_label}</div>}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
        <Button size="sm" variant="ghost" className="text-red-600" disabled={pending}
          onClick={() => {
            if (!confirm("حذف هذه المحطة؟")) return;
            startTransition(async () => { await deleteCareerStop(stop.id); });
          }}>حذف</Button>
      </div>
    </div>
  );
}

function CareerForm({ stop, onClose }: { stop?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
      <FeedbackForm
        action={async (fd) => stop ? updateCareerStop(stop.id, fd) : createCareerStop(fd)}
        saveLabel={stop ? "حفظ التعديلات" : "إضافة المحطة"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="role" label="المسمى الوظيفي *" defaultValue={stop?.role ?? ""} required />
          <Field name="organization" label="اسم النادي/الأكاديمية *" defaultValue={stop?.organization ?? ""} required />
        </div>
        <Field name="period_label" label="الفترة (نص حر)" defaultValue={stop?.period_label ?? ""} placeholder="مثال: 03-2019 → 09-2024" dir="ltr" />
        <div className="space-y-1.5">
          <Label>وصف موجز</Label>
          <textarea name="description" rows={3} defaultValue={stop?.description ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle name="is_current" label="حتى الآن (محطة حالية)" defaultChecked={stop?.is_current} />
          {stop && <Toggle name="active" label="مفعَّلة" defaultChecked={stop.active} />}
        </div>
        <div className="flex justify-start">
          <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </FeedbackForm>
    </div>
  );
}

/* ============================================================================
   ACHIEVEMENTS MANAGER
   ========================================================================= */
export function AchievementsCms({ items }: { items: any[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((a) => <AchievementRow key={a.id} item={a} />)}
      </ul>
      {adding ? (
        <AchievementForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>+ إضافة إنجاز</Button>
      )}
    </div>
  );
}

function AchievementRow({ item }: { item: any }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  if (editing) return <div className="sm:col-span-2"><AchievementForm item={item} onClose={() => setEditing(false)} /></div>;
  return (
    <div className={`rounded-xl border border-border bg-white p-3 flex items-start gap-3 ${!item.active ? "opacity-50" : ""}`}>
      <div className="w-12 h-12 shrink-0 rounded-lg bg-amber-50 flex items-center justify-center text-2xl">{item.icon || "🏆"}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-emerald-950 truncate">{item.title}</div>
        {item.description && <div className="text-xs text-muted-foreground line-clamp-2">{item.description}</div>}
        {item.year && <div className="text-[10px] text-amber-700 mt-1 font-bold" dir="ltr">{item.year}</div>}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
        <Button size="sm" variant="ghost" className="text-red-600" disabled={pending}
          onClick={() => {
            if (!confirm("حذف هذا الإنجاز؟")) return;
            startTransition(async () => { await deleteAchievement(item.id); });
          }}>حذف</Button>
      </div>
    </div>
  );
}

function AchievementForm({ item, onClose }: { item?: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4 sm:col-span-2">
      <FeedbackForm
        action={async (fd) => item ? updateAchievement(item.id, fd) : createAchievement(fd)}
        saveLabel={item ? "حفظ التعديلات" : "إضافة الإنجاز"}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field name="icon" label="الأيقونة (إيموجي)" defaultValue={item?.icon ?? ""} placeholder="🏆 / 🎓 / ⚽" />
          <Field name="title" label="عنوان الإنجاز *" defaultValue={item?.title ?? ""} required className="md:col-span-2" />
        </div>
        <Field name="year" label="السنة (نص حر)" defaultValue={item?.year ?? ""} placeholder="2025 / 2024-2025" dir="ltr" />
        <div className="space-y-1.5">
          <Label>الوصف</Label>
          <textarea name="description" rows={3} defaultValue={item?.description ?? ""}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
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
   SHARED ATOMS
   ========================================================================= */
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
    </div>
  );
}
