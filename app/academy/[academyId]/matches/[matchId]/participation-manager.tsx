"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setParticipation, removeParticipation, logInjury } from "../actions";

interface PlayerLite { id: string; code: string; full_name: string; category_id: string | null; categories?: { name: string } | null }
interface Part { id: string; player_id: string; goals: number; yellow_cards: number; red_cards: number; sent_off: boolean; minutes_played: number; notes: string | null }

export function ParticipationManager({
  academyId, matchId, players, participations,
}: {
  academyId: string; matchId: string; players: PlayerLite[]; participations: Part[];
}) {
  const [filter, setFilter] = useState("");
  const partMap = new Map(participations.map((p) => [p.player_id, p]));
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => players.filter((p) =>
      !filter ||
      p.full_name.includes(filter) ||
      p.code.includes(filter) ||
      (p.categories?.name ?? "").includes(filter),
    ),
    [players, filter],
  );

  const update = (playerId: string, fields: Parameters<typeof setParticipation>[3]) => {
    setBusyId(playerId);
    startTransition(async () => {
      await setParticipation(academyId, matchId, playerId, fields);
      setBusyId(null);
    });
  };

  return (
    <div>
      <Input placeholder="بحث بالاسم/الكود/التصنيف..." value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4 max-w-md" />
      <div className="space-y-2">
        {filtered.map((p) => {
          const part = partMap.get(p.id);
          const isIn = !!part;
          return (
            <div key={p.id} className={`p-3 rounded-md border ${isIn ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isIn}
                    disabled={pending && busyId === p.id}
                    onChange={(e) => {
                      if (e.target.checked) update(p.id, { goals: 0 });
                      else {
                        setBusyId(p.id);
                        startTransition(async () => { await removeParticipation(academyId, matchId, p.id); setBusyId(null); });
                      }
                    }}
                  />
                  <span className="font-mono text-xs ltr-numbers">{p.code}</span>
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-xs text-muted-foreground">({p.categories?.name ?? "—"})</span>
                </div>
                {isIn && (
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <Stat label="أهداف" defaultValue={part!.goals} onCommit={(v) => update(p.id, { goals: v })} />
                    <Stat label="دقائق" defaultValue={part!.minutes_played ?? 0} onCommit={(v) => update(p.id, { minutes_played: v })} />
                    <Stat label="صفراء" defaultValue={part!.yellow_cards} onCommit={(v) => update(p.id, { yellow_cards: v })} />
                    <Stat label="حمراء" defaultValue={part!.red_cards} onCommit={(v) => update(p.id, { red_cards: v })} />
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={part!.sent_off} onChange={(e) => update(p.id, { sent_off: e.target.checked })} />
                      طُرد
                    </label>
                    <details className="relative">
                      <summary className="cursor-pointer text-warning">+ إصابة</summary>
                      <form
                        action={async (fd) => {
                          fd.append("player_id", p.id);
                          fd.append("source", "match");
                          fd.append("match_id", matchId);
                          await logInjury(academyId, fd);
                        }}
                        className="absolute z-10 left-0 mt-2 w-72 p-3 rounded-md bg-card border border-border shadow-lg space-y-2"
                      >
                        <Input name="injury_type" placeholder="نوع الإصابة" />
                        <Input name="body_location" placeholder="مكان الإصابة" />
                        <Input name="expected_return_at" type="date" />
                        <Input name="notes" placeholder="ملاحظات" />
                        <Button type="submit" size="sm" className="w-full">حفظ</Button>
                      </form>
                    </details>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-6">لا يوجد لاعبون</p>}
      </div>
    </div>
  );
}

function Stat({ label, defaultValue, onCommit }: { label: string; defaultValue: number; onCommit: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number" min="0" defaultValue={defaultValue}
        className="w-14 h-8 rounded border border-border px-2 text-center"
        onBlur={(e) => onCommit(Number(e.target.value || 0))}
      />
    </label>
  );
}
