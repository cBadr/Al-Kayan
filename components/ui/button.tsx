import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-emerald-700 to-emerald-900 text-white hover:from-emerald-600 hover:to-emerald-800 hover:shadow-[0_8px_24px_rgba(6,78,59,0.35)]",
        gold:
          "bg-gradient-to-br from-gold-400 to-gold-600 text-obsidian-900 hover:shadow-[0_8px_24px_rgba(217,119,6,0.35)]",
        outline:
          "border border-emerald-800/30 bg-white/70 backdrop-blur hover:bg-white hover:border-emerald-800/60 text-emerald-900",
        ghost: "hover:bg-emerald-50 text-emerald-900",
        destructive:
          "bg-gradient-to-br from-red-500 to-red-700 text-white hover:shadow-[0_8px_24px_rgba(220,38,38,0.35)]",
        secondary: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-100",
        link: "text-emerald-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), "shine", className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
