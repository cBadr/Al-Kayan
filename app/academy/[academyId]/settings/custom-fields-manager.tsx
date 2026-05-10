"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FIELD_TYPE_LABELS, type CustomFieldDefinition, type FieldType } from "@/lib/custom-fields";
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from "./custom-fields-actions";

const FIELD_TYPES: FieldType[] = ["text", "textarea", "number", "date", "file", "checkbox", "select"];

export function CustomFieldsManager({
  academyId,
  fields,
}: {
  academyId: string;
  fields: CustomFieldDefinition[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
        💡 الحقول هنا تظهر في <strong>نموذج الانضمام العام</strong> و<strong>صفحة إضافة لاعب</strong>،
        وتُحفظ في ملف اللاعب. يمكنك جعل أي حقل إجبارياً، إخفاءه عن نموذج معين، أو إضافة قائمة اختيارات.
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد حقول مخصصة بعد</p>
      ) : (
        <ul className="space-y-2">
          {fields.map((f) => (
            <li key={f.id}>
              {editingId === f.id ? (
                <FieldForm
                  academyId={academyId}
                  initial={f}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <FieldRow
                  field={f}
                  academyId={academyId}
                  onEdit={() => setEditingId(f.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <FieldForm academyId={academyId} onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          + إضافة حقل مخصص
        </Button>
      )}
    </div>
  );
}

function FieldRow({
  field, academyId, onEdit,
}: {
  field: CustomFieldDefinition;
  academyId: string;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`حذف الحقل "${field.label}"؟ القيم المسجَّلة ستُحذف معه.`)) return;
    startTransition(async () => {
      const res = await deleteCustomField(academyId, field.id);
      if (res.error) alert(res.error);
    });
  }

  function toggleActive() {
    startTransition(async () => {
      await updateCustomField(academyId, field.id, { active: !field.active });
    });
  }

  return (
    <div className={`flex items-start gap-3 p-3 border border-border rounded-lg bg-white ${!field.active ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-emerald-950">{field.label}</span>
          <Badge variant="muted" className="text-[10px]">{FIELD_TYPE_LABELS[field.field_type]}</Badge>
          {field.required && <Badge variant="warning" className="text-[10px]">إجباري</Badge>}
          {!field.active && <Badge variant="destructive" className="text-[10px]">معطَّل</Badge>}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-2">
          {field.show_on_join && <span>📝 نموذج الانضمام</span>}
          {field.show_on_admin_create && <span>👤 إضافة لاعب (إدمن)</span>}
          {field.show_on_profile && <span>📋 ملف اللاعب</span>}
          {field.field_type === "select" && field.options && (
            <span>· الخيارات: {field.options.join(" / ")}</span>
          )}
        </div>
        {field.help_text && (
          <div className="text-[11px] text-muted-foreground mt-1 italic">{field.help_text}</div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={onEdit} disabled={pending}>تعديل</Button>
        <Button size="sm" variant="ghost" onClick={toggleActive} disabled={pending}>
          {field.active ? "تعطيل" : "تفعيل"}
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600" onClick={handleDelete} disabled={pending}>
          حذف
        </Button>
      </div>
    </div>
  );
}

function FieldForm({
  academyId, initial, onClose,
}: {
  academyId: string;
  initial?: CustomFieldDefinition;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<FieldType>(initial?.field_type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [optionsText, setOptionsText] = useState((initial?.options ?? []).join("\n"));
  const [showJoin, setShowJoin] = useState(initial?.show_on_join ?? true);
  const [showAdmin, setShowAdmin] = useState(initial?.show_on_admin_create ?? true);
  const [showProfile, setShowProfile] = useState(initial?.show_on_profile ?? true);
  const [helpText, setHelpText] = useState(initial?.help_text ?? "");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    if (label.trim().length < 2) { setErr("اسم الحقل مطلوب"); return; }
    const options = type === "select"
      ? optionsText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (type === "select" && (!options || options.length < 2)) {
      setErr("أضف خيارَين على الأقل (سطر لكل خيار)");
      return;
    }

    const payload = {
      label: label.trim(),
      field_type: type,
      required,
      options,
      show_on_join: showJoin,
      show_on_admin_create: showAdmin,
      show_on_profile: showProfile,
      help_text: helpText.trim() || null,
    };

    startTransition(async () => {
      const res = initial
        ? await updateCustomField(academyId, initial.id, payload)
        : await createCustomField(academyId, payload);
      if (res.error) setErr(res.error);
      else onClose();
    });
  }

  return (
    <div className="border-2 border-emerald-300 bg-emerald-50/40 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>اسم الحقل (يظهر للمستخدم) *</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: إقرار المدرسة" />
        </div>
        <div className="space-y-1">
          <Label>نوع الحقل</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
            className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      {type === "select" && (
        <div className="space-y-1">
          <Label>الخيارات (سطر لكل خيار)</Label>
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder={"يمين\nيسار\nكلتاهما"}
            rows={4}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label>نص توضيحي (اختياري)</Label>
        <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} placeholder="مثال: ارفع صورة واضحة من الإقرار المدرسي" />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          إجباري
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showJoin} onChange={(e) => setShowJoin(e.target.checked)} />
          ظاهر في نموذج الانضمام
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showAdmin} onChange={(e) => setShowAdmin(e.target.checked)} />
          ظاهر في نموذج إضافة لاعب
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showProfile} onChange={(e) => setShowProfile(e.target.checked)} />
          ظاهر في ملف اللاعب
        </label>
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>إلغاء</Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "جارٍ الحفظ..." : initial ? "حفظ التعديلات" : "إضافة الحقل"}
        </Button>
      </div>
    </div>
  );
}
