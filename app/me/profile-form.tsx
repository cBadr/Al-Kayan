"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyProfile } from "./actions";

type Defaults = {
  phone: string;
  email: string;
  guardian_name: string;
  guardian_phone: string;
};

export function MeProfileForm({ playerId, defaults }: { playerId: string; defaults: Defaults }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          setMsg(null);
          const res = await updateMyProfile(playerId, fd);
          if (res?.error) setMsg({ kind: "err", text: res.error });
          else setMsg({ kind: "ok", text: "✅ تم حفظ التحديثات" });
        });
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="phone">الهاتف</Label>
        <Input id="phone" name="phone" type="tel" dir="ltr" defaultValue={defaults.phone} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" dir="ltr" defaultValue={defaults.email} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="guardian_name">اسم ولي الأمر</Label>
          <Input id="guardian_name" name="guardian_name" defaultValue={defaults.guardian_name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guardian_phone">هاتف ولي الأمر</Label>
          <Input id="guardian_phone" name="guardian_phone" type="tel" dir="ltr" defaultValue={defaults.guardian_phone} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photo">تحديث الصورة (اختياري)</Label>
        <Input id="photo" name="photo" type="file" accept="image/*" />
      </div>

      {msg && (
        <div className={`text-xs rounded-md p-2 ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        💡 الاسم والكود والتصنيف يُعدَّلون من قِبل إدارة الأكاديمية.
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </Button>
    </form>
  );
}
