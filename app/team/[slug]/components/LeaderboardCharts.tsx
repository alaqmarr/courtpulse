"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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
      <BarChart data={sorted}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="wins" fill="#34d399" />
        <Bar dataKey="losses" fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  );
}
