// src/app/teams/[id]/PublicTeamStats.tsx (or similar)
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CircularProgressChart from "./CircularProgressChart";
import { Separator } from "@/components/ui/separator";

/* -------------------- MAIN PUBLIC STATS -------------------- */
export default function PublicTeamStats({ team }: { team: any }) {
  const games = team.sessions.flatMap((s: any) => s.games);
  const members = team.members.map((m: any) => ({
    name: m.user?.name || m.email.split("@")[0],
  }));

  const stats = calculateStats(games, members);
  const topPlayer = stats[0] || null;
  const avgWinRate = (
    (stats.reduce(
      (acc, s) => acc + (s.wins / (s.wins + s.losses || 1)),
      0
    ) /
      (stats.length || 1)) *
    100
  ).toFixed(1);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Team Statistics & Analytics</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary Section - Softer, more minimal blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">Top Player</p>
            <p className="text-lg font-semibold truncate">
              {topPlayer?.name || "N/A"}
            </p>
          </div>
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">Avg Win Rate</p>
            <p className="text-lg font-semibold">{avgWinRate}%</p>
          </div>
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-lg font-semibold">{games.length}</p>
          </div>
        </div>

        {/* --- Leaderboard Table (Primary Content) --- */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Leaderboard</h3>
          <LeaderboardTable stats={stats} />
        </div>


      </CardContent>
    </Card>
    <Separator className="my-10" />
    {/* --- Charts Section (Responsive Grid) --- */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Player Win Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Using the new CircularProgressChart */}
              <CircularProgressChart stats={stats} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Winning Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              {/* WinningPairs will now handle its own legend */}
              <WinningPairs games={games} />
            </CardContent>
          </Card>
        </div>
        </>
  );
}

/* -------------------- COMPUTATION -------------------- */
// (This function is unchanged, it's pure logic)
function calculateStats(games: any[], members: any[]) {
  const map: Record<
    string,
    { name: string; wins: number; losses: number; points: number }
  > = {};
  members.forEach(
    (m) => (map[m.name] = { ...m, wins: 0, losses: 0, points: 0 })
  );

  for (const g of games) {
    if (!g.winner) continue;
    const winners = g.winner === "A" ? g.teamAPlayers : g.teamBPlayers;
    const losers = g.winner === "A" ? g.teamBPlayers : g.teamAPlayers;

    winners.forEach((n: string) => {
      if (map[n]) {
        map[n].wins++;
        map[n].points += 10;
      }
    });

    losers.forEach((n: string) => {
      if (map[n]) {
        map[n].losses++;
        map[n].points += 2;
      }
    });
  }

  return Object.values(map).sort(
    (a, b) =>
      b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name)
  );
}

/* -------------------- TABLE LEADERBOARD -------------------- */
function LeaderboardTable({
  stats,
}: {
  stats: { name: string; wins: number; losses: number; points: number }[];
}) {
  const getRankDisplay = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/50">
          <tr className="border-b text-left">
            <th className="py-2 px-3 text-center">Rank</th>
            <th className="py-2 px-3">Player</th>
            <th className="py-2 px-3">Games</th>
            <th className="py-2 px-3 text-green-600">Wins</th>
            <th className="py-2 px-3 text-red-500">Losses</th>
            <th className="py-2 px-3">Win Rate</th>
            <th className="py-2 px-3">Points</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((p, i) => {
            const total = p.wins + p.losses;
            const rate = total > 0 ? ((p.wins / total) * 100).toFixed(1) : "0";
            return (
              <tr
                key={p.name}
                className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="py-2 px-3 font-medium text-center">
                  {getRankDisplay(i)}
                </td>
                <td className="py-2 px-3">{p.name}</td>
                <td className="py-2 px-3">{total}</td>
                <td className="py-2 px-3 text-green-600">{p.wins}</td>
                <td className="py-2 px-3 text-red-500">{p.losses}</td>
                <td className="py-2 px-3">{rate}%</td>
                <td className="py-2 px-3">{p.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- WINNING PAIRS -------------------- */
const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff7300", // Orange
  "#00c49f", // Teal
  "#d0ed57", // Light Green
  "#a4de6c", // Another Green
  "#bada55", // Even another green
]; // Extend this for more unique colors if needed

function WinningPairs({ games }: { games: any[] }) {
  const pairs: Record<string, number> = {};
  for (const g of games) {
    if (!g.winner) continue;
    const winners = g.winner === "A" ? g.teamAPlayers : g.teamBPlayers;
    if (winners.length === 2) {
      const key = winners.sort().join(" & ");
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }

  const data = Object.entries(pairs)
    .map(([pair, wins]) => ({
      pair,
      wins,
    }))
    .sort((a, b) => b.wins - a.wins);

  if (data.length === 0)
    return (
      <div className="flex items-center justify-center h-[300px] w-full border rounded-md bg-muted/30">
        <p className="text-sm text-muted-foreground">No winning pairs yet.</p>
      </div>
    );

  // Generate a map of pair names to colors for the legend
  const pairColors = new Map<string, string>();
  data.forEach((item, index) => {
    pairColors.set(item.pair, COLORS[index % COLORS.length]);
  });

  return (
    <>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 justify-center text-sm">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <span
              className="inline-block h-3 w-3 rounded-full mr-2"
              style={{ backgroundColor: pairColors.get(entry.pair) }}
            ></span>
            {entry.pair}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="pair"
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
            wrapperClassName="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          />
          <Bar dataKey="wins">
            {data.map((entry, index) => (
              <Bar
                key={`bar-${index}`}
                fill={COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}