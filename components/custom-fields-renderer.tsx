import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomFieldDefinition } from "@/lib/custom-fields";

/** Server-friendly renderer for a list of custom field definitions inside any form.
 *  Each input uses `name="custom__<field_key>"` so the server action can collect them
 *  via `fd.entries()` filtered by prefix. */
export function CustomFieldsRenderer({
  fields,
  defaultValues = {},
  className = "",
}: {
  fields: CustomFieldDefinition[];
  defaultValues?: Record<string, string | null>;
  className?: string;
}) {
  if (fields.length === 0) return null;

  return (
    <div className={`md:col-span-2 space-y-3 border-t border-border pt-4 mt-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="w-1 h-5 bg-emerald-700 rounded-full" />
        <h4 className="font-bold text-emerald-900">حقول إضافية</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => {
          const name = `custom__${f.field_key}`;
          const dv = defaultValues[f.field_key] ?? "";
          return (
            <div key={f.id} className={`space-y-1.5 ${f.field_type === "textarea" || f.field_type === "file" ? "md:col-span-2" : ""}`}>
              <Label htmlFor={name}>
                {f.label}{f.required && " *"}
              </Label>
              {f.field_type === "text" && (
                <Input id={name} name={name} type="text" defaultValue={dv} required={f.required} />
              )}
              {f.field_type === "number" && (
                <Input id={name} name={name} type="number" step="any" defaultValue={dv} required={f.required} />
              )}
              {f.field_type === "date" && (
                <Input id={name} name={name} type="date" defaultValue={dv} required={f.required} />
              )}
              {f.field_type === "textarea" && (
                <textarea
                  id={name}
                  name={name}
                  rows={3}
                  defaultValue={dv}
                  required={f.required}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
              )}
              {f.field_type === "checkbox" && (
                <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-card text-sm">
                  <input
                    id={name}
                    name={name}
                    type="checkbox"
                    defaultChecked={dv === "true"}
                    value="true"
                  />
                  <span>{f.help_text || "نعم"}</span>
                </label>
              )}
              {f.field_type === "select" && (
                <select
                  id={name}
                  name={name}
                  defaultValue={dv}
                  required={f.required}
                  className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
                >
                  <option value="">— اختر —</option>
                  {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
              {f.field_type === "file" && (
                <>
                  {dv && (
                    <p className="text-[10px] text-emerald-700 mb-1">
                      ✅ ملف مرفوع — اترك الحقل فارغاً للإبقاء عليه، أو اختر ملفاً جديداً للاستبدال
                    </p>
                  )}
                  <Input id={name} name={name} type="file" accept="image/*,.pdf" required={f.required && !dv} />
                </>
              )}
              {f.help_text && f.field_type !== "checkbox" && (
                <p className="text-[10px] text-muted-foreground">{f.help_text}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
