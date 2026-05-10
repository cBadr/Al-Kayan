"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAcademyManager } from "@/lib/auth/rbac";

/**
 * Find the auth user id matching the given email (case-insensitive). Used when
 * approving a join request so we can link the player record to the account
 * the applicant created during self-registration.
 */
async function findAuthUserByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const target = email.trim().toLowerCase();
  // Supabase admin doesn't expose a direct "lookup by email" endpoint — page
  // through users until we find a match. With a small academy this is cheap.
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u: any) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function approveRequest(academyId: string, requestId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const categoryId = String(fd.get("category_id") ?? "");
  if (!categoryId) return { error: "اختر تصنيفاً" };
  const sb = await createClient();
  const admin = createAdminClient();

  const { data: req } = await sb.from("join_requests").select("*").eq("id", requestId).eq("academy_id", academyId).maybeSingle();
  if (!req) return { error: "الطلب غير موجود" };

  // If the applicant signed up with email/password during /join, find their auth user.
  let userId: string | null = null;
  if (req.email) {
    userId = await findAuthUserByEmail(req.email);
  }

  const { data: player, error: insErr } = await sb.from("players").insert({
    academy_id: academyId,
    user_id: userId,
    full_name: req.full_name,
    category_id: categoryId,
    birth_date: req.birth_date,
    phone: req.phone,
    email: req.email,
    national_id: req.national_id,
    guardian_name: req.guardian_name,
    guardian_phone: req.guardian_phone,
    photo_url: req.photo_url,
    id_doc_url: req.id_doc_url,
  }).select("id").single();
  if (insErr) return { error: insErr.message };

  // Grant the player membership so they can log in and see academy data.
  if (userId) {
    await admin.from("memberships").upsert(
      { user_id: userId, academy_id: academyId, role: "player" },
      { onConflict: "user_id,academy_id,role" },
    );
  }

  // Materialize custom-field values from the join_request into player_custom_values
  const customValues = (req.custom_values ?? {}) as Record<string, string | null>;
  if (Object.keys(customValues).length > 0) {
    const { data: defs } = await sb.from("custom_field_definitions")
      .select("id, field_key")
      .eq("academy_id", academyId);
    const defByKey = new Map((defs ?? []).map((d: any) => [d.field_key, d.id]));
    const rows = Object.entries(customValues)
      .filter(([key, val]) => val != null && defByKey.has(key))
      .map(([key, val]) => ({
        player_id: player!.id,
        field_definition_id: defByKey.get(key)!,
        value: val,
      }));
    if (rows.length > 0) {
      await sb.from("player_custom_values").upsert(rows, { onConflict: "player_id,field_definition_id" });
    }
  }

  await sb.from("join_requests").update({
    status: "approved",
    reviewed_by: me.id,
    reviewed_at: new Date().toISOString(),
    created_player_id: player!.id,
  }).eq("id", requestId);

  revalidatePath(`/academy/${academyId}/join-requests`);
  revalidatePath(`/academy/${academyId}/players`);
}

export async function rejectRequest(academyId: string, requestId: string) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("join_requests").update({
    status: "rejected",
    reviewed_by: me.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", requestId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/join-requests`);
}
