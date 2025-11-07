import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionsList({
  sessions,
  teamSlug,
  isOwner,
}: {
  sessions: any[];
  teamSlug: string;
  isOwner: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Sessions</CardTitle>
        {isOwner && (
          <Button asChild size="sm" variant="secondary">
            <a href={`/team/${teamSlug}/session/new`}>+ New Session</a>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions created yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex justify-between items-center px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{s.name || "Unnamed Session"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.date).toLocaleDateString()}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={`/team/${teamSlug}/session/${s.slug}`}>View</a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
