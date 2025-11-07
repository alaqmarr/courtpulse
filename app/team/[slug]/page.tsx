import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MemberList from "./components/MemberList";
import SessionsList from "./components/SessionsList";
import AddMemberDrawer from "./components/AddMemberDrawer";
import TeamAnalytics from "./components/TeamAnalytics";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      owner: true,
      members: { include: { user: true } },
      sessions: {
        include: { games: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!team) notFound();

  const isOwner = team.ownerId === user.id;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>

          {isOwner && (
            <AddMemberDrawer teamSlug={team.slug} />
          )}
        </div>

        <Separator />

        {/* Members Section */}
        <MemberList members={team.members} teamSlug={team.slug} isOwner={isOwner} />

        {/* Sessions Section */}
        <SessionsList sessions={team.sessions} teamSlug={team.slug} isOwner={isOwner} />

        {/* Analytics Section */}
        <TeamAnalytics team={team} />
      </div>
    </main>
  );
}
