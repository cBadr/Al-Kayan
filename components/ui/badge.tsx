import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-emerald-50 text-emerald-800 border-emerald-200",
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-700 border-amber-300",
        destructive: "bg-red-100 text-red-700 border-red-300",
        gold: "bg-gradient-to-br from-gold-300/30 to-gold-500/30 text-gold-600 border-gold-400/50",
        outline: "text-foreground border-border",
        muted: "bg-muted text-muted-foreground border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
