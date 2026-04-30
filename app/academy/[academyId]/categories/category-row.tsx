"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Td, Tr } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  monthly_fee: number;
  age_min: number | null;
  age_max: number | null;
  active: boolean;
};

export function CategoryRow({
  cat,
  onUpdate,
  onDelete,
  onToggle,
}: {
  cat: Category;
  onUpdate: (id: string, fd: FormData) => Promise<{ error?: string } | void>;
  onDelete: (id: string) => Promise<{ error?: string } | void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <Tr>
        <Td colSpan={5}>
          <form
            action={(fd) => {
              startTransition(async () => {
                setError(null);
                const res = await onUpdate(cat.id, fd);
                if (res && "error" in res && res.error) setError(res.error);
                else setEditing(false);
              });
            }}
            className="flex flex-wrap items-end gap-3 py-2"
          >
            <div className="flex-1 min-w-48">
              <Input name="name" defaultValue={cat.name} required />
            </div>
            <div className="w-40">
              <Input name="monthly_fee" type="number" min="0" step="0.01" defaultValue={cat.monthly_fee} required />
            </div>
            <div className="w-28">
              <Input name="age_min" type="number" min="0" defaultValue={cat.age_min ?? ""} placeholder="من سن" />
            </div>
            <div className="w-28">
              <Input name="age_max" type="number" min="0" defaultValue={cat.age_max ?? ""} placeholder="إلى سن" />
            </div>
            <Button type="submit" size="sm" disabled={pending}>حفظ</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(false); setError(null); }}>إلغاء</Button>
            {error && <span className="text-destructive text-sm w-full">{error}</span>}
          </form>
        </Td>
      </Tr>
    );
  }

  return (
    <Tr>
      <Td className="font-medium">
        {cat.name}
        {!cat.active && <span className="mr-2 text-xs text-muted-foreground">(موقوف)</span>}
      </Td>
      <Td>{formatCurrency(cat.monthly_fee)}</Td>
      <Td>{cat.age_min || cat.age_max ? `${cat.age_min ?? "-"} → ${cat.age_max ?? "-"}` : "—"}</Td>
      <Td>{cat.active ? "نشط" : "موقوف"}</Td>
      <Td className="text-left">
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>تعديل</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startTransition(async () => { await onToggle(cat.id, !cat.active); })}
            disabled={pending}
          >
            {cat.active ? "إيقاف" : "تفعيل"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (!confirm(`حذف التصنيف "${cat.name}"؟`)) return;
              startTransition(async () => {
                const res = await onDelete(cat.id);
                if (res && "error" in res && res.error) alert(res.error);
              });
            }}
            disabled={pending}
          >
            حذف
          </Button>
        </div>
      </Td>
    </Tr>
  );
}
