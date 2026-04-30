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

export async function deleteTrainings(academyId: string, ids: string[]) {
  await requireAcademyAccess(academyId);
  if (ids.length === 0) return { count: 0 };
  const sb = await createClient();
  const { error } = await sb.from("trainings")
    .delete()
    .in("id", ids)
    .eq("academy_id", academyId);
  if (error) return { error: error.message, count: 0 };
  revalidatePath(`/academy/${academyId}/trainings`);
  return { count: ids.length };
}

/**
 * Import trainings from a parsed CSV. Expected rows:
 * { category_name, scheduled_at, duration_min, location }
 * - category_name resolved by matching academy categories (case-insensitive)
 * - scheduled_at must be ISO-parseable (e.g. "2026-05-10 18:00")
 */
export async function importTrainingsCsv(
  academyId: string,
  rows: { category_name?: string; scheduled_at: string; duration_min?: number | string; location?: string }[],
): Promise<{ inserted: number; errors: string[] }> {
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const { data: cats } = await sb.from("categories")
    .select("id, name")
    .eq("academy_id", academyId);
  const catByName = new Map(
    (cats ?? []).map((c: any) => [c.name.trim().toLowerCase(), c.id]),
  );

  const toInsert: any[] = [];
  const errors: string[] = [];
  rows.forEach((r, idx) => {
    const lineNo = idx + 2; // +1 for header, +1 for 1-based index
    if (!r.scheduled_at) {
      errors.push(`السطر ${lineNo}: تاريخ التدريب مطلوب`);
      return;
    }
    const dt = new Date(r.scheduled_at);
    if (isNaN(dt.getTime())) {
      errors.push(`السطر ${lineNo}: تاريخ غير صالح: "${r.scheduled_at}"`);
      return;
    }
    let categoryId: string | null = null;
    if (r.category_name && r.category_name.trim()) {
      categoryId = catByName.get(r.category_name.trim().toLowerCase()) ?? null;
      if (!categoryId) {
        errors.push(`السطر ${lineNo}: التصنيف "${r.category_name}" غير موجود`);
        return;
      }
    }
    toInsert.push({
      academy_id: academyId,
      category_id: categoryId,
      scheduled_at: dt.toISOString(),
      duration_min: r.duration_min ? Number(r.duration_min) : 90,
      location: r.location?.trim() || null,
    });
  });

  if (toInsert.length === 0) return { inserted: 0, errors };

  const { error } = await sb.from("trainings").insert(toInsert);
  if (error) {
    return { inserted: 0, errors: [...errors, `خطأ في الإدراج: ${error.message}`] };
  }
  revalidatePath(`/academy/${academyId}/trainings`);
  return { inserted: toInsert.length, errors };
}
