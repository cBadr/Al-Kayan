"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Action = (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;

/** Wraps a settings form so that the server action's success/error message is
 *  displayed inline (instead of silently discarded). The form fields are
 *  passed as `children`. */
export function SettingsForm({
  action,
  children,
  saveLabel = "حفظ",
  className = "",
}: {
  action: Action;
  children: ReactNode;
  saveLabel?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          setMsg(null);
          const res = await action(fd);
          if (res && "error" in res && res.error) {
            setMsg({ kind: "err", text: res.error });
          } else {
            setMsg({ kind: "ok", text: "✅ تم الحفظ بنجاح" });
          }
        });
      }}
      className={`space-y-4 ${className}`}
    >
      {children}

      {msg && (
        <div
          className={`text-sm rounded-md p-3 border ${
            msg.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : saveLabel}
        </Button>
      </div>
    </form>
  );
}
