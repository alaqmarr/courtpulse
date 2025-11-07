// components/TeamsGrid.tsx
import React from "react";
import TeamCard from "./TeamCard";

type Team = {
  id: string;
  name: string;
  slug: string;
  members?: { id: string; email: string }[];
};

export default function TeamsGrid({ teams }: { teams: Team[] }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">No teams yet — create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((t) => (
        <TeamCard key={t.id} team={t} />
      ))}
    </div>
  );
}
