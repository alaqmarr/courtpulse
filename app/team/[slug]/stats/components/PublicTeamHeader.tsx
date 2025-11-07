import { Badge } from "@/components/ui/badge";

export default function PublicTeamHeader({ team }: { team: any }) {
  const totalSessions = team.sessions.length;
  const totalGames = team.sessions.reduce(
    (sum: number, s: any) => sum + s.games.length,
    0
  );

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-sm text-muted-foreground">
          Created by <span className="font-medium">{team.owner.name}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Established on {new Date(team.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Members: {team.members.length}</Badge>
        <Badge variant="outline">Sessions: {totalSessions}</Badge>
        <Badge variant="default">Games: {totalGames}</Badge>
      </div>
    </div>
  );
}
