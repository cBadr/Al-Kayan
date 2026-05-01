"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { bulkDeletePlayers, bulkUpdateStatus, bulkUpdateCategory } from "./actions";

type Player = {
  id: string;
  code: string;
  full_name: string;
  phone: string | null;
  status: string;
  photo_url: string | null;
  categories: { name: string } | null;
};
type Category = { id: string; name: string };

export function PlayersTable({
  academyId,
  players,
  photoMap,
  categories,
  isManager,
}: {
  academyId: string;
  players: Player[];
  photoMap: Record<string, string>;
  categories: Category[];
  isManager: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const allChecked = players.length > 0 && players.every((p) => selected.has(p.id));
  const someChecked = !allChecked && players.some((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allChecked) return new Set();
      return new Set(players.map((p) => p.id));
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

  function bulkAction(label: string, fn: () => Promise<{ count: number; error?: string }>) {
    if (selected.size === 0) return;
    if (!confirm(`${label} (${selected.size} لاعب)؟`)) return;
    startTransition(async () => {
      setMsg(null);
      const res = await fn();
      if (res.error) setMsg(`خطأ: ${res.error}`);
      else {
        setMsg(`✅ تم: ${res.count} لاعب`);
        setSelected(new Set());
      }
    });
  }

  return (
    <div>
      {isManager && (
        <div
          className={`flex flex-wrap items-center gap-2 mb-3 px-3 py-2 rounded-lg border transition-colors no-print ${
            selected.size > 0 ? "border-emerald-300 bg-emerald-50" : "border-border bg-muted/20"
          }`}
        >
          <span className="text-sm font-semibold">
            المختار: <strong className="text-emerald-700 ltr-numbers">{selected.size}</strong>
          </span>
          {selected.size > 0 && (
            <>
              <span className="mx-2 text-muted-foreground">|</span>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => bulkAction("تفعيل", () => bulkUpdateStatus(academyId, [...selected], "active"))}
              >
                ✅ تفعيل
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => bulkAction("إيقاف", () => bulkUpdateStatus(academyId, [...selected], "suspended"))}
              >
                🚫 إيقاف
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => bulkAction("أرشفة", () => bulkUpdateStatus(academyId, [...selected], "archived"))}
              >
                📦 أرشفة
              </Button>
              <select
                disabled={pending}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm"
                onChange={(e) => {
                  if (!e.target.value) return;
                  const v = e.target.value === "__none__" ? null : e.target.value;
                  bulkAction("نقل التصنيف", () => bulkUpdateCategory(academyId, [...selected], v));
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="">📋 نقل لتصنيف...</option>
                <option value="__none__">— بدون تصنيف —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`حذف ${selected.size} لاعب نهائياً؟ لا يمكن التراجع.`)) return;
                  startTransition(async () => {
                    setMsg(null);
                    const res = await bulkDeletePlayers(academyId, [...selected]);
                    if (res.error) setMsg(`خطأ: ${res.error}`);
                    else { setMsg(`🗑 تم حذف ${res.count} لاعب`); setSelected(new Set()); }
                  });
                }}
              >
                🗑 حذف
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                إلغاء التحديد
              </Button>
            </>
          )}
          {msg && <span className={`text-xs ms-auto ${msg.startsWith("خطأ") ? "text-red-600" : "text-emerald-700"}`}>{msg}</span>}
        </div>
      )}

      <Table>
        <THead>
          <Tr>
            {isManager && (
              <Th className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  className="w-4 h-4"
                />
              </Th>
            )}
            <Th>الصورة</Th>
            <Th>الكود</Th>
            <Th>الاسم</Th>
            <Th>التصنيف</Th>
            <Th>الهاتف</Th>
            <Th>الحالة</Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {players.map((p) => {
            const photo = p.photo_url ? photoMap[p.photo_url] : null;
            const isSelected = selected.has(p.id);
            return (
              <Tr key={p.id} className={isSelected ? "bg-emerald-50/40" : ""}>
                {isManager && (
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(p.id)}
                      className="w-4 h-4"
                    />
                  </Td>
                )}
                <Td>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                  )}
                </Td>
                <Td className="font-mono ltr-numbers">{p.code}</Td>
                <Td className="font-medium">{p.full_name}</Td>
                <Td>{p.categories?.name ?? "—"}</Td>
                <Td dir="ltr">{p.phone ?? "—"}</Td>
                <Td>
                  <Badge variant={p.status === "active" ? "success" : p.status === "suspended" ? "warning" : "muted"}>
                    {p.status === "active" ? "نشط" : p.status === "suspended" ? "موقوف" : "مؤرشف"}
                  </Badge>
                </Td>
                <Td className="text-left no-print">
                  <div className="flex gap-3 justify-end">
                    <Link href={`/academy/${academyId}/players/${p.id}`} className="text-emerald-700 text-sm hover:underline">عرض</Link>
                    {isManager && (
                      <Link href={`/academy/${academyId}/players/${p.id}/edit`} className="text-amber-600 text-sm hover:underline">تعديل</Link>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
          {players.length === 0 && (
            <Tr><Td colSpan={isManager ? 8 : 7} className="text-center text-muted-foreground py-10">لا يوجد لاعبون مطابقون</Td></Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
