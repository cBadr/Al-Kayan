"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/rbac";

export async function adminSetPassword(userId: string, fd: FormData) {
  await requireSuperAdmin();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  revalidatePath("/super-admin/users");
  return { ok: true };
}

export async function adminSendPasswordReset(email: string) {
  await requireSuperAdmin();
  if (!email) return { error: "لا يوجد بريد إلكتروني" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
