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
import LeaderboardCharts from "../../components/LeaderboardCharts";
// Note: 'Tabs' and 'Separator' imports are removed.

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
      (stats.length || 1)) * // Avoid division by zero
    100
  ).toFixed(1); // Changed to 1 decimal for cleaner look

  return (
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

        {/* --- Charts Section (Responsive Grid) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Player Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardCharts stats={stats} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Winning Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <WinningPairs games={games} />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
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
  // Helper to get medal icons for top 3
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
    .sort((a, b) => b.wins - a.wins); // Sort by most wins

  // Sleeker "No data" state
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center h-[300px] w-full border rounded-md bg-muted/30">
        <p className="text-sm text-muted-foreground">No winning pairs yet.</p>
      </div>
    );

  return (
    // Sleek chart styles
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
        <Bar dataKey="wins" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}