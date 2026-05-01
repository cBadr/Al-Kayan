"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAcademyManager } from "@/lib/auth/rbac";

const playerSchema = z.object({
  full_name: z.string().min(2),
  category_id: z.string().uuid().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  national_id: z.string().optional().or(z.literal("")),
  guardian_name: z.string().optional().or(z.literal("")),
  guardian_phone: z.string().optional().or(z.literal("")),
  position: z.enum(["GK", "DF", "MF", "FW"]).optional().or(z.literal("")),
  preferred_jersey: z.coerce.number().int().min(1).max(99).optional().or(z.literal("")),
});

async function uploadPhoto(academyId: string, fd: FormData, key: string) {
  const f = fd.get(key) as File | null;
  if (!f || typeof f === "string" || f.size === 0) return null;
  const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${academyId}/players/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("join-docs").upload(path, f, {
    contentType: f.type || "image/jpeg",
    upsert: false,
  });
  if (error) return null;
  return path;
}

export async function createPlayer(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const parsed = playerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const photoPath = await uploadPhoto(academyId, fd, "photo");

  const sb = await createClient();
  const { data, error } = await sb.from("players").insert({
    academy_id: academyId,
    full_name: parsed.data.full_name,
    category_id: parsed.data.category_id || null,
    birth_date: parsed.data.birth_date || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    national_id: parsed.data.national_id || null,
    guardian_name: parsed.data.guardian_name || null,
    guardian_phone: parsed.data.guardian_phone || null,
    position: parsed.data.position || null,
    preferred_jersey: parsed.data.preferred_jersey || null,
    photo_url: photoPath,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/players`);
  redirect(`/academy/${academyId}/players/${data!.id}`);
}

export async function updatePlayer(academyId: string, playerId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const parsed = playerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const sb = await createClient();
  const update: any = {
    full_name: parsed.data.full_name,
    category_id: parsed.data.category_id || null,
    birth_date: parsed.data.birth_date || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    national_id: parsed.data.national_id || null,
    guardian_name: parsed.data.guardian_name || null,
    guardian_phone: parsed.data.guardian_phone || null,
    position: parsed.data.position || null,
    preferred_jersey: parsed.data.preferred_jersey || null,
    status: (fd.get("status") as string) || undefined,
  };

  const newPhoto = await uploadPhoto(academyId, fd, "photo");
  if (newPhoto) update.photo_url = newPhoto;

  await sb.from("players").update(update).eq("id", playerId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/players`);
  revalidatePath(`/academy/${academyId}/players/${playerId}`);
}

export async function deletePlayer(academyId: string, playerId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { error } = await sb.from("players").delete().eq("id", playerId).eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/players`);
  redirect(`/academy/${academyId}/players`);
}

export async function updatePlayerStatus(academyId: string, playerId: string, status: "active" | "suspended" | "archived") {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("players").update({ status }).eq("id", playerId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/players/${playerId}`);
}

/**
 * Reactivate a player whose status is "suspended" (e.g. by 3-yellow-card auto-rule).
 * Resets the yellow-card cycle so future yellows count from now.
 */
export async function bulkUpdateStatus(
  academyId: string,
  playerIds: string[],
  status: "active" | "suspended" | "archived",
): Promise<{ count: number; error?: string }> {
  await requireAcademyManager(academyId);
  if (playerIds.length === 0) return { count: 0 };
  const sb = await createClient();
  const { error } = await sb.from("players")
    .update({ status })
    .in("id", playerIds)
    .eq("academy_id", academyId);
  if (error) return { count: 0, error: error.message };
  revalidatePath(`/academy/${academyId}/players`);
  return { count: playerIds.length };
}

export async function bulkUpdateCategory(
  academyId: string,
  playerIds: string[],
  categoryId: string | null,
): Promise<{ count: number; error?: string }> {
  await requireAcademyManager(academyId);
  if (playerIds.length === 0) return { count: 0 };
  const sb = await createClient();
  const { error } = await sb.from("players")
    .update({ category_id: categoryId })
    .in("id", playerIds)
    .eq("academy_id", academyId);
  if (error) return { count: 0, error: error.message };
  revalidatePath(`/academy/${academyId}/players`);
  return { count: playerIds.length };
}

export async function bulkDeletePlayers(
  academyId: string,
  playerIds: string[],
): Promise<{ count: number; error?: string }> {
  await requireAcademyManager(academyId);
  if (playerIds.length === 0) return { count: 0 };
  const sb = await createClient();
  const { error } = await sb.from("players")
    .delete()
    .in("id", playerIds)
    .eq("academy_id", academyId);
  if (error) return { count: 0, error: error.message };
  revalidatePath(`/academy/${academyId}/players`);
  return { count: playerIds.length };
}

export async function reactivatePlayer(academyId: string, playerId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  // Use the SQL helper function defined in migration 0007 (security definer).
  const { error } = await sb.rpc("reactivate_player", { p_player: playerId });
  if (error) {
    // Fallback: do it manually if rpc missing for any reason.
    await sb.from("players").update({
      status: "active",
      suspension_reason: null,
      yellow_cycle_reset_at: new Date().toISOString(),
    }).eq("id", playerId).eq("academy_id", academyId);
  }
  revalidatePath(`/academy/${academyId}/players/${playerId}`);
  revalidatePath(`/academy/${academyId}/players`);
  revalidatePath(`/academy/${academyId}/reports`);
}
