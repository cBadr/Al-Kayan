"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Action = (userId: string, fd: FormData) => Promise<{ error?: string; ok?: boolean }>;

export function UserActionsCell({
  userId,
  email,
  setPassword,
}: {
  userId: string;
  email: string | null;
  setPassword: Action;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      {!editing ? (
        <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setMsg(null); }}>
          تعيين كلمة مرور
        </Button>
      ) : (
        <form
          action={(fd) => {
            startTransition(async () => {
              const res = await setPassword(userId, fd);
              if (res?.error) setMsg(res.error);
              else { setMsg("✅ تم التحديث"); setEditing(false); }
            });
          }}
          className="flex gap-1 items-center"
        >
          <Input name="password" type="password" placeholder="كلمة جديدة (8+)" minLength={8} required className="h-8 w-40" />
          <Button size="sm" type="submit" disabled={pending}>حفظ</Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>إلغاء</Button>
        </form>
      )}
      {msg && <span className="text-xs text-emerald-700">{msg}</span>}
      {email && <span className="text-[10px] text-muted-foreground">للاستعادة: استخدم {email} في صفحة "نسيت كلمة المرور"</span>}
    </div>
  );
}
