import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon, accent = "emerald", trend, className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "emerald" | "gold" | "warning" | "destructive";
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  const accentClasses = {
    emerald: "from-emerald-700/10 to-emerald-700/0 text-emerald-700",
    gold: "from-gold-400/15 to-gold-400/0 text-gold-600",
    warning: "from-amber-400/15 to-amber-400/0 text-amber-700",
    destructive: "from-red-500/10 to-red-500/0 text-red-600",
  }[accent];

  return (
    <div className={cn("card-premium stat-card rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-950 truncate">{value}</p>
          {trend && (
            <p className={cn("mt-1.5 text-xs font-semibold", trend.positive ? "text-emerald-700" : "text-red-600")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
            accentClasses,
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
