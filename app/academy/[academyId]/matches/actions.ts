"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";

export async function createMatch(academyId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("matches").insert({
    academy_id: academyId,
    opponent: String(fd.get("opponent")),
    venue: String(fd.get("venue") ?? "") || null,
    match_date: new Date(String(fd.get("match_date"))).toISOString(),
    our_score: fd.get("our_score") ? Number(fd.get("our_score")) : null,
    their_score: fd.get("their_score") ? Number(fd.get("their_score")) : null,
    duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : 90,
    notes: String(fd.get("notes") ?? "") || null,
  });
  revalidatePath(`/academy/${academyId}/matches`);
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
