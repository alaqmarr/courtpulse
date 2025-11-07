import GameCard from "./GameCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function GamesList({
  games,
  teamSlug,
  sessionSlug,
  isOwner,
}: {
  games: any[];
  teamSlug: string;
  sessionSlug: string;
  isOwner: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Games Played</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games created yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border">
            {games.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                teamSlug={teamSlug}
                sessionSlug={sessionSlug}
                isOwner={isOwner}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
