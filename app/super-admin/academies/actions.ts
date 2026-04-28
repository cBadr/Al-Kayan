"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/rbac";

const academySchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i, "الـ slug بحروف لاتينية وأرقام وشرطات فقط"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  attendance_lock_minutes: z.coerce.number().min(0).max(720).default(25),
});

export async function createAcademy(formData: FormData) {
  await requireSuperAdmin();
  const parsed = academySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("academies")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      settings: {
        attendance_lock_minutes: parsed.data.attendance_lock_minutes,
        required_fields: ["full_name", "birth_date", "phone"],
        notification_channels: ["in_app", "email"],
        overdue_reminders: { every_days: 7, before_due_days: 3, final_after_days: 30 },
        receipt_footer: "الاشتراك غير قابل للاسترداد",
        date_format: "gregorian",
      },
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/super-admin/academies");
  redirect(`/super-admin/academies/${data!.id}`);
}

export async function updateAcademy(id: string, formData: FormData) {
  await requireSuperAdmin();
  const parsed = academySchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  const sb = await createClient();
  const { error } = await sb.from("academies").update(parsed.data as any).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/super-admin/academies/${id}`);
  return { ok: true };
}
