"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadIfPresent } from "@/lib/uploads";
import { normalizeFieldValue, type CustomFieldDefinition } from "@/lib/custom-fields";

/**
 * Save the values from a FormData submission for the given custom field
 * definitions onto a player record. Handles file uploads (private bucket).
 *
 * Form fields are expected to use `name="custom__<field_key>"`. This is set by
 * the <CustomFieldsRenderer/> component.
 *
 * Existing values for the same (player, definition) are upserted via the
 * unique index `pcv_unique_def`.
 */
export async function saveCustomFieldValues(
  sb: SupabaseClient<any>,
  academyId: string,
  playerId: string,
  fields: CustomFieldDefinition[],
  fd: FormData,
): Promise<void> {
  if (fields.length === 0) return;

  // Pre-fetch existing values so file uploads with empty new file keep the old path.
  const { data: existing } = await sb.from("player_custom_values")
    .select("field_definition_id, value")
    .eq("player_id", playerId);
  const existingMap = new Map(
    (existing ?? []).map((r: any) => [r.field_definition_id, r.value]),
  );

  type Row = { player_id: string; field_definition_id: string; value: string | null };
  const rows: Row[] = [];

  for (const f of fields) {
    const key = `custom__${f.field_key}`;
    let value: string | null = null;

    if (f.field_type === "file") {
      const path = await uploadIfPresent(
        "join-docs",
        fd,
        key,
        `${academyId}/players/${playerId}/custom`,
      );
      value = path ?? (existingMap.get(f.id) as string | null) ?? null;
    } else {
      const raw = fd.get(key);
      value = normalizeFieldValue(f.field_type, raw);
    }

    rows.push({ player_id: playerId, field_definition_id: f.id, value });
  }

  // Upsert: existing row matched by (player_id, field_definition_id) unique index.
  await sb.from("player_custom_values").upsert(rows, {
    onConflict: "player_id,field_definition_id",
  });
}

/**
 * Variant for the public /join form which has NO player yet — just collect
 * raw values + file paths into a JSON object stored on the join_request row.
 * The values are converted into player_custom_values when the join request
 * is approved (see join-requests/actions.ts).
 */
export async function collectCustomValuesForJoinRequest(
  sb: SupabaseClient<any>,
  academyId: string,
  fields: CustomFieldDefinition[],
  fd: FormData,
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  for (const f of fields) {
    const key = `custom__${f.field_key}`;
    if (f.field_type === "file") {
      const path = await uploadIfPresent(
        "join-docs",
        fd,
        key,
        `${academyId}/join-requests/custom`,
      );
      out[f.field_key] = path ?? null;
    } else {
      out[f.field_key] = normalizeFieldValue(f.field_type, fd.get(key));
    }
  }
  return out;
}
