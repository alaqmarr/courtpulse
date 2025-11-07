// app/team/[slug]/session/new/page.tsx
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionAction } from "./actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const team = await prisma.team.findUnique({ where: { slug: (await params).slug } });
  if (!team) redirect("/");

  const isOwner = team.ownerId === user.id;
  if (!isOwner) redirect(`/team/${(await params).slug}`);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto p-8">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const name = formData.get("name") as string;
                const date = formData.get("date") as string;
                await createSessionAction((await params).slug, name || null, date);
                revalidatePath(`/team/${(await params).slug}`);
                redirect(`/team/${(await params).slug}`);
              }}
              className="space-y-5"
            >
              <div className="flex flex-col space-y-2">
                <Label htmlFor="name">Session Name (optional)</Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="e.g. Sunday Morning Matches"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="date">Session Date</Label>
                <Input
                  type="date"
                  name="date"
                  id="date"
                  required
                  className="cursor-pointer"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Session
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
