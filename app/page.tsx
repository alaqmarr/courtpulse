import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import WinRateChart from "@/components/WinRateChart";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TeamStats {
  teamName: string;
  plays: number;
  wins: number;
}

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      teamsOwned: {
        include: {
          members: true,
          sessions: {
            include: {
              games: true,
            },
          },
          tournamentTeams: { 
            include: { 
              tournament: true,
              tournamentGamesA: true,
              tournamentGamesB: true,
            } 
          },
        },
      },
      memberships: {
        include: {
          team: {
            include: {
              members: true,
              sessions: {
                include: {
                  games: true,
                },
              },
              tournamentTeams: { 
                include: { 
                  tournament: true,
                  tournamentGamesA: true,
                  tournamentGamesB: true,
                } 
              },
            },
          },
        },
      },
      tournamentsOwned: {
        include: {
          games: true,
        },
      },
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

  // Calculate real user stats from games
  let totalWins = 0;
  let totalLosses = 0;
  let totalGamesPlayed = 0;

  // Get user's email for matching
  const userEmail = dbUser.email;
  const userDisplayName = dbUser.displayName || dbUser.name;

  // Calculate stats from team sessions (regular games)
  for (const team of allTeams) {
    for (const session of team.sessions || []) {
      for (const game of session.games || []) {
        // Check if user participated in this game
        const isInTeamA = game.teamAPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        const isInTeamB = game.teamBPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );

        if (isInTeamA || isInTeamB) {
          totalGamesPlayed++;
          
          if (game.winner === "A" && isInTeamA) {
            totalWins++;
          } else if (game.winner === "B" && isInTeamB) {
            totalWins++;
          } else if (game.winner && (isInTeamA || isInTeamB)) {
            totalLosses++;
          }
        }
      }
    }
  }

  // Calculate stats from tournament games
  for (const team of allTeams) {
    for (const tournamentTeam of team.tournamentTeams || []) {
      // Games where this team is Team A
      for (const game of tournamentTeam.tournamentGamesA || []) {
        const isInTeamA = game.teamAPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        
        if (isInTeamA && game.winningTeam) {
          totalGamesPlayed++;
          if (game.winningTeam === "A") {
            totalWins++;
          } else if (game.winningTeam === "B") {
            totalLosses++;
          }
        }
      }

      // Games where this team is Team B
      for (const game of tournamentTeam.tournamentGamesB || []) {
        const isInTeamB = game.teamBPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        
        if (isInTeamB && game.winningTeam) {
          totalGamesPlayed++;
          if (game.winningTeam === "B") {
            totalWins++;
          } else if (game.winningTeam === "A") {
            totalLosses++;
          }
        }
      }
    }
  }

  const winRate =
    totalGamesPlayed > 0
      ? ((totalWins / totalGamesPlayed) * 100).toFixed(1)
      : "0";

  // Calculate points (you can adjust the formula as needed)
  const totalPoints = (totalWins * 3) + (totalGamesPlayed * 1);

  const hasTeams = allTeams.length > 0;
  const hasTournaments = allTournaments.length > 0;

  // Prepare team stats for chart
  const teamStats: TeamStats[] = allTeams.map((team) => {
    let teamWins = 0;
    let teamPlays = 0;

    // Count from sessions
    for (const session of team.sessions || []) {
      for (const game of session.games || []) {
        const isInTeamA = game.teamAPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        const isInTeamB = game.teamBPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );

        if (isInTeamA || isInTeamB) {
          teamPlays++;
          if (
            (game.winner === "A" && isInTeamA) ||
            (game.winner === "B" && isInTeamB)
          ) {
            teamWins++;
          }
        }
      }
    }

    // Count from tournament games
    for (const tournamentTeam of team.tournamentTeams || []) {
      for (const game of tournamentTeam.tournamentGamesA || []) {
        const isInTeamA = game.teamAPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        
        if (isInTeamA && game.winningTeam) {
          teamPlays++;
          if (game.winningTeam === "A") {
            teamWins++;
          }
        }
      }

      for (const game of tournamentTeam.tournamentGamesB || []) {
        const isInTeamB = game.teamBPlayers.some(
          (p) => p === userEmail || p === userDisplayName
        );
        
        if (isInTeamB && game.winningTeam) {
          teamPlays++;
          if (game.winningTeam === "B") {
            teamWins++;
          }
        }
      }
    }

    return {
      teamName: team.name,
      plays: teamPlays,
      wins: teamWins,
    };
  });

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

            <div className="flex gap-2 flex-wrap">
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
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Total accumulated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalWins}</p>
              <p className="text-xs text-muted-foreground">Games won</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Losses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalLosses}</p>
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
              <p className="text-3xl font-bold">{allTeams.length}</p>
              <p className="text-xs text-muted-foreground">
                {allTeams.length > 0
                  ? `${allTeams.length} active`
                  : "No teams yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allTournaments.length}</p>
              <p className="text-xs text-muted-foreground">
                {allTournaments.length > 0
                  ? `${allTournaments.length} total`
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
              <DrawerContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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
                            Created {formatInTimeZone(t.createdAt, "Asia/Kolkata", "MMMM dd, yyyy")}
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
              You haven't joined or created any team or tournament. Create one
              now to start tracking stats and leaderboards.
            </AlertDescription>
          </Alert>
        )}

        {/* ---------------- TEAM CARDS ---------------- */}
        {hasTeams && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Teams</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((team) => {
                const teamStat = teamStats.find(ts => ts.teamName === team.name);
                return (
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
                      {teamStat && teamStat.plays > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {teamStat.plays} games · {teamStat.wins} wins
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Link href={`/team/${team.slug}`}>
                        <Button className="w-full" variant="secondary">
                          {user.id === team.ownerId ? "Manage" : "View"}
                        </Button>
                      </Link>
                      <Link href={`/team/${team.slug}/stats`}>
                        <Button className="w-full" variant="outline">
                          View Stats
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
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
                      <span className={`text-xs px-2 py-1 rounded ${
                        t.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}>
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
        {totalGamesPlayed > 0 && teamStats.some(ts => ts.plays > 0) && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              Performance Snapshot
            </h2>
            <div className="rounded-xl border bg-card p-4">
              <div className="h-[300px]">
                <WinRateChart
                  stats={teamStats.filter(ts => ts.plays > 0)}
                />
              </div>
            </div>
          </section>
        )}

        {/* ---------------- RECENT ACTIVITY ---------------- */}
        {totalGamesPlayed === 0 && hasTeams && (
          <Alert>
            <AlertTitle>Ready to play?</AlertTitle>
            <AlertDescription>
              You're part of {allTeams.length} team{allTeams.length > 1 ? 's' : ''} but haven't played any games yet. 
              Start a session to track your performance!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}