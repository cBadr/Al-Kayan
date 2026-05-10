"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { generateFieldKey, type FieldType } from "@/lib/custom-fields";

const fieldSchema = z.object({
  label: z.string().min(2, "الاسم مطلوب"),
  field_type: z.enum(["text", "textarea", "number", "date", "file", "checkbox", "select"]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  show_on_join: z.boolean().optional(),
  show_on_admin_create: z.boolean().optional(),
  show_on_profile: z.boolean().optional(),
  help_text: z.string().optional().nullable(),
});

export async function createCustomField(
  academyId: string,
  payload: {
    label: string;
    field_type: FieldType;
    required?: boolean;
    options?: string[];
    show_on_join?: boolean;
    show_on_admin_create?: boolean;
    show_on_profile?: boolean;
    help_text?: string | null;
  },
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const parsed = fieldSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const sb = await createClient();

  // Find next display_order
  const { data: existing } = await sb.from("custom_field_definitions")
    .select("display_order")
    .eq("academy_id", academyId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  // Generate a unique key (append numeric suffix on collision)
  let baseKey = generateFieldKey(parsed.data.label);
  let key = baseKey;
  let attempt = 1;
  while (true) {
    const { data: clash } = await sb.from("custom_field_definitions")
      .select("id")
      .eq("academy_id", academyId)
      .eq("field_key", key)
      .maybeSingle();
    if (!clash) break;
    attempt += 1;
    key = `${baseKey}_${attempt}`;
    if (attempt > 50) return { error: "تعذَّر توليد معرّف فريد" };
  }

  const { error } = await sb.from("custom_field_definitions").insert({
    academy_id: academyId,
    field_key: key,
    label: parsed.data.label,
    field_type: parsed.data.field_type,
    required: parsed.data.required ?? false,
    options: parsed.data.field_type === "select" ? (parsed.data.options ?? []) : null,
    show_on_join: parsed.data.show_on_join ?? true,
    show_on_admin_create: parsed.data.show_on_admin_create ?? true,
    show_on_profile: parsed.data.show_on_profile ?? true,
    help_text: parsed.data.help_text || null,
    display_order: nextOrder,
  });
  if (error) return { error: error.message };

  revalidatePath(`/academy/${academyId}/settings`);
  revalidatePath(`/academy/${academyId}/players/new`);
  return { ok: true };
}

export async function updateCustomField(
  academyId: string,
  fieldId: string,
  payload: Partial<{
    label: string;
    field_type: FieldType;
    required: boolean;
    options: string[];
    show_on_join: boolean;
    show_on_admin_create: boolean;
    show_on_profile: boolean;
    help_text: string | null;
    active: boolean;
  }>,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const update: Record<string, unknown> = { ...payload };
  // Sanitize options: only stored for 'select'
  if (payload.field_type && payload.field_type !== "select") update.options = null;
  const { error } = await sb.from("custom_field_definitions")
    .update(update)
    .eq("id", fieldId)
    .eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/settings`);
  return { ok: true };
}

export async function deleteCustomField(
  academyId: string,
  fieldId: string,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  // CASCADE removes player_custom_values rows tied to this definition.
  const { error } = await sb.from("custom_field_definitions")
    .delete()
    .eq("id", fieldId)
    .eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/settings`);
  return { ok: true };
}

export async function reorderCustomFields(
  academyId: string,
  orderedIds: string[],
): Promise<{ ok?: boolean; error?: string }> {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  // Apply each as a separate update (small N, fine).
  for (let i = 0; i < orderedIds.length; i++) {
    await sb.from("custom_field_definitions")
      .update({ display_order: i })
      .eq("id", orderedIds[i])
      .eq("academy_id", academyId);
  }
  revalidatePath(`/academy/${academyId}/settings`);
  return { ok: true };
}
