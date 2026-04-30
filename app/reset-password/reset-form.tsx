"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("كلمة المرور يجب أن تكون 8 أحرف فأكثر");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setLoading(true);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/login?reset=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة المرور الجديدة</Label>
        <Input id="password" type="password" required minLength={8} dir="ltr"
          value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" placeholder="••••••••" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <Input id="confirm" type="password" required minLength={8} dir="ltr"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password" placeholder="••••••••" />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md p-2.5">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full text-base h-11" disabled={loading}>
        {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
      </Button>
    </form>
  );
}
