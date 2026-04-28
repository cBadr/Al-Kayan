import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto rounded-xl border border-border bg-white/85 backdrop-blur-sm shadow-sm">
    <table className={cn("w-full text-sm", className)} {...props} />
  </div>
);
export const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-gradient-to-l from-emerald-50 to-emerald-100/50 text-right text-emerald-900", className)} {...props} />
);
export const TBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />;
export const Tr = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-border last:border-0 transition-colors hover:bg-emerald-50/40", className)} {...props} />
);
export const Th = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("px-4 py-3 text-right font-bold text-xs uppercase tracking-wider", className)} {...props} />
);
export const Td = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3", className)} {...props} />
);
