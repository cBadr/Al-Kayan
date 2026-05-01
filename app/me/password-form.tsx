"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword } from "./actions";

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  return (
    <form
      action={(fd) => {
        const pw = String(fd.get("password") ?? "");
        const confirm = String(fd.get("confirm") ?? "");
        if (pw.length < 8) { setMsg({ kind: "err", text: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" }); return; }
        if (pw !== confirm) { setMsg({ kind: "err", text: "كلمتا المرور غير متطابقتين" }); return; }
        startTransition(async () => {
          setMsg(null);
          const res = await changeMyPassword(fd);
          if (res?.error) setMsg({ kind: "err", text: res.error });
          else setMsg({ kind: "ok", text: "✅ تم تغيير كلمة المرور" });
        });
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة المرور الجديدة</Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          dir="ltr"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </div>

      {msg && (
        <div className={`text-xs rounded-md p-2 ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "جارٍ..." : "تغيير كلمة المرور"}
      </Button>
    </form>
  );
}
