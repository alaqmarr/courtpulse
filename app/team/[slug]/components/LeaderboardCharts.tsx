// src/components/LeaderboardCharts.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function LeaderboardCharts({
  stats,
}: {
  stats: { name: string; wins: number; losses: number }[];
}) {
  const sorted = stats
    .map((s) => ({ ...s, total: s.wins + s.losses }))
    .sort((a, b) => b.wins - a.wins);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={sorted}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
      >
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          // This class mimics the shadcn/ui tooltip/popover style
          wrapperClassName="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
        />
        <Bar dataKey="wins" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="losses" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}