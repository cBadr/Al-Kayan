"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

const profileSchema = z.object({
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  guardian_name: z.string().optional().or(z.literal("")),
  guardian_phone: z.string().optional().or(z.literal("")),
});

/** Player updates a limited set of their own fields. Coaches/managers cannot
 *  edit player records via this action — that's `updatePlayer` on the academy
 *  page. Identification fields (name, code, national_id, category) stay
 *  read-only from the player's side. */
export async function updateMyProfile(playerId: string, fd: FormData) {
  const me = await requireUser();
  const sb = await createClient();
  // Ensure caller actually owns this player record.
  const { data: p } = await sb.from("players").select("id, academy_id").eq("id", playerId).eq("user_id", me.id).maybeSingle();
  if (!p) return { error: "غير مصرح" };

  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const update: any = {
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    guardian_name: parsed.data.guardian_name || null,
    guardian_phone: parsed.data.guardian_phone || null,
  };

  const newPhoto = await uploadIfPresent("join-docs", fd, "photo", `${p.academy_id}/players`);
  if (newPhoto) update.photo_url = newPhoto;

  const { error } = await sb.from("players").update(update).eq("id", playerId).eq("user_id", me.id);
  if (error) return { error: error.message };

  // Mirror full_name + phone to profiles row for nicer display in academy lists.
  if (parsed.data.phone) {
    await sb.from("profiles").update({ phone: parsed.data.phone }).eq("id", me.id);
  }

  revalidatePath("/me");
  return { ok: true };
}

const passwordSchema = z.object({
  password: z.string().min(8),
});

export async function changeMyPassword(fd: FormData) {
  await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" };
  const sb = await createClient();
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { ok: true };
}
