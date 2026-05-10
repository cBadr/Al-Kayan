/** Shared types + helpers for the dynamic-custom-fields feature.
 *  All field handling for both definitions and player values goes through here. */

export type FieldType = "text" | "textarea" | "number" | "date" | "file" | "checkbox" | "select";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "نص قصير",
  textarea: "نص طويل",
  number: "رقم",
  date: "تاريخ",
  file: "ملف/صورة",
  checkbox: "نعم/لا",
  select: "اختيار من قائمة",
};

export interface CustomFieldDefinition {
  id: string;
  academy_id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: string[] | null;
  show_on_join: boolean;
  show_on_admin_create: boolean;
  show_on_profile: boolean;
  display_order: number;
  active: boolean;
  help_text: string | null;
}

export interface PlayerCustomValue {
  id: string;
  player_id: string;
  field_definition_id: string | null;
  ad_hoc_label: string | null;
  value: string | null;
  display_order: number;
}

/** Normalize a raw form-data string to a value the DB can store.
 *  - "checkbox" returns "true" if present, null otherwise.
 *  - file is handled separately (upload then store path).
 *  - empty/whitespace strings are stored as null. */
export function normalizeFieldValue(type: FieldType, raw: unknown): string | null {
  if (type === "checkbox") return raw ? "true" : null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed;
}

/** Display label for a value in the player profile. */
export function formatFieldValueForDisplay(type: FieldType, value: string | null): string {
  if (value == null || value === "") return "—";
  if (type === "checkbox") return value === "true" ? "نعم" : "لا";
  return value;
}

/** Build a safe field_key from an Arabic label by transliterating to ascii-ish. */
export function generateFieldKey(label: string): string {
  // Simple normalization: lowercase, remove non-word, replace spaces with underscore.
  // Arabic chars stay as-is (Postgres + utf-8 handles them in field_key).
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .slice(0, 60) || `field_${Math.random().toString(36).slice(2, 8)}`;
}
