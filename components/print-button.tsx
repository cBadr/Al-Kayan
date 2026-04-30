"use client";

import { Button } from "@/components/ui/button";

/**
 * Universal "print" button. Triggers the browser's print dialog. Pages that
 * want a clean printout should use the `.no-print` utility class on chrome
 * elements and rely on the global `@media print` rules in globals.css.
 */
export function PrintButton({
  label = "🖨 طباعة",
  variant = "outline",
  className,
}: {
  label?: string;
  variant?: "outline" | "default" | "ghost" | "gold";
  className?: string;
}) {
  return (
    <Button variant={variant} className={className} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
