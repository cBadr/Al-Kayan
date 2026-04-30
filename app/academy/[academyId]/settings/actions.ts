"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

const infoSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  manager_name: z.string().optional().or(z.literal("")),
});

export async function saveAcademyInfo(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const parsed = infoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

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
  await sb.from("academies").update(update).eq("id", academyId);
  revalidatePath(`/academy/${academyId}/settings`);
  revalidatePath(`/academy/${academyId}`);
}

export async function saveAcademySettings(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const sb = await createClient();

  const required = fd.getAll("required_fields").map(String);
  const settings = {
    attendance_lock_minutes: Number(fd.get("attendance_lock_minutes") ?? 25),
    receipt_footer: String(fd.get("receipt_footer") ?? ""),
    required_fields: required,
    notification_channels: ["in_app", "email"],
    overdue_reminders: {
      every_days: Number(fd.get("overdue_every_days") ?? 7),
      before_due_days: Number(fd.get("overdue_before_due_days") ?? 3),
      final_after_days: Number(fd.get("overdue_final_after_days") ?? 30),
    },
    date_format: "gregorian",
  };

  const cycleDays = Math.max(1, Number(fd.get("cycle_days") ?? 30));
  await sb.from("academies").update({ settings, cycle_days: cycleDays }).eq("id", academyId);
  revalidatePath(`/academy/${academyId}/settings`);
}
