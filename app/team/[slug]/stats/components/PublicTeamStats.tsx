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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LeaderboardCharts from "../../components/LeaderboardCharts";

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
    ) / stats.length) * 100
  ).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Statistics & Analytics</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
          <div className="p-3 rounded-md border">
            <p className="text-sm text-muted-foreground">Top Player</p>
            <p className="text-lg font-semibold">{topPlayer?.name || "N/A"}</p>
          </div>
          <div className="p-3 rounded-md border">
            <p className="text-sm text-muted-foreground">Avg Win Rate</p>
            <p className="text-lg font-semibold">{avgWinRate}%</p>
          </div>
          <div className="p-3 rounded-md border">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-lg font-semibold">{games.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard-chart">
              Leaderboard (Chart)
            </TabsTrigger>
            <TabsTrigger value="leaderboard-table">
              Leaderboard (Table)
            </TabsTrigger>
            <TabsTrigger value="pairs">Winning Pairs</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="wins" fill="#4ade80" />
                <Bar dataKey="losses" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Leaderboard Chart */}
          <TabsContent value="leaderboard-chart">
            <LeaderboardCharts stats={stats} />
          </TabsContent>

          {/* Leaderboard Table */}
          <TabsContent value="leaderboard-table">
            <LeaderboardTable stats={stats} />
          </TabsContent>

          {/* Winning Pairs */}
          <TabsContent value="pairs">
            <WinningPairs games={games} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* -------------------- COMPUTATION -------------------- */
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
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/50">
          <tr className="border-b text-left">
            <th className="py-2 px-3">Rank</th>
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
                className="border-b hover:bg-muted/30 transition-colors"
              >
                <td className="py-2 px-3 font-medium">{i + 1}</td>
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

  const data = Object.entries(pairs).map(([pair, wins]) => ({
    pair,
    wins,
  }));

  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No winning pairs yet.
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="pair" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="wins" fill="#60a5fa" />
      </BarChart>
    </ResponsiveContainer>
  );
}
