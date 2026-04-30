"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RecomputeButton({ action }: { action: () => Promise<{ suspended: number; error?: string }> }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 no-print">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMsg(null);
            const res = await action();
            if (res.error) setMsg(`خطأ: ${res.error}`);
            else if (res.suspended === 0) setMsg("✅ كل اللاعبين متوافقون مع القاعدة");
            else setMsg(`✅ تم إيقاف ${res.suspended} لاعب جديد بناءً على البطاقات الصفراء`);
          })
        }
      >
        {pending ? "جارٍ الحساب..." : "🔄 إعادة فحص الإيقافات"}
      </Button>
      {msg && <span className={`text-sm ${msg.startsWith("خطأ") ? "text-red-600" : "text-emerald-700"}`}>{msg}</span>}
    </div>
  );
}
