"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWeeklySchedule } from "./actions";

type Category = { id: string; name: string };

type Slot = {
  id: string;
  category_id: string;
  weekday: number;        // 0=Sun … 6=Sat
  time: string;           // "HH:MM"
  duration_min: number;
  location: string;
};

const WEEKDAYS = [
  { value: 6, label: "السبت" },
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
];

function blankSlot(catId: string): Slot {
  return {
    id: crypto.randomUUID(),
    category_id: catId,
    weekday: 6,
    time: "17:00",
    duration_min: 90,
    location: "",
  };
}

export function WeeklyScheduler({
  academyId,
  categories,
}: {
  academyId: string;
  categories: Category[];
}) {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const defaultCat = categories[0]?.id ?? "";
  const [slots, setSlots] = useState<Slot[]>(defaultCat ? [blankSlot(defaultCat)] : []);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const addSlot = () => {
    if (categories.length === 0) {
      setMsg("أضف تصنيفات أولاً من صفحة التصنيفات");
      return;
    }
    setSlots((s) => [...s, blankSlot(defaultCat)]);
  };
  const removeSlot = (id: string) => setSlots((s) => s.filter((x) => x.id !== id));
  const updateSlot = (id: string, patch: Partial<Slot>) =>
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const duplicateForOtherCategory = (slot: Slot) => {
    const otherCats = categories.filter((c) => c.id !== slot.category_id);
    if (otherCats.length === 0) return;
    setSlots((s) => [
      ...s,
      ...otherCats.map((c) => ({
        ...slot,
        id: crypto.randomUUID(),
        category_id: c.id,
        time: addMinutes(slot.time, slot.duration_min), // schedule next category right after
      })),
    ]);
  };

  function generate() {
    if (slots.length === 0) { setMsg("أضف فترة واحدة على الأقل"); return; }
    setMsg(null);
    startTransition(async () => {
      const res = await createWeeklySchedule(academyId, {
        from,
        to,
        slots: slots.map((s) => ({
          category_id: s.category_id,
          weekday: s.weekday,
          time: s.time,
          duration_min: s.duration_min,
          location: s.location || null,
        })),
      });
      if (res.error) setMsg(`خطأ: ${res.error}`);
      else setMsg(`✅ تم توليد ${res.created} تدريب · تم تخطي ${res.skipped} (مكرر)`);
    });
  }

  // Group slots by weekday for clearer display
  const slotsByDay = WEEKDAYS.reduce((acc, w) => {
    acc[w.value] = slots.filter((s) => s.weekday === w.value);
    return acc;
  }, {} as Record<number, Slot[]>);

  if (categories.length === 0) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
        لا توجد تصنيفات. أضف تصنيفات (قطاعات) من <strong>صفحة التصنيفات</strong> أولاً قبل إعداد جدول التدريبات.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="from">من تاريخ</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">إلى تاريخ</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>اختصارات</Label>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setRangeWeeks(setFrom, setTo, 1)}>أسبوع</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setRangeWeeks(setFrom, setTo, 4)}>شهر</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setRangeWeeks(setFrom, setTo, 12)}>3 شهور</Button>
          </div>
        </div>
      </div>

      {/* Slot rows grouped by weekday */}
      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const daySlots = slotsByDay[day.value];
          if (daySlots.length === 0) return null;
          return (
            <div key={day.value} className="border border-emerald-200 rounded-lg bg-emerald-50/30 overflow-hidden">
              <div className="px-3 py-2 bg-emerald-100 font-bold text-sm text-emerald-900">
                📅 يوم {day.label}
              </div>
              <div className="divide-y divide-emerald-100">
                {daySlots.map((slot) => (
                  <SlotRow
                    key={slot.id}
                    slot={slot}
                    categories={categories}
                    onUpdate={(patch) => updateSlot(slot.id, patch)}
                    onRemove={() => removeSlot(slot.id)}
                    onDuplicateAcrossCategories={() => duplicateForOtherCategory(slot)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addSlot}>+ إضافة فترة تدريب</Button>
        <span className="ms-auto self-center text-sm text-muted-foreground">
          {slots.length} فترة · {countDays(from, to, slots.map((s) => s.weekday))} تدريب متوقع
        </span>
        <Button type="button" variant="gold" onClick={generate} disabled={pending || slots.length === 0}>
          {pending ? "جارٍ التوليد..." : "🚀 توليد جدول التدريبات"}
        </Button>
      </div>

      {msg && (
        <div className={`text-sm rounded-md p-3 ${msg.startsWith("خطأ") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
          {msg}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 يمكنك تحديد عدة فترات لنفس اليوم (تصنيفات مختلفة في أوقات مختلفة)، أو نفس الفترة لعدة أيام.
        التدريبات المكررة (نفس الموعد والتصنيف) يتم تخطيها تلقائياً.
      </p>
    </div>
  );
}

function SlotRow({
  slot, categories, onUpdate, onRemove, onDuplicateAcrossCategories,
}: {
  slot: Slot;
  categories: Category[];
  onUpdate: (patch: Partial<Slot>) => void;
  onRemove: () => void;
  onDuplicateAcrossCategories: () => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end p-3 bg-white">
      <div className="sm:col-span-3 space-y-1">
        <Label className="text-[10px]">التصنيف</Label>
        <select
          value={slot.category_id}
          onChange={(e) => onUpdate({ category_id: e.target.value })}
          className="w-full h-9 rounded-md border border-border bg-card px-2 text-sm"
        >
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2 space-y-1">
        <Label className="text-[10px]">اليوم</Label>
        <select
          value={slot.weekday}
          onChange={(e) => onUpdate({ weekday: Number(e.target.value) })}
          className="w-full h-9 rounded-md border border-border bg-card px-2 text-sm"
        >
          {WEEKDAYS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2 space-y-1">
        <Label className="text-[10px]">الوقت</Label>
        <Input
          type="time"
          value={slot.time}
          onChange={(e) => onUpdate({ time: e.target.value })}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-1 space-y-1">
        <Label className="text-[10px]">دقيقة</Label>
        <Input
          type="number"
          min={15}
          max={240}
          value={slot.duration_min}
          onChange={(e) => onUpdate({ duration_min: Number(e.target.value) || 90 })}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-3 space-y-1">
        <Label className="text-[10px]">الموقع</Label>
        <Input
          placeholder="ملعب الأكاديمية"
          value={slot.location}
          onChange={(e) => onUpdate({ location: e.target.value })}
          className="h-9"
        />
      </div>
      <div className="sm:col-span-1 flex gap-1 justify-end">
        <button
          type="button"
          onClick={onDuplicateAcrossCategories}
          title="تكرار للتصنيفات الأخرى (نفس اليوم — وقت متتالي)"
          className="h-9 w-9 rounded-md border border-border hover:bg-emerald-50 text-sm"
        >
          ⏭
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="حذف"
          className="h-9 w-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function setRangeWeeks(setFrom: (s: string) => void, setTo: (s: string) => void, weeks: number) {
  const today = new Date();
  setFrom(today.toISOString().slice(0, 10));
  const end = new Date(today.getTime() + weeks * 7 * 86400000);
  setTo(end.toISOString().slice(0, 10));
}

function countDays(from: string, to: string, weekdays: number[]) {
  if (!from || !to || weekdays.length === 0) return 0;
  const f = new Date(from);
  const t = new Date(to);
  const set = new Set(weekdays);
  let n = 0;
  for (let d = new Date(f); d <= t; d = new Date(d.getTime() + 86400000)) {
    if (set.has(d.getDay())) n++;
  }
  return n;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor((total / 60) % 24);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
