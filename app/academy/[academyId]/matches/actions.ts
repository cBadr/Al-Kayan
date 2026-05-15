"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";

export async function createMatch(academyId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { data, error } = await sb.from("matches").insert({
    academy_id: academyId,
    opponent: String(fd.get("opponent")),
    venue: String(fd.get("venue") ?? "") || null,
    match_date: new Date(String(fd.get("match_date"))).toISOString(),
    our_score: fd.get("our_score") ? Number(fd.get("our_score")) : null,
    their_score: fd.get("their_score") ? Number(fd.get("their_score")) : null,
    duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : 90,
    match_type: (fd.get("match_type") as "home" | "away") || "home",
    formation: String(fd.get("formation") ?? "") || null,
    referee_name: String(fd.get("referee_name") ?? "") || null,
    referee_phone: String(fd.get("referee_phone") ?? "") || null,
    assistant1_name: String(fd.get("assistant1_name") ?? "") || null,
    assistant1_phone: String(fd.get("assistant1_phone") ?? "") || null,
    assistant2_name: String(fd.get("assistant2_name") ?? "") || null,
    assistant2_phone: String(fd.get("assistant2_phone") ?? "") || null,
    observer_name: String(fd.get("observer_name") ?? "") || null,
    observer_phone: String(fd.get("observer_phone") ?? "") || null,
    max_starting: clampSquad(fd.get("max_starting"), 11, 1, 30),
    max_bench: clampSquad(fd.get("max_bench"), 9, 0, 30),
    notes: String(fd.get("notes") ?? "") || null,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/matches`);
  return { id: data?.id };
}

export async function updateMatch(academyId: string, matchId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const update: any = {};
  const fields = ["opponent","venue","formation","referee_name","referee_phone",
    "assistant1_name","assistant1_phone","assistant2_name","assistant2_phone",
    "observer_name","observer_phone","notes"];
  for (const k of fields) {
    const v = fd.get(k);
    if (v !== null) update[k] = String(v) || null;
  }
  if (fd.get("match_date")) update.match_date = new Date(String(fd.get("match_date"))).toISOString();
  if (fd.get("our_score") !== null && fd.get("our_score") !== "") update.our_score = Number(fd.get("our_score"));
  if (fd.get("their_score") !== null && fd.get("their_score") !== "") update.their_score = Number(fd.get("their_score"));
  if (fd.get("duration_min")) update.duration_min = Number(fd.get("duration_min"));
  if (fd.get("match_type")) update.match_type = String(fd.get("match_type"));
  if (fd.get("max_starting") != null && fd.get("max_starting") !== "") {
    update.max_starting = clampSquad(fd.get("max_starting"), 11, 1, 30);
  }
  if (fd.get("max_bench") != null && fd.get("max_bench") !== "") {
    update.max_bench = clampSquad(fd.get("max_bench"), 9, 0, 30);
  }
  await sb.from("matches").update(update).eq("id", matchId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/matches/${matchId}`);
}

export async function deleteMatch(academyId: string, matchId: string) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { error } = await sb.from("matches").delete().eq("id", matchId).eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/matches`);
}

export async function setLineup(
  academyId: string,
  matchId: string,
  starting: { player_id: string; pitch_position?: string | null; pitch_x?: number | null; pitch_y?: number | null; jersey_number?: number | null; is_captain?: boolean }[],
  bench: { player_id: string; jersey_number?: number | null }[],
) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  // Per-match caps: each match stores its own max_starting / max_bench so the
  // admin can run a 7-a-side game with 7 starters or a friendly with 30 squad
  // members. Hard ceiling 30 enforced via CHECK constraint in 0015 migration.
  const { data: matchRow } = await sb.from("matches")
    .select("max_starting, max_bench")
    .eq("id", matchId)
    .eq("academy_id", academyId)
    .maybeSingle();
  const maxStarting = (matchRow as any)?.max_starting ?? 11;
  const maxBench = (matchRow as any)?.max_bench ?? 9;
  if (starting.length > maxStarting) {
    return { error: `الفريق الأساسي ${maxStarting} لاعب كحد أقصى لهذه المباراة (يمكن تعديل العدد من إعدادات المباراة)` };
  }
  if (bench.length > maxBench) {
    return { error: `الفريق الاحتياطي ${maxBench} لاعب كحد أقصى لهذه المباراة (يمكن تعديل العدد من إعدادات المباراة)` };
  }

  // Fetch existing rows so we keep stats (goals/cards/minutes) and only update lineup fields
  const { data: existing } = await sb.from("match_participations")
    .select("id, player_id").eq("match_id", matchId);
  const existingMap = new Map((existing ?? []).map((r: any) => [r.player_id, r.id]));

  const startingIds = new Set(starting.map((s) => s.player_id));
  const benchIds = new Set(bench.map((b) => b.player_id));

  // Delete rows not in either list (only safe if their stats are zero)
  const removeIds: string[] = [];
  for (const r of (existing ?? []) as any[]) {
    if (!startingIds.has(r.player_id) && !benchIds.has(r.player_id)) {
      removeIds.push(r.id);
    }
  }
  if (removeIds.length > 0) {
    await sb.from("match_participations").delete().in("id", removeIds);
  }

  for (const s of starting) {
    const payload = {
      lineup_role: "starting" as const,
      pitch_position: (s.pitch_position as any) || null,
      pitch_x: s.pitch_x ?? null,
      pitch_y: s.pitch_y ?? null,
      jersey_number: s.jersey_number ?? null,
      is_captain: !!s.is_captain,
    };
    const id = existingMap.get(s.player_id);
    if (id) {
      await sb.from("match_participations").update(payload).eq("id", id);
    } else {
      await sb.from("match_participations").insert({ match_id: matchId, player_id: s.player_id, ...payload });
    }
  }

  for (const b of bench) {
    const payload = {
      lineup_role: "bench" as const,
      pitch_position: null,
      pitch_x: null,
      pitch_y: null,
      jersey_number: b.jersey_number ?? null,
      is_captain: false,
    };
    const id = existingMap.get(b.player_id);
    if (id) {
      await sb.from("match_participations").update(payload).eq("id", id);
    } else {
      await sb.from("match_participations").insert({ match_id: matchId, player_id: b.player_id, ...payload });
    }
  }

  revalidatePath(`/academy/${academyId}/matches/${matchId}`);
}

export async function setParticipation(academyId: string, matchId: string, playerId: string, fields: Partial<{
  goals: number; yellow_cards: number; red_cards: number; sent_off: boolean; notes: string; minutes_played: number;
}>) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { data: existing } = await sb.from("match_participations")
    .select("id").eq("match_id", matchId).eq("player_id", playerId).maybeSingle();
  if (existing) {
    await sb.from("match_participations").update(fields).eq("id", existing.id);
  } else {
    await sb.from("match_participations").insert({ match_id: matchId, player_id: playerId, ...fields });
  }
  revalidatePath(`/academy/${academyId}/matches/${matchId}`);
}

export async function removeParticipation(academyId: string, matchId: string, playerId: string) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("match_participations").delete().eq("match_id", matchId).eq("player_id", playerId);
  revalidatePath(`/academy/${academyId}/matches/${matchId}`);
}

/** Parse a form field as an integer squad size with sensible fallback + clamp. */
function clampSquad(raw: FormDataEntryValue | null, fallback: number, min: number, max: number): number {
  const n = raw != null && raw !== "" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function logInjury(academyId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("injuries").insert({
    player_id: String(fd.get("player_id")),
    source: String(fd.get("source")) as "match" | "training",
    source_match_id: (fd.get("match_id") as string) || null,
    source_training_id: (fd.get("training_id") as string) || null,
    injury_type: (fd.get("injury_type") as string) || null,
    body_location: (fd.get("body_location") as string) || null,
    expected_return_at: (fd.get("expected_return_at") as string) || null,
    notes: (fd.get("notes") as string) || null,
  });
  revalidatePath(`/academy/${academyId}`);
}
