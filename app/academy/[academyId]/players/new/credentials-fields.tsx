"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Email + auto-generatable password fields used in the new-player form.
 *  Both are required so the player can immediately sign in after creation. */
export function CredentialsFields({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [password, setPassword] = useState("");

  function generate() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p = "";
    for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(p);
  }

  return (
    <div className="md:col-span-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
      <div>
        <h3 className="font-bold text-emerald-900 text-base">🔑 بيانات تسجيل الدخول للاعب</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          سيُنشأ حساب دخول للاعب حتى يتمكن من رؤية جدوله ومبارياته وملفه. شارك هذه البيانات معه أو مع ولي أمره.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">البريد الإلكتروني *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={defaultEmail}
            required
            placeholder="player@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">كلمة المرور (8 أحرف فأكثر) *</Label>
          <div className="flex gap-1">
            <Input
              id="password"
              name="password"
              type="text"
              dir="ltr"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-mono"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={generate}
              className="h-10 px-3 rounded-md border border-border bg-white hover:bg-muted text-sm font-semibold whitespace-nowrap"
            >
              توليد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
