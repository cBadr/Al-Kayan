"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAcademy } from "./actions";

/** Inline edit/delete cluster shown next to each academy in the list. */
export function AcademyActions({ academyId, academyName, slug }: {
  academyId: string;
  academyName: string;
  slug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function handleDelete() {
    if (typed.trim() !== slug) {
      setErr(`أدخل الـ slug "${slug}" بالضبط للتأكيد`);
      return;
    }
    setErr(null);
    startTransition(async () => {
      const res = await deleteAcademy(academyId);
      if (res.error) setErr(res.error);
      else setConfirm(false);
    });
  }

  if (confirm) {
    return (
      <div className="space-y-1.5 min-w-64">
        <p className="text-[11px] text-red-700 font-semibold leading-tight">
          ⚠️ سيُحذف كل شيء مرتبط بهذه الأكاديمية (لاعبون، مباريات، مالية، ...) — لا يمكن التراجع.
        </p>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`اكتب: ${slug}`}
          dir="ltr"
          className="h-8 text-xs font-mono"
          autoFocus
        />
        {err && <p className="text-[10px] text-red-600">{err}</p>}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
            className="flex-1 h-8 text-xs"
          >
            {pending ? "جارٍ الحذف..." : "حذف نهائي"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setConfirm(false); setTyped(""); setErr(null); }}
            disabled={pending}
            className="h-8 text-xs"
          >
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button asChild size="sm" variant="outline">
        <Link href={`/super-admin/academies/${academyId}`}>تعديل</Link>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setConfirm(true)}
      >
        🗑 حذف
      </Button>
    </div>
  );
}
