"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Player = { id: string; full_name: string; code: string };
type Category = { id: string; name: string };

export function NotificationComposer({
  action,
  categories,
  players,
}: {
  action: (fd: FormData) => Promise<void>;
  categories: Category[];
  players: Player[];
}) {
  const [audience, setAudience] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players.slice(0, 50);
    return players.filter((p) =>
      p.full_name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [players, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audience">المستهدفون</Label>
          <select
            id="audience"
            name="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="all">كل لاعبي الأكاديمية</option>
            <option value="players">لاعبون محددون (بالاسم)</option>
            <option value="expiring">اشتراك ينتهي قريباً</option>
            <option value="overdue">متأخر السداد</option>
            {categories.map((c) => (
              <option key={c.id} value={`category:${c.id}`}>تصنيف: {c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="channel">القناة</Label>
          <select id="channel" name="channel" className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
            <option value="in_app">داخل النظام</option>
            <option value="email">بريد إلكتروني</option>
            <option value="whatsapp">واتساب</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">العنوان</Label>
          <Input id="title" name="title" required />
        </div>
      </div>

      {audience === "expiring" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="expiring_days">خلال كم يوم؟</Label>
            <Input id="expiring_days" name="expiring_days" type="number" min={0} max={365} defaultValue={7} />
          </div>
        </div>
      )}

      {audience === "players" && (
        <div className="space-y-2 border border-border rounded-lg p-3">
          <Label>اختر اللاعبين</Label>
          <Input
            placeholder="ابحث بالاسم أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto border border-border rounded-md bg-white">
            {filteredPlayers.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">لا توجد نتائج</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredPlayers.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-2 hover:bg-emerald-50/40">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="text-sm">
                        <span className="font-medium">{p.full_name}</span>
                        <span className="text-muted-foreground ms-2">#{p.code}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-muted-foreground">المختار: {selected.size}</p>
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="player_ids" value={id} />
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="body">المحتوى</Label>
        <textarea id="body" name="body" rows={4} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
      </div>

      <Button type="submit" disabled={audience === "players" && selected.size === 0}>
        إرسال
      </Button>
    </form>
  );
}
