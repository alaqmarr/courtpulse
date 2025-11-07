import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import GameCreator from "./GameCreator";
import GamesList from "./components/GamesList";
import LeaderboardTable from "./components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ slug: string; sessionSlug: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const { slug, sessionSlug } = await params;

  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: {
      team: {
        include: { members: { include: { user: true } } },
      },
      games: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!session) notFound();

  const isOwner = session.team.ownerId === user.id;
  const members = session.team.members.map((m) => ({
    id: m.id,
    name: m.user?.name || m.email.split("@")[0],
  }));

  const leaderboard = computeLeaderboard(session.games);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{session.name || "Session"}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(session.date).toLocaleDateString()}
            </p>
          </div>
          {isOwner && (
            <Button asChild variant="secondary">
              <a href={`/team/${slug}`}>Back to Team</a>
            </Button>
          )}
        </header>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>New Game</CardTitle>
            </CardHeader>
            <CardContent>
              <GameCreator
                teamSlug={slug}
                sessionSlug={sessionSlug}
                members={members}
              />
            </CardContent>
          </Card>
        )}

        <GamesList
          games={session.games}
          teamSlug={slug}
          sessionSlug={sessionSlug}
          isOwner={isOwner}
        />

        {leaderboard.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Session Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable leaderboard={leaderboard} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

/* ------------------- Helper ------------------- */
function computeLeaderboard(games: any[]) {
  const stats: Record<
    string,
    { name: string; wins: number; losses: number; points: number }
  > = {};

  for (const g of games) {
    const allPlayers = [...g.teamAPlayers, ...g.teamBPlayers];
    for (const name of allPlayers) {
      if (!stats[name]) stats[name] = { name, wins: 0, losses: 0, points: 0 };
    }

    if (!g.winner) continue;

    const winners = g.winner === "A" ? g.teamAPlayers : g.teamBPlayers;
    const losers = g.winner === "A" ? g.teamBPlayers : g.teamAPlayers;

    for (const name of winners) {
      stats[name].wins++;
      stats[name].points += 10;
    }

    for (const name of losers) {
      stats[name].losses++;
      stats[name].points += 2;
    }
  }

  return Object.values(stats).sort(
    (a, b) =>
      b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name)
  );
}
