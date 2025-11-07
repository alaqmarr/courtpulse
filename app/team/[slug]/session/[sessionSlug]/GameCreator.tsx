"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition } from "react";
import { createGameAction } from "./actions";
import { toast } from "sonner";

export default function GameCreator({
  teamSlug,
  sessionSlug,
  members,
}: {
  teamSlug: string;
  sessionSlug: string;
  members: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  const handleSelect = (team: "A" | "B", name: string) => {
    if (team === "A") {
      setTeamA((prev) =>
        prev.includes(name)
          ? prev.filter((n) => n !== name)
          : [...prev, name].filter((n) => !teamB.includes(n))
      );
    } else {
      setTeamB((prev) =>
        prev.includes(name)
          ? prev.filter((n) => n !== name)
          : [...prev, name].filter((n) => !teamA.includes(n))
      );
    }
  };

  const validateTeams = () => {
    if (teamA.length === 0 || teamB.length === 0) {
      toast.error("Both teams must have at least one player.");
      return false;
    }

    const total = teamA.length + teamB.length;
    if (![2, 4].includes(total)) {
      toast.error("Singles = 2 players total. Doubles = 4 players total.");
      return false;
    }

    const overlap = teamA.filter((p) => teamB.includes(p));
    if (overlap.length > 0) {
      toast.error(`Players cannot be in both teams: ${overlap.join(", ")}`);
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateTeams()) return;

    startTransition(async () => {
      try {
        await createGameAction(teamSlug, sessionSlug, teamA, teamB);
        toast.success("Game created successfully!");
        setTeamA([]);
        setTeamB([]);
      } catch (err: any) {
        toast.error(err.message || "Error creating game.");
      }
    });
  };

  const handleRandomize = () => {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const a = shuffled.slice(0, mid).map((m) => m.name);
    const b = shuffled.slice(mid).map((m) => m.name);
    setTeamA(a);
    setTeamB(b);
    toast.info(`Teams randomized — A(${a.join(", ")}) | B(${b.join(", ")})`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Team A */}
        <div className="border rounded-lg p-4 shadow-sm bg-card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Team A</h3>
            <Badge variant="outline" className="text-xs">
              {teamA.length} player{teamA.length !== 1 && "s"}
            </Badge>
          </div>
          <div className="space-y-1">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={teamA.includes(m.name)}
                  onChange={() => handleSelect("A", m.name)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        {/* Team B */}
        <div className="border rounded-lg p-4 shadow-sm bg-card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Team B</h3>
            <Badge variant="outline" className="text-xs">
              {teamB.length} player{teamB.length !== 1 && "s"}
            </Badge>
          </div>
          <div className="space-y-1">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={teamB.includes(m.name)}
                  onChange={() => handleSelect("B", m.name)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending} onClick={handleSubmit}>
          {isPending ? "Creating..." : "Create Game"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleRandomize}>
          Randomize Teams
        </Button>
      </div>
    </div>
  );
}
