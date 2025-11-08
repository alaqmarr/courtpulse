// app/page.tsx
import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import WinRateChart from "@/components/WinRateChart";

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      teamsOwned: {
        include: { members: { include: { user: true } } },
      },
      memberships: {
        include: {
          team: {
            include: { members: { include: { user: true } } },
          },
        },
      },
      tournamentsOwned: true,
    },
  });
  if (!dbUser) redirect("/sign-up");

  // Merge owned + member teams (avoid duplicates)
  const ownedTeams = dbUser.teamsOwned || [];
  const memberTeams = dbUser.memberships.map((m) => m.team);
  const allTeams = [
    ...ownedTeams,
    ...memberTeams.filter(
      (t) => !ownedTeams.some((o) => o.id === t.id)
    ),
  ];

  const tournaments = dbUser.tournamentsOwned || [];


  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <section className="rounded-2xl p-6 bg-linear-to-br from-primary/10 to-transparent border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {dbUser.name?.split(" ")[0] ?? dbUser.email}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your teams, track performance, and view public
                statistics. Your analytics are always free.
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

        {/* ---------------- METRICS OVERVIEW ---------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Teams</h3>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dbUser.teamCount}</p>
              <p className="text-xs text-muted-foreground">
                {dbUser.teamCount > 0
                  ? `${dbUser.teamCount} active teams`
                  : "No teams yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Tournaments</h3>
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
              <h3 className="font-semibold">Current Plan</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Current Plan: <span className="font-semibold">{dbUser.packageType}</span>
                {dbUser.packageType === "PRO_PACKAGE" && (
                  <span className="ml-2 text-xs text-primary font-medium">(All features unlocked)</span>
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                Quota: {dbUser.teamQuota} teams · {dbUser.tournamentQuota} tournaments
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ---------------- TEAM + TOURNAMENT DRAWER ---------------- */}
        <section>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Quick Switch</Button>
            </DrawerTrigger>
            <DrawerContent className="p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-lg mb-2">Your Teams</h2>
                {allTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No teams created yet.
                  </p>
                ) : (
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
                )}
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-2">Your Tournaments</h2>
                {tournaments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tournaments hosted yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tournaments.map((t) => (
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
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </section>

        {/* ---------------- TEAMS GRID ---------------- */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold">Your Teams</h2>
            {allTeams.length > 0 && (
              <Link href="/create-team">
                <Button size="sm" variant="outline">
                  + Add Team
                </Button>
              </Link>
            )}
          </div>

          {allTeams.length === 0 ? (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
              You haven’t created any teams yet.{" "}
              <Link href="/create-team" className="underline">
                Create one
              </Link>
              .
            </div>
          ) : (
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
                  <CardContent>
                    <Link href={`/team/${team.slug}/stats`}>
                      <Button className="w-full" variant="secondary">
                        View Stats
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- TOURNAMENTS GRID ---------------- */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold">Your Tournaments</h2>
            {tournaments.length > 0 && (
              <Link href="/create-tournament">
                <Button size="sm" variant="outline">
                  + Add Tournament
                </Button>
              </Link>
            )}
          </div>

          {tournaments.length === 0 ? (
            <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
              You haven’t hosted any tournaments yet.{" "}
              <Link href="/create-tournament" className="underline">
                Start one
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((t) => (
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
                  <CardContent>
                    <Link href={`/tournament/${t.slug}`}>
                      <Button className="w-full" variant="secondary">
                        View Tournament
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- PERFORMANCE CHARTS ---------------- */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">Performance Snapshot</h2>
          <div className="h-[300px]">
            <WinRateChart stats={allTeams.map((t) => ({ teamName: t.name, plays: 5, wins: 3 }))} />
          </div>
        </section>
      </div>
    </main>
  );
}
