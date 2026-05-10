"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addAdHocPlayerField,
  updateAdHocPlayerField,
  deletePlayerCustomValue,
} from "../actions";
import { FIELD_TYPE_LABELS, formatFieldValueForDisplay, type FieldType } from "@/lib/custom-fields";

type ValueRow = {
  id: string;
  field_definition_id: string | null;
  ad_hoc_label: string | null;
  value: string | null;
  // joined from custom_field_definitions
  definition?: {
    label: string;
    field_type: FieldType;
    show_on_profile: boolean;
  } | null;
  signed_url?: string | null;  // for file types, server-side resolved
};

export function CustomValuesSection({
  academyId,
  playerId,
  values,
  isManager,
}: {
  academyId: string;
  playerId: string;
  values: ValueRow[];
  isManager: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  if (values.length === 0 && !isManager) return null;

  return (
    <div className="space-y-3">
      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد بيانات مخصصة بعد.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {values.map((v) => (
            <ValueRowDisplay
              key={v.id}
              row={v}
              academyId={academyId}
              playerId={playerId}
              isManager={isManager}
            />
          ))}
        </ul>
      )}

      {isManager && (
        adding ? (
          <AddAdHocForm
            academyId={academyId}
            playerId={playerId}
            onClose={() => setAdding(false)}
            startTransition={startTransition}
            pending={pending}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            + إضافة بيان مخصص لهذا اللاعب
          </Button>
        )
      )}
    </div>
  );
}

function ValueRowDisplay({
  row, academyId, playerId, isManager,
}: {
  row: ValueRow;
  academyId: string;
  playerId: string;
  isManager: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(row.ad_hoc_label ?? "");
  const [value, setValue] = useState(row.value ?? "");
  const [pending, startTransition] = useTransition();

  const isAdHoc = row.field_definition_id == null;
  const displayLabel = row.definition?.label ?? row.ad_hoc_label ?? "—";
  const fieldType: FieldType | null = row.definition?.field_type ?? null;
  const isFile = fieldType === "file";

  if (editing && isAdHoc) {
    return (
      <li className="rounded-lg border-2 border-emerald-300 bg-emerald-50/40 p-3 space-y-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="اسم الحقل" />
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="القيمة" />
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setLabel(row.ad_hoc_label ?? ""); setValue(row.value ?? ""); }}>
            إلغاء
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await updateAdHocPlayerField(academyId, row.id, label, value);
                if (res.error) alert(res.error);
                else setEditing(false);
              });
            }}
          >
            حفظ
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-1">
            {displayLabel}
            {fieldType && <span className="text-muted-foreground font-normal">({FIELD_TYPE_LABELS[fieldType]})</span>}
            {isAdHoc && <span className="text-amber-600 font-normal">(مخصص للاعب)</span>}
          </div>
          <div className="font-medium text-emerald-950 mt-1 break-words">
            {isFile && row.signed_url ? (
              <a href={row.signed_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                📎 عرض الملف
              </a>
            ) : isFile ? (
              <span className="text-muted-foreground">📎 ملف مرفوع (لا يمكن المعاينة الآن)</span>
            ) : (
              formatFieldValueForDisplay(fieldType ?? "text", row.value)
            )}
          </div>
        </div>
        {isManager && (
          <div className="flex gap-1 shrink-0 no-print">
            {isAdHoc && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-amber-600 text-xs hover:underline"
              >
                تعديل
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm(`حذف "${displayLabel}"؟`)) return;
                startTransition(async () => {
                  const res = await deletePlayerCustomValue(academyId, row.id);
                  if (res.error) alert(res.error);
                });
              }}
              className="text-red-600 text-xs hover:underline"
            >
              حذف
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function AddAdHocForm({
  academyId, playerId, onClose, startTransition, pending,
}: {
  academyId: string;
  playerId: string;
  onClose: () => void;
  startTransition: (fn: () => void | Promise<void>) => void;
  pending: boolean;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  return (
    <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/40 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        💡 هذا البيان يضاف لهذا اللاعب فقط (وليس لكل اللاعبين). للحقول العامة استخدم "إعدادات الأكاديمية".
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">اسم البيان</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: ملاحظات الكشف الطبي" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">القيمة</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="القيمة" />
        </div>
      </div>
      <div className="flex gap-1 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={pending}>إلغاء</Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!label.trim()) { alert("اسم الحقل مطلوب"); return; }
            startTransition(async () => {
              const res = await addAdHocPlayerField(academyId, playerId, label, value);
              if (res.error) alert(res.error);
              else { setLabel(""); setValue(""); onClose(); }
            });
          }}
        >
          إضافة
        </Button>
      </div>
    </div>
  );
}
