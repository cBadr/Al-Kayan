"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="text-center text-sm">
        <p className="text-emerald-700 font-semibold mb-2">✅ تم إرسال الرابط</p>
        <p className="text-muted-foreground">
          راجع بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" required dir="ltr"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com" />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md p-2.5">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full text-base h-11" disabled={loading}>
        {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
      </Button>
    </form>
  );
}
