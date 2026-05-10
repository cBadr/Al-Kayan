"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

const infoSchema = z.object({
  name: z.string().min(2, "اسم الأكاديمية مطلوب"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i, "المعرّف بحروف لاتينية وأرقام وشرطات فقط"),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  manager_name: z.string().optional().or(z.literal("")),
});

export async function saveAcademyInfo(
  academyId: string,
  fd: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const parsed = infoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const update: Record<string, unknown> = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    manager_name: parsed.data.manager_name || null,
  };

  const newLogo = await uploadIfPresent("logos", fd, "logo", `academies/${academyId}`);
  if (newLogo) update.logo_url = newLogo;
  const newSeal = await uploadIfPresent("logos", fd, "seal", `academies/${academyId}/seal`);
  if (newSeal) update.seal_url = newSeal;
  const newSignature = await uploadIfPresent("logos", fd, "manager_signature", `academies/${academyId}/signature`);
  if (newSignature) update.manager_signature_url = newSignature;

  const sb = await createClient();
  const { error } = await sb.from("academies").update(update).eq("id", academyId);
  if (error) {
    // Surface common errors clearly so the admin understands why the save failed.
    if (/duplicate key/.test(error.message)) {
      return { error: "هذا المعرّف (slug) مستخدَم لأكاديمية أخرى — اختر معرّفاً مختلفاً." };
    }
    if (/column .* does not exist/i.test(error.message)) {
      return { error: `أحد الأعمدة غير موجود في القاعدة — تأكد من تطبيق آخر الـ migrations. التفاصيل: ${error.message}` };
    }
    return { error: error.message };
  }

  // Revalidate every path that could show academy info — settings page, dashboard,
  // sidebar layout (which displays academy name), and the super-admin listing.
  revalidatePath(`/academy/${academyId}`, "layout");
  revalidatePath("/super-admin/academies");
  return { ok: true };
}

const settingsSchema = z.object({
  attendance_lock_minutes: z.coerce.number().min(0).max(720),
  cycle_days: z.coerce.number().int().min(1).max(365),
  receipt_footer: z.string().optional().or(z.literal("")),
  overdue_every_days: z.coerce.number().int().min(1).max(90),
  overdue_before_due_days: z.coerce.number().int().min(0).max(30),
  overdue_final_after_days: z.coerce.number().int().min(1).max(180),
});

export async function saveAcademySettings(
  academyId: string,
  fd: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);

  // Coerce + validate (so bad input is rejected instead of silently saved as NaN).
  const raw = {
    attendance_lock_minutes: fd.get("attendance_lock_minutes") ?? 25,
    cycle_days: fd.get("cycle_days") ?? 30,
    receipt_footer: fd.get("receipt_footer") ?? "",
    overdue_every_days: fd.get("overdue_every_days") ?? 7,
    overdue_before_due_days: fd.get("overdue_before_due_days") ?? 3,
    overdue_final_after_days: fd.get("overdue_final_after_days") ?? 30,
  };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const required = fd.getAll("required_fields").map(String);
  const settings = {
    attendance_lock_minutes: parsed.data.attendance_lock_minutes,
    receipt_footer: parsed.data.receipt_footer || "",
    required_fields: required,
    notification_channels: ["in_app", "email"],
    overdue_reminders: {
      every_days: parsed.data.overdue_every_days,
      before_due_days: parsed.data.overdue_before_due_days,
      final_after_days: parsed.data.overdue_final_after_days,
    },
    date_format: "gregorian",
  };

  const sb = await createClient();
  const { error } = await sb.from("academies")
    .update({ settings, cycle_days: parsed.data.cycle_days })
    .eq("id", academyId);
  if (error) {
    if (/column .*cycle_days.* does not exist/i.test(error.message)) {
      return { error: "العمود cycle_days غير موجود — طبّق آخر migration (0011) ثم أعد المحاولة." };
    }
    return { error: error.message };
  }
  revalidatePath(`/academy/${academyId}`, "layout");
  return { ok: true };
}
