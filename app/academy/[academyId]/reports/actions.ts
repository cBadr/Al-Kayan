"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

/**
 * Re-applies the 3-yellow-card auto-suspension rule against all current
 * match_participations data for this academy. Useful when participations were
 * recorded before the trigger existed, or to recover from drift.
 *
 * Returns number of newly-suspended players.
 */
export async function recomputeSuspensions(academyId: string): Promise<{ suspended: number; error?: string }> {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data, error } = await sb.rpc("recompute_player_suspensions", { p_academy: academyId });
  if (error) return { suspended: 0, error: error.message };
  revalidatePath(`/academy/${academyId}/reports`);
  revalidatePath(`/academy/${academyId}/players`);
  return { suspended: (data ?? []).length };
}
