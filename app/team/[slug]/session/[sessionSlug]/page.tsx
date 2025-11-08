import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setGameWinnerAction } from "./actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GameCreator from "./GameCreator";

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
        include: {
          owner: true,
          members: { include: { user: true } },
        },
      },
      games: true,
    },
  });

  if (!session) notFound();

  const team = session.team;
  const isOwner = team.ownerId === user.id;
  const isMember = team.members.some((m) => m.userId === user.id);
  const canManage = isOwner;

  const members = team.members.map((m) => ({
    id: m.id,
    name: m.user?.name || m.email.split("@")[0],
    email: m.email,
    displayName: m.displayName || m.user?.name || m.email.split("@")[0],
  }));

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
          {canManage && (
            <Button asChild variant="secondary">
              <a href={`/team/${slug}`}>Back to Team</a>
            </Button>
          )}
        </header>

        {/* ----------- NEW GAME FORM ----------- */}
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

        {/* ----------- GAMES LIST ----------- */}
        <Card>
          <CardHeader>
            <CardTitle>Games Played</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.games.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No games created yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border">
                {session.games
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((g) => (
                    <li
                      key={g.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-2"
                    >
                      <div>
                        <p className="font-semibold text-sm">
                          {`Game ${g.slug.split("-").slice(-1)}`}
                        </p>
                        <div className="text-xs mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                g.winner === "A"
                                  ? "default"
                                  : g.winner
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              Team A
                            </Badge>
                            <span>{g.teamAPlayers.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                g.winner === "B"
                                  ? "default"
                                  : g.winner
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              Team B
                            </Badge>
                            <span>{g.teamBPlayers.join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* ----------- WINNER BUTTONS (Owner/Member Access) ----------- */}
                      {canManage && !g.winner && (
                        <form
                          action={async (formData) => {
                            "use server";
                            const winner = formData.get("winner") as "A" | "B";
                            await setGameWinnerAction(
                              slug,
                              sessionSlug,
                              g.slug,
                              winner
                            );
                            revalidatePath(`/team/${slug}/session/${sessionSlug}`);
                          }}
                        >
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              name="winner"
                              value="A"
                              size="sm"
                              variant="secondary"
                            >
                              Team A Won
                            </Button>
                            <Button
                              type="submit"
                              name="winner"
                              value="B"
                              size="sm"
                              variant="secondary"
                            >
                              Team B Won
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* ----------- WINNER BADGE (No Access / Already Marked) ----------- */}
                      {g.winner && (
                        <Badge
                          variant="default"
                          className="text-xs font-semibold"
                        >
                          {g.winner === "A" ? "Team A Won" : "Team B Won"}
                        </Badge>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
