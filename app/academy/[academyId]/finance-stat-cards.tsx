"use client";

import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { TrendingUp, AlertTriangle, Wallet, Trophy, Eye, EyeOff } from "lucide-react";

type Props = {
  totalCollected: string;
  outstanding: string;
  totalExpenses: string;
  netProfit: string;
};

export function FinanceStatCards({ totalCollected, outstanding, totalExpenses, netProfit }: Props) {
  const [visible, setVisible] = useState(false);
  const mask = "••••••";

  return (
    <>
      <div className="col-span-full -mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-md border border-emerald-700/30 bg-white hover:bg-emerald-50 transition-colors"
          aria-label={visible ? "إخفاء الأرقام المالية" : "إظهار الأرقام المالية"}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {visible ? "إخفاء الأرقام" : "إظهار الأرقام"}
        </button>
      </div>
      <StatCard label="إجمالي التحصيل" value={visible ? totalCollected : mask} icon={<TrendingUp className="w-6 h-6" />} accent="emerald" />
      <StatCard label="المتأخرات" value={visible ? outstanding : mask} icon={<AlertTriangle className="w-6 h-6" />} accent="warning" />
      <StatCard label="المصروفات" value={visible ? totalExpenses : mask} icon={<Wallet className="w-6 h-6" />} accent="destructive" />
      <StatCard label="صافي الربح" value={visible ? netProfit : mask} icon={<Trophy className="w-6 h-6" />} accent="gold" />
    </>
  );
}
