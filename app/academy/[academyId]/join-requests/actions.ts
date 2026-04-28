"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

export async function approveRequest(academyId: string, requestId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const categoryId = String(fd.get("category_id") ?? "");
  if (!categoryId) return { error: "اختر تصنيفاً" };
  const sb = await createClient();
  const { data: req } = await sb.from("join_requests").select("*").eq("id", requestId).eq("academy_id", academyId).maybeSingle();
  if (!req) return { error: "الطلب غير موجود" };

  const { data: player, error: insErr } = await sb.from("players").insert({
    academy_id: academyId,
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
