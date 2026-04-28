"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";

/**
 * Bulk-create trainings: pick weekdays + time + duration + date range.
 * weekdays is 0..6 (Sun..Sat).
 */
export async function createTrainingBulk(academyId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const categoryId = String(fd.get("category_id") ?? "") || null;
  const time = String(fd.get("time") ?? "20:00");
  const durationMin = Number(fd.get("duration_min") ?? 90);
  const location = (fd.get("location") as string) || null;
  const fromStr = String(fd.get("from") ?? "");
  const toStr = String(fd.get("to") ?? "");
  const weekdays = fd.getAll("weekdays").map((w) => Number(w));

  if (!fromStr || !toStr || weekdays.length === 0) {
    return { error: "حدد التاريخين وأياماً واحداً على الأقل" };
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  const [hh, mm] = time.split(":").map(Number);

  const rows: Array<{ academy_id: string; category_id: string | null; scheduled_at: string; duration_min: number; location: string | null }> = [];
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
    if (weekdays.includes(d.getDay())) {
      const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh || 0, mm || 0);
      rows.push({
        academy_id: academyId,
        category_id: categoryId,
        scheduled_at: dt.toISOString(),
        duration_min: durationMin,
        location,
      });
    }
  }
  if (rows.length === 0) return { error: "لا تواريخ مطابقة للأيام المختارة" };
  await sb.from("trainings").insert(rows);
  revalidatePath(`/academy/${academyId}/trainings`);
}

export async function createSingleTraining(academyId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("trainings").insert({
    academy_id: academyId,
    category_id: (fd.get("category_id") as string) || null,
    scheduled_at: new Date(String(fd.get("scheduled_at"))).toISOString(),
    duration_min: Number(fd.get("duration_min") ?? 90),
    location: (fd.get("location") as string) || null,
  });
  revalidatePath(`/academy/${academyId}/trainings`);
}

export async function updateTraining(academyId: string, trainingId: string, fd: FormData) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("trainings").update({
    category_id: (fd.get("category_id") as string) || null,
    scheduled_at: new Date(String(fd.get("scheduled_at"))).toISOString(),
    duration_min: Number(fd.get("duration_min") ?? 90),
    location: (fd.get("location") as string) || null,
  }).eq("id", trainingId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/trainings`);
}

export async function deleteTraining(academyId: string, trainingId: string) {
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  await sb.from("trainings").delete().eq("id", trainingId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/trainings`);
}
