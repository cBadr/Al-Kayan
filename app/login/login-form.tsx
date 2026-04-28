"use client";

import { useState } from "react";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
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
      <Button type="submit" className="w-full text-base h-11" disabled={loading}>
        {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
