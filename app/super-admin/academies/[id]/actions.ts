"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/rbac";

const assignSchema = z.object({
  email: z.string().email(),
  role: z.enum(["academy_manager", "coach"]),
});

export async function assignManagerByEmail(academyId: string, formData: FormData) {
  await requireSuperAdmin();
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "بيانات غير صالحة" };

  const admin = createAdminClient();
  // Look up user by email; if not found, invite.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users.find((u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) {
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
    if (error) return { error: error.message };
    user = invited.user!;
  }

  const { error: mErr } = await admin.from("memberships").insert({
    user_id: user.id,
    academy_id: academyId,
    role: parsed.data.role,
  });
  if (mErr && !mErr.message.includes("duplicate")) return { error: mErr.message };

  revalidatePath(`/super-admin/academies/${academyId}`);
  return { ok: true };
}

export async function removeManager(membershipId: string, academyId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  await admin.from("memberships").delete().eq("id", membershipId);
  revalidatePath(`/super-admin/academies/${academyId}`);
}
