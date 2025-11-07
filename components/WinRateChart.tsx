// components/WinRateChart.tsx
"use client";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2563eb", "#ef4444", "#10b981", "#f59e0b", "#7c3aed"];

export default function WinRateChart({ stats }: { stats: any[] }) {
  // convert to pie data: top 5 by plays
  const data = stats
    .map((s) => ({ name: s.teamName, value: s.plays, wins: s.wins }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No games yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
          {data.map((entry, idx) => (
            <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any, name: any, props: any) => [`${value} games`, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
