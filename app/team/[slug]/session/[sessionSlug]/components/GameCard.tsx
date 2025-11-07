import { Badge } from "@/components/ui/badge";
import GameWinnerButtons from "./GameWinnerButtons";

export default function GameCard({
  game,
  teamSlug,
  sessionSlug,
  isOwner,
}: {
  game: any;
  teamSlug: string;
  sessionSlug: string;
  isOwner: boolean;
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-2">
      <div>
        <p className="font-semibold text-sm">
          {`Game ${game.slug.split("-").slice(-1)}`}
        </p>
        <div className="text-xs mt-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                game.winner === "A"
                  ? "default"
                  : game.winner
                  ? "outline"
                  : "secondary"
              }
            >
              Team A
            </Badge>
            <span>{game.teamAPlayers.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                game.winner === "B"
                  ? "default"
                  : game.winner
                  ? "outline"
                  : "secondary"
              }
            >
              Team B
            </Badge>
            <span>{game.teamBPlayers.join(", ")}</span>
          </div>
        </div>
      </div>

      {isOwner && (
        <GameWinnerButtons
          teamSlug={teamSlug}
          sessionSlug={sessionSlug}
          game={game}
        />
      )}
    </li>
  );
}
