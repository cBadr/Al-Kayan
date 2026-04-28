"use client";

import { useState } from "react";
import Link from "next/link";

type Training = {
  id: string;
  scheduled_at: string;
  duration_min: number;
  location: string | null;
  category_name: string | null;
};

const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export function TrainingsCalendar({ academyId, trainings }: { academyId: string; trainings: Training[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthName = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(cursor);
  const firstDay = cursor.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const trainingsByDay = new Map<number, Training[]>();
  for (const t of trainings) {
    const d = new Date(t.scheduled_at);
    if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
      const arr = trainingsByDay.get(d.getDate()) ?? [];
      arr.push(t);
      trainingsByDay.set(d.getDate(), arr);
    }
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`pad-${i}`} className="aspect-square" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const items = trainingsByDay.get(d) ?? [];
    const isToday = new Date().toDateString() === new Date(cursor.getFullYear(), cursor.getMonth(), d).toDateString();
    cells.push(
      <div key={d} className={`aspect-square rounded-lg border ${isToday ? "border-gold-400 bg-gold-400/5" : "border-border bg-white"} p-1.5 overflow-hidden flex flex-col`}>
        <div className={`text-xs font-bold ${isToday ? "text-gold-600" : "text-emerald-900"}`}>{d}</div>
        <div className="flex-1 mt-1 space-y-0.5 overflow-hidden">
          {items.slice(0, 3).map((t) => (
            <Link
              key={t.id}
              href={`/academy/${academyId}/attendance?training=${t.id}`}
              className="block text-[10px] truncate px-1 py-0.5 rounded bg-emerald-700 text-white hover:bg-emerald-800"
              title={`${t.category_name ?? "تدريب"} — ${new Date(t.scheduled_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
            >
              {new Date(t.scheduled_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {t.category_name ?? "تدريب"}
            </Link>
          ))}
          {items.length > 3 && (
            <div className="text-[9px] text-muted-foreground">+{items.length - 3} آخر</div>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="px-3 py-1.5 rounded-md border border-border hover:bg-muted text-sm">← السابق</button>
        <h3 className="font-bold text-emerald-900">{monthName}</h3>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="px-3 py-1.5 rounded-md border border-border hover:bg-muted text-sm">التالي →</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
