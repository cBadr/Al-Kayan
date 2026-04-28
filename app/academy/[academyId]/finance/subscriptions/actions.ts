"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

/**
 * For each active player, generate any missing forward subscription cycle.
 * Useful as a manual "refresh" if a trigger missed firing.
 */
export async function regenerateMissingCycles(academyId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: players } = await sb.from("players").select("id").eq("academy_id", academyId).eq("status", "active");
  for (const p of (players ?? []) as any[]) {
    // Calls the SQL helper which checks if a forward cycle exists and creates one if not
    await sb.rpc("ensure_player_subscription", { p_player: p.id, p_start: null });
  }
  revalidatePath(`/academy/${academyId}/finance/subscriptions`);
}

export async function recordPayment(academyId: string, subscriptionId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  const amount = Number(fd.get("amount") ?? 0);
  if (!(amount > 0)) return { error: "أدخل مبلغاً صحيحاً" };

  const { data: payment, error } = await sb.from("payments").insert({
    academy_id: academyId,
    subscription_id: subscriptionId,
    amount,
    method: (fd.get("method") as string) || null,
    notes: (fd.get("notes") as string) || null,
    recorded_by: me.id,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/finance/subscriptions/${subscriptionId}`);
  revalidatePath(`/academy/${academyId}/finance/subscriptions`);
  return { ok: true, paymentId: payment!.id };
}

export async function deleteSubscription(academyId: string, subscriptionId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("subscriptions").delete().eq("id", subscriptionId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/finance/subscriptions`);
}
