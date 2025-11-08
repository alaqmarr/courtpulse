import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import WinRateChart from "@/components/WinRateChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      teamsOwned: {
        include: {
          members: true,
          tournamentTeams: { include: { tournament: true } },
        },
      },
      memberships: {
        include: {
          team: {
            include: {
              members: true,
              tournamentTeams: { include: { tournament: true } },
            },
          },
        },
      },
      tournamentsOwned: true,
    },
  });

  if (!dbUser) redirect("/sign-up");

  const ownedTeams = dbUser.teamsOwned || [];
  const memberTeams = dbUser.memberships.map((m) => m.team);
  const allTeams = [
    ...ownedTeams,
    ...memberTeams.filter((t) => !ownedTeams.some((o) => o.id === t.id)),
  ];

  const hostedTournaments = dbUser.tournamentsOwned || [];
  const participatedTournaments = [
    ...new Map(
      allTeams
        .flatMap((t) => t.tournamentTeams.map((tt) => tt.tournament))
        .filter(Boolean)
        .map((t) => [t.id, t])
    ).values(),
  ];
  const allTournaments = [
    ...hostedTournaments,
    ...participatedTournaments.filter(
      (p) => !hostedTournaments.some((h) => h.id === p.id)
    ),
  ];

  const totalGamesPlayed =
    dbUser.wins + dbUser.losses || 0;
  const winRate =
    totalGamesPlayed > 0
      ? ((dbUser.wins / totalGamesPlayed) * 100).toFixed(1)
      : "0";

  const hasTeams = allTeams.length > 0;
  const hasTournaments = allTournaments.length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        {/* ---------------- HEADER ---------------- */}
        <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {dbUser.name?.split(" ")[0] ?? dbUser.email}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your progress, manage your teams, and stay ahead of every
                game.
              </p>
            </div>

            <div className="flex gap-2">
              <Link href="/create-team">
                <Button variant="default">New Team</Button>
              </Link>
              <Link href="/create-tournament">
                <Button variant="outline">New Tournament</Button>
              </Link>
              <Link href="/packages">
                <Button variant="secondary">View Packages</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- USER STATS ---------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.points}</p>
              <p className="text-xs text-muted-foreground">Total accumulated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.wins}</p>
              <p className="text-xs text-muted-foreground">Games won</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Losses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.losses}</p>
              <p className="text-xs text-muted-foreground">Games lost</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Overall ratio</p>
            </CardContent>
          </Card>
        </section>

        {/* ---------------- PLAN INFO ---------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.teamCount}</p>
              <p className="text-xs text-muted-foreground">
                {dbUser.teamCount > 0
                  ? `${dbUser.teamCount} active`
                  : "No teams yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.tournamentCount}</p>
              <p className="text-xs text-muted-foreground">
                {dbUser.tournamentCount > 0
                  ? `${dbUser.tournamentCount} hosted`
                  : "No tournaments yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                <span className="font-semibold">{dbUser.packageType}</span>{" "}
                plan
              </p>
              <p className="text-xs text-muted-foreground">
                {dbUser.teamQuota} teams · {dbUser.tournamentQuota} tournaments
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ---------------- QUICK SWITCH ---------------- */}
        {(hasTeams || hasTournaments) && (
          <section>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary">Quick Switch</Button>
              </DrawerTrigger>
              <DrawerContent className="p-6 space-y-6">
                {hasTeams && (
                  <div>
                    <h2 className="font-semibold text-lg mb-2">Your Teams</h2>
                    <div className="space-y-2">
                      {allTeams.map((team) => (
                        <Link
                          key={team.id}
                          href={`/team/${team.slug}/stats`}
                          className="block border rounded-md p-3 hover:bg-muted transition"
                        >
                          <div className="font-medium">{team.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {team.members.length} members
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {hasTournaments && (
                  <div>
                    <h2 className="font-semibold text-lg mb-2">
                      Your Tournaments
                    </h2>
                    <div className="space-y-2">
                      {allTournaments.map((t) => (
                        <Link
                          key={t.id}
                          href={`/tournament/${t.slug}`}
                          className="block border rounded-md p-3 hover:bg-muted transition"
                        >
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Created {t.createdAt.toLocaleDateString()}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </DrawerContent>
            </Drawer>
          </section>
        )}

        {/* ---------------- EMPTY STATES ---------------- */}
        {!hasTeams && !hasTournaments && (
          <Alert>
            <AlertTitle>No activity yet</AlertTitle>
            <AlertDescription>
              You haven’t joined or created any team or tournament. Create one
              now to start tracking stats and leaderboards.
            </AlertDescription>
          </Alert>
        )}

        {/* ---------------- TEAM CARDS ---------------- */}
        {hasTeams && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Teams</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((team) => (
                <Card
                  key={team.id}
                  className="hover:shadow-lg transition border rounded-xl"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{team.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {team.members.length} members
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Link href={`/team/${team.slug}`}>
                      <Button className="w-full" variant="secondary">
                        {user.id === team.ownerId ? "Manage" : "View"}
                      </Button>
                    </Link>
                    <Link href={`/team/${team.slug}/stats`}>
                      <Button className="w-full" variant="secondary">
                        View Stats
                      </Button>
                    </Link>
                    
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- TOURNAMENTS ---------------- */}
        {hasTournaments && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Tournaments</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTournaments.map((t) => (
                <Card
                  key={t.id}
                  className="hover:shadow-lg transition border rounded-xl"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{t.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {t.isActive ? "Active" : "Completed"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Link href={`/tournament/${t.slug}`}>
                      <Button className="w-full" variant="secondary">
                        {user.id === t.ownerId ? "Manage Tournament" : "View Tournament"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- PERFORMANCE CHART ---------------- */}
        {(dbUser.wins > 0 || dbUser.losses > 0) && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              Performance Snapshot
            </h2>
            <div className="rounded-xl border bg-card p-4">
              <div className="h-[300px]">
                <WinRateChart
                  stats={allTeams.map((t) => ({
                    teamName: t.name,
                    plays: t.gamesPlayed || 5,
                    wins: t.gamesWon || 3,
                  }))}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
