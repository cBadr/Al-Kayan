"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type StatItem = {
  label: string;
  value: string;
  variant?: "warning";
  sensitive?: boolean;
};

export function FinanceStats({ stats }: { stats: StatItem[] }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "إخفاء الأرقام" : "إظهار الأرقام"}
        >
          {visible ? "🙈 إخفاء الأرقام" : "👁 إظهار الأرقام"}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.variant === "warning" ? "text-warning" : ""}`}>
                {s.sensitive && !visible ? "••••••" : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
