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

  // Login credentials are required so the player can sign in immediately.
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email) return { error: "البريد الإلكتروني مطلوب لإنشاء حساب الدخول" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" };

  const photoPath = await uploadPhoto(academyId, fd, "photo");

  const sb = await createClient();
  const { data, error } = await sb.from("players").insert({
    academy_id: academyId,
    full_name: parsed.data.full_name,
    category_id: parsed.data.category_id || null,
    birth_date: parsed.data.birth_date || null,
    phone: parsed.data.phone || null,
    email,
    national_id: parsed.data.national_id || null,
    guardian_name: parsed.data.guardian_name || null,
    guardian_phone: parsed.data.guardian_phone || null,
    position: parsed.data.position || null,
    preferred_jersey: parsed.data.preferred_jersey || null,
    photo_url: photoPath,
  }).select("id").single();

  if (error) return { error: error.message };

  // Provision login account + link it. Reuses the idempotent invitePlayer flow
  // which handles "email already exists" gracefully (resets password instead).
  const inviteRes = await invitePlayer(academyId, data!.id, email, password);
  if (inviteRes.error) {
    // Player record exists but login provisioning failed — surface a clear error
    // to the admin without rolling back the player (they can retry from edit).
    return { error: `تم إنشاء اللاعب لكن تعذَّر إنشاء حساب الدخول: ${inviteRes.error}` };
  }

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

/**
 * Set up (or reset) login credentials for an existing player. Idempotent:
 * - If the email already has an auth account, we update its password and link it.
 * - Otherwise we create a new auth account.
 * In either case we ensure a `player` membership exists so the player can read
 * their academy's data via RLS.
 */
export async function invitePlayer(
  academyId: string,
  playerId: string,
  email: string,
  password: string,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: "البريد الإلكتروني مطلوب" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" };

  const admin = createAdminClient();

  let userId: string | null = null;
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const hit = data.users.find((u: any) => (u.email ?? "").toLowerCase() === trimmedEmail);
    if (hit) { userId = hit.id; break; }
    if (data.users.length < 200) break;
  }

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });
    if (error || !data?.user) return { error: error?.message ?? "تعذَّر إنشاء الحساب" };
    userId = data.user.id;
  }

  await admin.from("players")
    .update({ user_id: userId, email: trimmedEmail })
    .eq("id", playerId)
    .eq("academy_id", academyId);

  await admin.from("memberships").upsert(
    { user_id: userId, academy_id: academyId, role: "player" },
    { onConflict: "user_id,academy_id,role" },
  );

  const { data: p } = await admin.from("players").select("full_name").eq("id", playerId).maybeSingle();
  if (p?.full_name) {
    await admin.from("profiles").upsert({ id: userId, full_name: p.full_name });
  }

  revalidatePath(`/academy/${academyId}/players/${playerId}`);
  return { ok: true };
}

export async function reactivatePlayer(academyId: string, playerId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
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
