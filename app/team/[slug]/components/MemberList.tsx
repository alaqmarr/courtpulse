import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeTeamMemberAction } from "../actions";

export default function MemberList({
  members,
  teamSlug,
  isOwner,
}: {
  members: any[];
  teamSlug: string;
  isOwner: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {member.user?.name || member.email.split("@")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </div>
                {isOwner && (
                  <form
                    action={async () => {
                      "use server";
                      await removeTeamMemberAction(teamSlug, member.id);
                    }}
                  >
                    <Button variant="destructive" size="sm">
                      Remove
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
