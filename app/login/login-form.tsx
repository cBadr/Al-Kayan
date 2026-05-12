"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous double-click guard — set BEFORE the first await runs so a
  // second click that fires before React paints `setLoading(true)` is blocked.
  const submittingRef = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;          // hard block
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError("بيانات الدخول غير صحيحة");
      setLoading(false);
      submittingRef.current = false;            // allow retry
      return;
    }
    // Keep button disabled while redirect/refresh happens.
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
          placeholder="example@email.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
          placeholder="••••••••" />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-md p-2.5 animate-fade-in">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full text-base h-11" disabled={loading} aria-busy={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            جارٍ الدخول...
          </span>
        ) : "تسجيل الدخول"}
      </Button>
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm text-emerald-700 hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      {params.get("reset") === "1" && (
        <p className="text-sm text-emerald-700 text-center">تم تحديث كلمة المرور — سجِّل الدخول الآن.</p>
      )}
    </form>
  );
}
