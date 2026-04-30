"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

const schema = z.object({
  name: z.string().min(2),
  monthly_fee: z.coerce.number().min(0),
  age_min: z.coerce.number().int().optional().or(z.literal("")),
  age_max: z.coerce.number().int().optional().or(z.literal("")),
});

export async function createCategory(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "بيانات غير صالحة" };
  const sb = await createClient();
  await sb.from("categories").insert({
    academy_id: academyId,
    name: parsed.data.name,
    monthly_fee: parsed.data.monthly_fee,
    age_min: parsed.data.age_min || null,
    age_max: parsed.data.age_max || null,
  });
  revalidatePath(`/academy/${academyId}/categories`);
}

export async function deleteCategory(academyId: string, id: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { error } = await sb.from("categories").delete().eq("id", id).eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/categories`);
}

export async function updateCategory(academyId: string, id: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "بيانات غير صالحة" };
  const sb = await createClient();
  await sb.from("categories").update({
    name: parsed.data.name,
    monthly_fee: parsed.data.monthly_fee,
    age_min: parsed.data.age_min || null,
    age_max: parsed.data.age_max || null,
    active: fd.get("active") === "off" ? false : true,
  }).eq("id", id).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/categories`);
}

export async function toggleCategoryActive(academyId: string, id: string, active: boolean) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("categories").update({ active }).eq("id", id).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/categories`);
}
