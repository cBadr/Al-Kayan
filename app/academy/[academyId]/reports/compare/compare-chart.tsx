"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CompareChart({ data }: { data: any[] }) {
  const formatted = data.map((d) => ({
    name: d.full_name,
    "نسبة الحضور": Number(d.attendance_pct ?? 0),
    "أهداف": Number(d.goals ?? 0),
    "صفراء": Number(d.yellow_cards ?? 0),
    "حمراء": Number(d.red_cards ?? 0),
    "مباريات": Number(d.matches_played ?? 0),
  }));

  return (
    <Card>
      <CardHeader><CardTitle>مقارنة الأداء</CardTitle></CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="نسبة الحضور" fill="#15803d" />
              <Bar dataKey="أهداف" fill="#2563eb" />
              <Bar dataKey="مباريات" fill="#0891b2" />
              <Bar dataKey="صفراء" fill="#d97706" />
              <Bar dataKey="حمراء" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
