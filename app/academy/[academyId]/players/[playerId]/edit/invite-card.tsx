"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (
  academyId: string,
  playerId: string,
  email: string,
  password: string,
) => Promise<{ ok?: boolean; error?: string }>;

export function InviteCard({
  academyId,
  playerId,
  defaultEmail,
  hasLogin,
  invite,
}: {
  academyId: string;
  playerId: string;
  defaultEmail: string;
  hasLogin: boolean;
  invite: Action;
}) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [open, setOpen] = useState(!hasLogin);

  function genPassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p = "";
    for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(p);
  }

  function submit() {
    setMsg(null);
    if (!email.trim()) { setMsg({ kind: "err", text: "البريد الإلكتروني مطلوب" }); return; }
    if (password.length < 8) { setMsg({ kind: "err", text: "كلمة المرور يجب أن تكون 8 أحرف فأكثر" }); return; }
    startTransition(async () => {
      const res = await invite(academyId, playerId, email, password);
      if (res.error) setMsg({ kind: "err", text: res.error });
      else setMsg({ kind: "ok", text: hasLogin ? "✅ تم تحديث كلمة المرور" : "✅ تم إنشاء الحساب — يمكن للاعب الدخول الآن" });
    });
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-emerald-900 text-base">
            {hasLogin ? "🔐 تعديل بيانات تسجيل الدخول" : "🔑 تفعيل حساب اللاعب"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasLogin
              ? "للاعب حساب فعّال. يمكنك تغيير كلمة المرور أو البريد لإعادة الإصدار."
              : "اللاعب لا يستطيع الدخول حتى الآن. أنشئ حساباً ليتمكن من رؤية جدوله ومبارياته وملفه."}
          </p>
        </div>
        {hasLogin && !open && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            تعديل
          </Button>
        )}
      </div>

      {open && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite_email">البريد الإلكتروني</Label>
              <Input
                id="invite_email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite_password">كلمة المرور (8 أحرف فأكثر)</Label>
              <div className="flex gap-1">
                <Input
                  id="invite_password"
                  type="text"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="font-mono"
                />
                <Button type="button" size="sm" variant="outline" onClick={genPassword}>
                  توليد
                </Button>
              </div>
            </div>
          </div>

          {msg && (
            <div className={`text-xs rounded-md p-2 ${
              msg.kind === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"
            }`}>{msg.text}</div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={submit} disabled={pending} variant="gold">
              {pending ? "جارٍ..." : hasLogin ? "تحديث كلمة المرور" : "تفعيل الحساب"}
            </Button>
            {hasLogin && (
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setMsg(null); setPassword(""); }}>
                إلغاء
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground ms-auto">
              💡 شارك هذه البيانات مع اللاعب أو ولي أمره ليسجِّل الدخول من /login
            </p>
          </div>
        </>
      )}
    </div>
  );
}
