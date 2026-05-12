"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

/**
 * Submit button that auto-disables itself while the surrounding form is
 * pending. Prevents double-clicks creating duplicate records (especially on
 * auth-creating forms like /join and player creation).
 *
 * Must be rendered inside a <form> so `useFormStatus()` can read its state.
 *
 * Works with both server actions (`<form action={serverAction}>`) and client
 * forms that use `startTransition` + the form action prop.
 */
export function SubmitButton({
  children,
  pendingLabel = "جارٍ المعالجة...",
  disabled,
  ...buttonProps
}: {
  children: ReactNode;
  pendingLabel?: string;
} & Omit<ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...buttonProps}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
