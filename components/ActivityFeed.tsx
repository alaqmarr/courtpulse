// components/ActivityFeed.tsx
import React from "react";

export default function ActivityFeed({ games }: { games: any[] }) {
  if (!games || games.length === 0) {
    return <div className="rounded-xl border p-4 text-sm text-muted-foreground">No recent activity.</div>;
  }

  return (
    <div className="space-y-2">
      {games.map((g) => (
        <div key={g.id} className="rounded-md border p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">
              {g.session?.name ?? "Session"} — {g.gameType}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(g.createdAt).toLocaleString()} · Result: {g.winningTeam ?? "Pending"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Team vs Team</div>
        </div>
      ))}
    </div>
  );
}
