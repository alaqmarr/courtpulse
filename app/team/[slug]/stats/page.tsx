import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PublicTeamHeader from "./components/PublicTeamHeader";
import PublicTeamStats from "./components/PublicTeamStats";

export const dynamic = "force-dynamic";

export default async function TeamStatsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-8 space-y-10">
        <PublicTeamHeader team={team} />
        <Separator />
        <PublicTeamStats team={team} />
      </div>
    </main>
  );
}
