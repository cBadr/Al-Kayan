"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { deleteTrainings, importTrainingsCsv } from "./actions";

type Training = {
  id: string;
  scheduled_at: string;
  duration_min: number;
  location: string | null;
  category_id: string | null;
  categories: { name: string } | null;
};

type Category = { id: string; name: string };

export function TrainingsTable({
  academyId,
  trainings,
  categories,
}: {
  academyId: string;
  trainings: Training[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "future" | "past">("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return trainings.filter((t) => {
      if (scopeFilter === "future" && new Date(t.scheduled_at).getTime() < now) return false;
      if (scopeFilter === "past" && new Date(t.scheduled_at).getTime() >= now) return false;
      if (categoryFilter && t.category_id !== categoryFilter) return false;
      if (filter) {
        const q = filter.toLowerCase();
        const hay = `${t.location ?? ""} ${t.categories?.name ?? ""} ${formatDate(t.scheduled_at, true)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trainings, filter, categoryFilter, scopeFilter]);

  const allChecked = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const someChecked = filtered.some((t) => selected.has(t.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) filtered.forEach((t) => next.delete(t.id));
      else filtered.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`حذف ${selected.size} تدريب؟ لا يمكن التراجع.`)) return;
    startTransition(async () => {
      const ids = [...selected];
      const res = await deleteTrainings(academyId, ids);
      if (res.error) alert(res.error);
      else setSelected(new Set());
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>التدريبات المجدولة ({filtered.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <CsvImporter academyId={academyId} categories={categories} />
            {selected.size > 0 && (
              <Button variant="destructive" onClick={bulkDelete} disabled={pending}>
                🗑 حذف المختار ({selected.size})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3 no-print">
          <Input
            placeholder="بحث (موقع/تصنيف/تاريخ)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 min-w-32"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as any)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="all">الكل</option>
            <option value="future">قادمة فقط</option>
            <option value="past">سابقة فقط</option>
          </select>
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-right">
                <th className="p-2 border border-emerald-200 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="p-2 border border-emerald-200">التاريخ</th>
                <th className="p-2 border border-emerald-200">التصنيف</th>
                <th className="p-2 border border-emerald-200">المدة</th>
                <th className="p-2 border border-emerald-200">الموقع</th>
                <th className="p-2 border border-emerald-200 no-print"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-8">لا توجد تدريبات</td></tr>
              ) : filtered.map((t) => {
                const isFuture = new Date(t.scheduled_at).getTime() > Date.now();
                return (
                  <tr key={t.id} className={`border-b border-emerald-100 ${selected.has(t.id) ? "bg-emerald-50/40" : "hover:bg-muted/20"}`}>
                    <td className="p-2 border border-emerald-100 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggle(t.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2 border border-emerald-100">
                      {formatDate(t.scheduled_at, true)}
                      {isFuture && <span className="ms-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">قادم</span>}
                    </td>
                    <td className="p-2 border border-emerald-100">{t.categories?.name ?? "—"}</td>
                    <td className="p-2 border border-emerald-100 ltr-numbers">{t.duration_min} د</td>
                    <td className="p-2 border border-emerald-100">{t.location ?? "—"}</td>
                    <td className="p-2 border border-emerald-100 text-left no-print">
                      <div className="flex gap-3 justify-end items-center">
                        <Link href={`/academy/${academyId}/attendance?training=${t.id}`} className="text-emerald-700 text-xs hover:underline">حضور</Link>
                        <Link href={`/academy/${academyId}/trainings?edit=${t.id}`} className="text-amber-600 text-xs hover:underline">تعديل</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="sm:hidden space-y-2">
          {filtered.length === 0 ? (
            <li className="text-center text-muted-foreground py-8">لا توجد تدريبات</li>
          ) : filtered.map((t) => {
            const isFuture = new Date(t.scheduled_at).getTime() > Date.now();
            const isSel = selected.has(t.id);
            return (
              <li
                key={t.id}
                className={`bg-white border rounded-xl p-3 flex items-start gap-3 ${
                  isSel ? "border-emerald-400 ring-1 ring-emerald-200" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(t.id)}
                  className="w-4 h-4 mt-1.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="font-bold text-emerald-950">
                      {formatDate(t.scheduled_at, true)}
                    </div>
                    <div className="flex items-center gap-1">
                      {isFuture && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">قادم</span>}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ltr-numbers">{t.duration_min} د</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.categories?.name ?? "بدون تصنيف"}
                    {t.location && <> · 📍 {t.location}</>}
                  </div>
                  <div className="flex gap-3 mt-2 no-print">
                    <Link href={`/academy/${academyId}/attendance?training=${t.id}`} className="text-emerald-700 text-xs font-semibold hover:underline">حضور</Link>
                    <Link href={`/academy/${academyId}/trainings?edit=${t.id}`} className="text-amber-600 text-xs font-semibold hover:underline">تعديل</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function CsvImporter({ academyId, categories }: { academyId: string; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  function downloadTemplate() {
    const sampleCat = categories[0]?.name ?? "براعم 2014";
    const today = new Date();
    const next1 = new Date(today.getTime() + 86400000);
    const next2 = new Date(today.getTime() + 3 * 86400000);
    const fmt = (d: Date) => `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, "0")}:00`;

    const csv = [
      "category_name,scheduled_at,duration_min,location",
      `${sampleCat},${fmt(next1)},90,ملعب الأكاديمية`,
      `${sampleCat},${fmt(next2)},90,ملعب الأكاديمية`,
      `,${fmt(new Date(today.getTime() + 5 * 86400000))},75,صالة مغطاة`,
    ].join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trainings-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    // Parse CSV (simple: assume no embedded commas/quotes).
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { alert("الملف فارغ"); return; }
    const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
    const idx = {
      category_name: header.indexOf("category_name"),
      scheduled_at: header.indexOf("scheduled_at"),
      duration_min: header.indexOf("duration_min"),
      location: header.indexOf("location"),
    };
    if (idx.scheduled_at === -1) {
      alert("العمود scheduled_at مطلوب في الملف");
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      return {
        category_name: idx.category_name >= 0 ? cells[idx.category_name] : "",
        scheduled_at: cells[idx.scheduled_at],
        duration_min: idx.duration_min >= 0 ? cells[idx.duration_min] : "90",
        location: idx.location >= 0 ? cells[idx.location] : "",
      };
    });

    startTransition(async () => {
      const res = await importTrainingsCsv(academyId, rows);
      setResult(res);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => { setOpen(true); setResult(null); }}>
        📥 استيراد CSV
      </Button>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white border-2 border-emerald-300 rounded-lg shadow-xl p-4 z-20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">استيراد جدول التدريبات من CSV</h4>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        الأعمدة: <code dir="ltr">category_name, scheduled_at, duration_min, location</code>.
        التاريخ بصيغة <code dir="ltr">YYYY-MM-DD HH:MM</code>.
      </p>
      <div className="space-y-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
          ⬇ تحميل قالب CSV
        </Button>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">اختر ملف CSV:</span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm"
          />
        </label>
        {pending && <p className="text-sm text-muted-foreground">جارٍ المعالجة...</p>}
        {result && (
          <div className={`text-sm rounded-md p-2 ${result.inserted > 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <p>✅ تم استيراد <strong>{result.inserted}</strong> تدريب</p>
            {result.errors.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-red-600">{result.errors.length} خطأ</summary>
                <ul className="text-[10px] mt-1 max-h-32 overflow-y-auto list-disc list-inside">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
