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

  const photoPath = await uploadIfPresent(admin, academyId, fd, "photo");
  const idDocPath = await uploadIfPresent(admin, academyId, fd, "id_doc");

  const data = {
    academy_id: academyId,
    full_name: String(fd.get("full_name") ?? "").trim(),
    birth_date: (fd.get("birth_date") as string) || null,
    phone: (fd.get("phone") as string) || null,
    email: (fd.get("email") as string) || null,
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
