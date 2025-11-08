"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { setGameWinnerAction, deleteGameAction } from "./actions";

export default function GamesList({
  games,
  slug,
  sessionSlug,
  canManage,
}: {
  games: any[];
  slug: string;
  sessionSlug: string;
  canManage: boolean;
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
            {games
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((g) => (
                <GameItem
                  key={g.id}
                  g={g}
                  slug={slug}
                  sessionSlug={sessionSlug}
                  canManage={canManage}
                />
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function GameItem({
  g,
  slug,
  sessionSlug,
  canManage,
}: {
  g: any;
  slug: string;
  sessionSlug: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const markWinner = (winner: "A" | "B") => {
    startTransition(async () => {
      await setGameWinnerAction(slug, sessionSlug, g.slug, winner);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteGameAction(slug, sessionSlug, g.slug);
    });
  };

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-2 relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      <div>
        <p className="font-semibold text-sm">{`Game ${g.slug.split("-").slice(-1)}`}</p>
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

      <div className="flex gap-2">
        {canManage && !g.winner && (
          <>
            <Button
              onClick={() => markWinner("A")}
              size="sm"
              variant="secondary"
              disabled={isPending}
            >
              Team A Won
            </Button>
            <Button
              onClick={() => markWinner("B")}
              size="sm"
              variant="secondary"
              disabled={isPending}
            >
              Team B Won
            </Button>
          </>
        )}

        {g.winner && (
          <Badge variant="default" className="text-xs font-semibold">
            {g.winner === "A" ? "Team A Won" : "Team B Won"}
          </Badge>
        )}

        {canManage && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </Button>
        )}
      </div>
    </li>
  );
}