"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setAttendance, overrideLock } from "./actions";

type Status = "present" | "absent" | "late";

interface PlayerLite { id: string; code: string; full_name: string }
interface ExistingRow { player_id: string; status: Status; locked_at: string }

export function AttendanceGrid({
  academyId, trainingId, players, existing, isManager,
}: {
  academyId: string;
  trainingId: string;
  players: PlayerLite[];
  existing: ExistingRow[];
  isManager: boolean;
}) {
  const map = new Map(existing.map((e) => [e.player_id, e]));
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const isLocked = (e?: ExistingRow) => {
    if (!e) return false;
    return new Date(e.locked_at).getTime() < Date.now() && !isManager;
  };

  function pick(playerId: string, status: Status) {
    setBusy(playerId);
    startTransition(async () => {
      await setAttendance(academyId, trainingId, playerId, status);
      setBusy(null);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          اضغط على حالة لكل لاعب. ينقفل التعديل بعد انتهاء النافذة الزمنية المحددة في إعدادات الأكاديمية.
          {isManager && " (لديك صلاحية فتح القفل)"}
        </p>
        <ul className="divide-y divide-border">
          {players.map((p) => {
            const cur = map.get(p.id);
            const locked = isLocked(cur);
            const minutesLeft = cur ? Math.max(0, Math.round((new Date(cur.locked_at).getTime() - Date.now()) / 60000)) : null;
            return (
              <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground ltr-numbers">{p.code}</span>
                  <span className="font-medium truncate">{p.full_name}</span>
                  {cur && (
                    <Badge variant={cur.status === "present" ? "success" : cur.status === "late" ? "warning" : "destructive"}>
                      {cur.status === "present" ? "حاضر" : cur.status === "late" ? "متأخر" : "غائب"}
                    </Badge>
                  )}
                  {cur && minutesLeft !== null && minutesLeft > 0 && (
                    <span className="text-xs text-muted-foreground">قابل للتعديل: {minutesLeft}د</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Btn label="حاضر" tone="success" disabled={locked || (busy === p.id && pending)} active={cur?.status === "present"}
                       onClick={() => pick(p.id, "present")} />
                  <Btn label="متأخر" tone="warning" disabled={locked || (busy === p.id && pending)} active={cur?.status === "late"}
                       onClick={() => pick(p.id, "late")} />
                  <Btn label="غائب" tone="destructive" disabled={locked || (busy === p.id && pending)} active={cur?.status === "absent"}
                       onClick={() => pick(p.id, "absent")} />
                  {locked && isManager && (
                    <form action={async () => { await overrideLock(academyId, trainingId, p.id); }}>
                      <Button type="submit" size="sm" variant="outline">فتح القفل</Button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
          {players.length === 0 && <li className="py-6 text-center text-muted-foreground">لا يوجد لاعبون في هذا التصنيف</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

function Btn({ label, tone, active, onClick, disabled }: {
  label: string; tone: "success" | "warning" | "destructive"; active?: boolean; onClick: () => void; disabled?: boolean;
}) {
  const base = "h-9 px-3 text-xs rounded-md border font-medium transition-colors disabled:opacity-50";
  const styles = active
    ? tone === "success"
      ? "bg-success text-white border-success"
      : tone === "warning"
      ? "bg-warning text-white border-warning"
      : "bg-destructive text-white border-destructive"
    : tone === "success"
    ? "border-success text-success hover:bg-success/10"
    : tone === "warning"
    ? "border-warning text-warning hover:bg-warning/10"
    : "border-destructive text-destructive hover:bg-destructive/10";
  return <button type="button" className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>{label}</button>;
}
