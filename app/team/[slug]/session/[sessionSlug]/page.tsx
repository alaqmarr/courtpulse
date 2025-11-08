import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCreator from "./GameCreator";
import GamesList from "./GameList";
import { formatInTimeZone } from "date-fns-tz";
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
      games: {
        orderBy: { createdAt: "desc" },
      }
    },
  });

  if (!session) notFound();

  const team = session.team;
  const isOwner = team.ownerId === user.id;
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
              {formatInTimeZone(session.createdAt, "Asia/Kolkata", "MMMM dd, yyyy")}
            </p>
          </div>
          {canManage && (
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
          slug={slug}
          sessionSlug={sessionSlug}
          canManage={canManage}
        />
      </div>
    </main>
  );
}