"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface Point { date: string; status: "present" | "absent" | "late" }

export function AttendanceTrend({ records }: { records: Point[] }) {
  // Group by month, compute attendance% per month
  const buckets = new Map<string, { p: number; t: number }>();
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = buckets.get(key) ?? { p: 0, t: 0 };
    cur.t += 1;
    if (r.status === "present" || r.status === "late") cur.p += 1;
    buckets.set(key, cur);
  }

  const data = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      "نسبة الحضور": v.t > 0 ? Math.round((v.p / v.t) * 100) : 0,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات حضور بعد</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip />
          <Line type="monotone" dataKey="نسبة الحضور" stroke="#065f46" strokeWidth={2.5} dot={{ r: 4, fill: "#fbbf24" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
