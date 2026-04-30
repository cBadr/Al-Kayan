"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Player = {
  id: string;
  code: string;
  full_name: string;
  position: string | null;
  categories: { name: string } | null;
};

export function CompareSelector({
  players,
  initialIds,
  academyId,
}: {
  players: Player[];
  initialIds: string[];
  academyId: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }, [players, search]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const compareHref = `/academy/${academyId}/reports/compare?ids=${[...selected].join(",")}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input
          placeholder="بحث بالاسم أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48"
        />
        <span className="text-sm text-muted-foreground">
          المختار: <strong className="text-emerald-700">{selected.size}</strong>
        </span>
        <Button asChild disabled={selected.size < 2}>
          <Link href={compareHref}>
            عرض المقارنة ({selected.size})
          </Link>
        </Button>
        {selected.size > 0 && (
          <Button variant="ghost" onClick={() => setSelected(new Set())}>
            مسح الاختيار
          </Button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto border border-border rounded-md bg-white">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">لا توجد نتائج</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <li key={p.id}>
                  <label className={`flex items-center gap-3 p-2.5 cursor-pointer ${
                    isSelected ? "bg-emerald-50/60" : "hover:bg-muted/30"
                  }`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(p.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-mono text-xs text-muted-foreground ltr-numbers">{p.code}</span>
                    <span className="flex-1 font-medium truncate">{p.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.categories?.name ?? "—"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
