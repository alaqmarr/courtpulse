// components/TeamCard.tsx
import React from "react";
import Link from "next/link";

type Team = {
  id: string;
  name: string;
  slug: string;
  members?: { id: string; email: string }[];
};

export default function TeamCard({ team }: { team: Team }) {
  return (
    <div className="rounded-xl border p-5 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{team.name}</h3>
          <div className="text-xs text-muted-foreground">{team.members?.length ?? 0} members</div>
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          <p>Quick stats & last game info here.</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href={`/team/${team.slug}/stats`}>
          <button className="w-full rounded-md border px-3 py-2">Open Team</button>
        </Link>
      </div>
    </div>
  );
}
