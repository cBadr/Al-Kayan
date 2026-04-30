"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadIfPresent(admin: ReturnType<typeof createAdminClient>, academyId: string, fd: FormData, key: string) {
  const f = fd.get(key) as File | null;
  if (!f || typeof f === "string" || f.size === 0) return null;
  const ext = (f.name.split(".").pop() ?? "bin").toLowerCase();
  const path = `${academyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("join-docs").upload(path, f, {
    contentType: f.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return null;
  return path;
}

export async function submitJoinRequest(academyId: string, slug: string, fd: FormData) {
  const admin = createAdminClient();

  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const passwordConfirm = String(fd.get("password_confirm") ?? "");
  const fullName = String(fd.get("full_name") ?? "").trim();

  // Password validation: required for self-registration so the applicant can log in
  // once approved without depending on an admin manually setting a password.
  if (!email) return { error: "البريد الإلكتروني مطلوب لإنشاء الحساب" };
  if (!password || password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" };
  if (password !== passwordConfirm) return { error: "كلمتا المرور غير متطابقتين" };

  // Create the auth user up front (or look up existing). The actual `players` row
  // is created later when the manager approves the join_request.
  let userId: string | null = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created?.user) {
    userId = created.user.id;
  } else if (createErr && /registered|exists/i.test(createErr.message)) {
    // Email already registered — refuse rather than overwriting a stranger's password.
    return { error: "هذا البريد مسجَّل مسبقاً. سجِّل الدخول أو استخدم استعادة كلمة المرور." };
  } else if (createErr) {
    return { error: createErr.message };
  }

  if (userId) {
    await admin.from("profiles").upsert({ id: userId, full_name: fullName, phone: (fd.get("phone") as string) || null });
  }

  const photoPath = await uploadIfPresent(admin, academyId, fd, "photo");
  const idDocPath = await uploadIfPresent(admin, academyId, fd, "id_doc");

  const data = {
    academy_id: academyId,
    full_name: fullName,
    birth_date: (fd.get("birth_date") as string) || null,
    phone: (fd.get("phone") as string) || null,
    email,
    national_id: (fd.get("national_id") as string) || null,
    guardian_name: (fd.get("guardian_name") as string) || null,
    guardian_phone: (fd.get("guardian_phone") as string) || null,
    desired_category_id: (fd.get("desired_category_id") as string) || null,
    photo_url: photoPath,
    id_doc_url: idDocPath,
    status: "pending" as const,
  };

  const { error } = await admin.from("join_requests").insert(data);
  if (error) return { error: error.message };

  redirect(`/join/${slug}/thanks`);
}
