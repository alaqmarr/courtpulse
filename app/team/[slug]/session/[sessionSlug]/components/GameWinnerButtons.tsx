"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransition, useState } from "react";
import { setGameWinnerAction } from "../actions";
import { toast } from "sonner";

export default function GameWinnerButtons({
  game,
  teamSlug,
  sessionSlug,
}: {
  game: any;
  teamSlug: string;
  sessionSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [winner, setWinner] = useState(game.winner);

  if (winner) {
    return (
      <Badge variant="default" className="flex items-center gap-1 text-xs">
        🏆 Team {winner} Won
      </Badge>
    );
  }

  const handleClick = (selected: "A" | "B") => {
    startTransition(async () => {
      try {
        await setGameWinnerAction(teamSlug, sessionSlug, game.slug, selected);
        setWinner(selected);
        toast.success(`Points added — Team ${selected} won!`);
      } catch (err: any) {
        toast.error(err.message || "Error updating game.");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() => handleClick("A")}
      >
        {isPending ? "Marking..." : "Team A Won"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() => handleClick("B")}
      >
        {isPending ? "Marking..." : "Team B Won"}
      </Button>
    </div>
  );
}
