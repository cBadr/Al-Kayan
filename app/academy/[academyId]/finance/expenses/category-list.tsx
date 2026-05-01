"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameExpenseCategory, deleteExpenseCategory } from "./actions";

type Cat = { id: string; name: string };

export function ExpenseCategoryList({
  academyId,
  categories,
}: {
  academyId: string;
  categories: Cat[];
}) {
  return (
    <ul className="text-sm space-y-1">
      {categories.map((c) => (
        <CategoryRow key={c.id} academyId={academyId} cat={c} />
      ))}
      {categories.length === 0 && (
        <li className="text-muted-foreground text-xs">لا توجد تصنيفات بعد</li>
      )}
    </ul>
  );
}

function CategoryRow({ academyId, cat }: { academyId: string; cat: Cat }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 flex-1"
          autoFocus
        />
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setErr(null);
              const res = await renameExpenseCategory(academyId, cat.id, name);
              if (res?.error) setErr(res.error);
              else setEditing(false);
            })
          }
        >
          حفظ
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setEditing(false); setName(cat.name); setErr(null); }}
        >
          إلغاء
        </Button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 group">
      <span className="text-foreground">{cat.name}</span>
      <span className="hidden group-hover:flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-amber-600 text-xs hover:underline"
        >
          تعديل
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`حذف التصنيف "${cat.name}"؟ المصروفات المرتبطة ستبقى لكن بدون تصنيف.`)) return;
            startTransition(async () => {
              const res = await deleteExpenseCategory(academyId, cat.id);
              if (res?.error) alert(res.error);
            });
          }}
          className="text-red-600 text-xs hover:underline"
        >
          حذف
        </button>
      </span>
    </li>
  );
}
