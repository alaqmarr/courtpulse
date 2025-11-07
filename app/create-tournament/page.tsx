// app/create-tournament/page.tsx
import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import slugify from "slugify";

export const dynamic = "force-dynamic";

/* -------------------------- Validation Schema -------------------------- */
const tournamentSchema = z.object({
    name: z.string().min(3, "Tournament name must be at least 3 characters."),
    minGamesPerPlayer: z
        .string()
        .regex(/^\d+$/, "Must be a number.")
        .transform((v) => parseInt(v, 10)),
    bannerUrl: z.string().url("Invalid URL.").optional().or(z.literal("")),
});

/* -------------------------- Server Action ----------------------------- */
async function createTournamentAction(formData: FormData) {
    "use server";

    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const name = formData.get("name");
    const minGamesPerPlayer = formData.get("minGamesPerPlayer");
    const bannerUrl = formData.get("bannerUrl") || "";

    const parsed = tournamentSchema.safeParse({
        name,
        minGamesPerPlayer,
        bannerUrl,
    });
    if (!parsed.success) throw new Error(parsed.error.errors[0].message);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new Error("User not found.");

    // ---- Plan Enforcement ----
    if (!["TOURNAMENT_PACKAGE", "PRO_PACKAGE"].includes(dbUser.packageType)) {
        throw new Error("Upgrade to a plan that supports tournament creation.");
    }

    if (dbUser.tournamentCount >= dbUser.tournamentQuota) {
        throw new Error("You’ve reached your tournament creation quota.");
    }

    const slug = slugify(name as string, { lower: true, strict: true });

    const existing = await prisma.tournament.findUnique({ where: { slug } });
    if (existing) throw new Error("A tournament with this name already exists.");

    // ---- Transaction: Create Tournament + Increment Count ----
    await prisma.$transaction(async (tx) => {
        await tx.tournament.create({
            data: {
                name: name as string,
                slug,
                ownerId: dbUser.id,
                bannerUrl: bannerUrl as string,
                minGamesPerPlayer: parsed.data.minGamesPerPlayer,
            },
        });

        await tx.user.update({
            where: { id: dbUser.id },
            data: { tournamentCount: { increment: 1 } },
        });
    });

    revalidatePath("/");
    redirect("/");
}

/* ----------------------------- Page ----------------------------- */
export default async function CreateTournamentPage() {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });
    if (!dbUser) redirect("/sign-up");

    const canCreate =
        ["TOURNAMENT_PACKAGE", "PRO_PACKAGE"].includes(dbUser.packageType) &&
        dbUser.tournamentCount < dbUser.tournamentQuota;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-lg mx-auto p-8">
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle>Create New Tournament</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {!canCreate ? (
                            <div className="space-y-4 text-center">
                                {!["TOURNAMENT_PACKAGE", "PRO_PACKAGE"].includes(
                                    dbUser.packageType
                                ) ? (
                                    <>
                                        <p className="text-muted-foreground">
                                            Your current plan doesn’t support tournament creation.
                                        </p>
                                        <a href="/packages">
                                            <Button className="mt-2">Upgrade Plan</Button>
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground">
                                            You’ve reached your tournament limit (
                                            {dbUser.tournamentQuota}).
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
                                    try {
                                        await createTournamentAction(formData);
                                    } catch (err: any) {
                                        throw new Error(err.message);
                                    }
                                }}
                                className="space-y-5"
                            >
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="name">Tournament Name</Label>
                                    <Input
                                        name="name"
                                        id="name"
                                        placeholder="Enter tournament name"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="minGamesPerPlayer">
                                        Minimum Games per Player
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        name="minGamesPerPlayer"
                                        id="minGamesPerPlayer"
                                        placeholder="e.g. 2"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="bannerUrl">Banner URL (optional)</Label>
                                    <Input
                                        name="bannerUrl"
                                        id="bannerUrl"
                                        placeholder="https://example.com/banner.jpg"
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    Create Tournament
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
