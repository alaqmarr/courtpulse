// app/create-team/page.tsx
import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import slugify from "slugify";

export const dynamic = "force-dynamic";

/* ----------------------------- Validation ----------------------------- */
const teamSchema = z.object({
    name: z.string().min(3, "Team name must be at least 3 characters."),
});

/* --------------------------- Server Action ---------------------------- */
async function createTeamAction(formData: FormData) {
    "use server";
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const name = formData.get("name");
    const parse = teamSchema.safeParse({ name });
    if (!parse.success) throw new Error(parse.error.errors[0].message);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new Error("User not found.");

    // ---- Package / Quota Check ----
    if (!["TEAM_PACKAGE", "PRO_PACKAGE"].includes(dbUser.packageType)) {
        throw new Error("Upgrade to a plan that supports team creation.");
    }

    if (dbUser.teamCount >= dbUser.teamQuota) {
        throw new Error("You’ve reached your team quota limit.");
    }

    const slug = slugify(name as string, { lower: true, strict: true });

    // Check for duplicate team slug
    const existing = await prisma.team.findUnique({ where: { slug } });
    if (existing) throw new Error("A team with this name already exists.");

    // ---- Create Team ----
    await prisma.$transaction(async (tx) => {
        await tx.team.create({
            data: {
                name: name as string,
                slug,
                ownerId: dbUser.id,
            },
        });

        await tx.user.update({
            where: { id: dbUser.id },
            data: { teamCount: { increment: 1 } },
        });
    });

    revalidatePath("/");
    redirect(`/team/${slug}`);
}

/* ------------------------------- Page ------------------------------- */
export default async function CreateTeamPage() {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });
    if (!dbUser) redirect("/sign-up");

    const canCreate =
        ["TEAM_PACKAGE", "PRO_PACKAGE"].includes(dbUser.packageType) &&
        dbUser.teamCount < dbUser.teamQuota;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-lg mx-auto p-8">
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Create New Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!canCreate ? (
                            <div className="space-y-4 text-center">
                                {!["TEAM_PACKAGE", "PRO_PACKAGE"].includes(dbUser.packageType) ? (
                                    <>
                                        <p className="text-muted-foreground">
                                            Your current plan doesn’t support team creation.
                                        </p>
                                        <a href="/packages">
                                            <Button className="mt-2">Upgrade Plan</Button>
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground">
                                            You’ve reached your team creation limit ({dbUser.teamQuota}).
                                        </p>
                                        <a href="/packages">
                                            <Button className="mt-2">Increase Quota</Button>
                                        </a>
                                    </>
                                )}
                            </div>
                        ) : (
                            <form
  action={async (formData) => {
    "use server";
    await createTeamAction(formData);
  }}
  className="space-y-5"
>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input
                                        name="name"
                                        id="name"
                                        placeholder="Enter team name"
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    Create Team
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
