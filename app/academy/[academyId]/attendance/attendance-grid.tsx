"use client";

import { useState, useTransition, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { setAttendance, clearAttendance, overrideLock, markAllPresent } from "./actions";

type Status = "present" | "absent" | "late" | "excused";

interface PlayerLite {
  id: string;
  code: string;
  full_name: string;
  notes?: string | null;
  photo_url?: string | null;
}
interface ExistingRow { player_id: string; status: Status; locked_at: string }

const LABELS: Record<Status, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

// Buttons render right-to-left as in screenshot: حاضر | غائب | متأخر | بعذر
const ORDER: Status[] = ["present", "absent", "late", "excused"];

const STATUS_TONE: Record<Status, { bg: string; text: string; ring: string }> = {
  present:  { bg: "bg-emerald-600",  text: "text-white",        ring: "ring-emerald-500/60" },
  absent:   { bg: "bg-red-600",      text: "text-white",        ring: "ring-red-500/60" },
  late:     { bg: "bg-amber-500",    text: "text-white",        ring: "ring-amber-400/60" },
  excused:  { bg: "bg-sky-600",      text: "text-white",        ring: "ring-sky-500/60" },
};

export function AttendanceGrid({
  academyId, trainingId, players, existing, isManager,
}: {
  academyId: string;
  trainingId: string;
  players: PlayerLite[];
  existing: ExistingRow[];
  isManager: boolean;
}) {
  // Local state for optimistic updates
  const [state, setState] = useState<Record<string, ExistingRow | undefined>>(() => {
    const m: Record<string, ExistingRow | undefined> = {};
    for (const e of existing) m[e.player_id] = e;
    return m;
  });
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unmarked" | "present" | "absent" | "late" | "excused">("all");

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !p.full_name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
      if (filter !== "all") {
        const cur = state[p.id];
        if (filter === "unmarked") return !cur;
        if (!cur || cur.status !== filter) return false;
      }
      return true;
    });
  }, [players, search, filter, state]);

  const isLocked = (e?: ExistingRow) => {
    if (!e) return false;
    return new Date(e.locked_at).getTime() < Date.now() && !isManager;
  };

  function pick(playerId: string, status: Status) {
    const cur = state[playerId];
    // Toggle off if same status clicked
    if (cur?.status === status) return clearStatus(playerId);

    // Optimistic
    setState((s) => ({
      ...s,
      [playerId]: {
        player_id: playerId,
        status,
        locked_at: cur?.locked_at ?? new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      },
    }));
    setBusy((b) => new Set(b).add(playerId));
    startTransition(async () => {
      const res = await setAttendance(academyId, trainingId, playerId, status);
      if (res && "error" in res && res.error) {
        // Revert
        setState((s) => ({ ...s, [playerId]: cur }));
        alert(res.error);
      }
      setBusy((b) => { const n = new Set(b); n.delete(playerId); return n; });
    });
  }

  function clearStatus(playerId: string) {
    const cur = state[playerId];
    setState((s) => ({ ...s, [playerId]: undefined }));
    setBusy((b) => new Set(b).add(playerId));
    startTransition(async () => {
      const res = await clearAttendance(academyId, trainingId, playerId);
      if (res && "error" in res && res.error) {
        setState((s) => ({ ...s, [playerId]: cur }));
        alert(res.error);
      }
      setBusy((b) => { const n = new Set(b); n.delete(playerId); return n; });
    });
  }

  function presentAll() {
    if (!confirm("تسجيل جميع اللاعبين غير المُعلَّمين كـ \"حاضر\"؟")) return;
    const unmarked = players.filter((p) => !state[p.id]).map((p) => p.id);
    if (unmarked.length === 0) return;
    // Optimistic
    setState((s) => {
      const next = { ...s };
      const lockAt = new Date(Date.now() + 25 * 60 * 1000).toISOString();
      for (const id of unmarked) next[id] = { player_id: id, status: "present", locked_at: lockAt };
      return next;
    });
    startTransition(async () => {
      await markAllPresent(academyId, trainingId, unmarked);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <Input
          placeholder="🔎 بحث بالاسم أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="all">عرض الكل</option>
          <option value="unmarked">غير مُسجَّل</option>
          <option value="present">حاضر</option>
          <option value="absent">غائب</option>
          <option value="late">متأخر</option>
          <option value="excused">بعذر</option>
        </select>
        <button
          type="button"
          onClick={presentAll}
          disabled={pending}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-2 rounded-md border border-emerald-700/30 bg-white hover:bg-emerald-50"
        >
          ✅ تحضير الجميع
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        اضغط على حالة لتسجيلها فوراً. اضغط مرة أخرى لإلغائها · ({visiblePlayers.length}/{players.length} ظاهر)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {visiblePlayers.map((p, idx) => {
          const cur = state[p.id];
          const locked = isLocked(cur);
          const isBusy = busy.has(p.id);
          const minutesLeft = cur ? Math.max(0, Math.round((new Date(cur.locked_at).getTime() - Date.now()) / 60000)) : null;

          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-white p-3 transition-shadow ${
                cur ? "border-emerald-200 shadow-sm" : "border-border"
              } ${isBusy ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-gold-400 text-emerald-950 font-black flex items-center justify-center text-sm ltr-numbers">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="font-bold text-emerald-950 truncate">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.notes || `كود: ${p.code}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {ORDER.map((s) => {
                  const active = cur?.status === s;
                  const tone = STATUS_TONE[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pick(p.id, s)}
                      disabled={locked || isBusy}
                      aria-pressed={active}
                      className={[
                        "h-10 rounded-lg text-xs font-bold transition-all",
                        "flex items-center justify-center gap-1",
                        active
                          ? `${tone.bg} ${tone.text} shadow-sm`
                          : "bg-muted/40 text-muted-foreground hover:bg-muted",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      ].join(" ")}
                    >
                      {LABELS[s]}
                    </button>
                  );
                })}
              </div>

              {cur && minutesLeft !== null && minutesLeft > 0 && !locked && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  قابل للتعديل: {minutesLeft}د
                </p>
              )}
              {locked && isManager && (
                <form action={async () => { await overrideLock(academyId, trainingId, p.id); }} className="mt-2">
                  <button type="submit" className="w-full text-xs text-emerald-700 hover:underline">
                    🔓 فتح القفل
                  </button>
                </form>
              )}
              {locked && !isManager && (
                <p className="text-[10px] text-red-600 mt-2 text-center">🔒 مقفل</p>
              )}
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">لا يوجد لاعبون في هذا التصنيف</div>
      )}
      {players.length > 0 && visiblePlayers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">لا توجد نتائج للفلتر الحالي</div>
      )}
    </div>
  );
}
