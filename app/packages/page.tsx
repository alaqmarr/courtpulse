// app/packages/page.tsx
import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updatePackageAction } from "@/app/actions/package-actions";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) redirect("/sign-up");

    const currentPlan = dbUser.packageType;

    const packages = [
        {
            type: "FREE",
            title: "Free Plan",
            description: "For casual players exploring the platform.",
            features: [
                "View public stats & leaderboards",
                "Join existing teams (if invited)",
                "Cannot create teams or tournaments",
            ],
            price: "₹0 / forever",
        },
        {
            type: "TEAM_PACKAGE",
            title: "Team Package",
            description: "For groups tracking matches & performance.",
            features: [
                "Create & manage up to 3 teams",
                "Unlimited matches per team",
                "Automatic win-rate analytics",
            ],
            price: "₹499 / month",
        },
        {
            type: "TOURNAMENT_PACKAGE",
            title: "Tournament Package",
            description: "For event organizers managing tournaments.",
            features: [
                "Create up to 2 tournaments",
                "Team & player management",
                "Live leaderboards & brackets",
            ],
            price: "₹999 / month",
        },
        {
            type: "PRO_PACKAGE",
            title: "Pro Package",
            description: "For power users managing both teams and tournaments.",
            features: [
                "Create up to 5 teams",
                "Host up to 5 tournaments",
                "Full analytics dashboard",
                "Priority updates & future beta features",
            ],
            price: "₹1,499 / month",
        },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-6xl mx-auto p-8 space-y-10">
                <header className="text-center space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Choose Your Package
                    </h1>
                    <p className="text-muted-foreground">
                        Upgrade to unlock more teams, tournaments, and insights.
                    </p>
                    <div className="mt-4">
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                            Current Plan: {currentPlan}
                        </Badge>
                    </div>
                </header>

                <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {packages.map((pkg) => {
                        const isActive = currentPlan === pkg.type;

                        // Users can upgrade if they're on a lower tier
                        const upgradablePlans = ["FREE", "TEAM_PACKAGE", "TOURNAMENT_PACKAGE"];
                        const isUpgradable =
                            upgradablePlans.includes(currentPlan) && pkg.type !== "FREE";

                        return (
                            <Card
                                key={pkg.type}
                                className={`border rounded-2xl transition ${isActive
                                        ? "border-primary shadow-lg"
                                        : "hover:shadow-md border-muted"
                                    }`}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-semibold">
                                            {pkg.title}
                                        </CardTitle>
                                        {isActive && (
                                            <Badge variant="default" className="bg-primary text-white">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm mt-2">
                                        {pkg.description}
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <ul className="space-y-1">
                                        {pkg.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center text-sm text-muted-foreground"
                                            >
                                                <span className="h-1.5 w-1.5 bg-primary rounded-full mr-2" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="text-lg font-semibold text-primary mt-4">
                                        {pkg.price}
                                    </div>

                                    {isActive ? (
                                        <Button variant="secondary" className="w-full" disabled>
                                            Current Plan
                                        </Button>
                                    ) : isUpgradable ? (
                                        <form action={updatePackageAction.bind(null, pkg.type as any)}>
                                            <Button type="submit" className="w-full">
                                                Upgrade Now
                                            </Button>
                                        </form>
                                    ) : (
                                        <a href="/contact">
                                            <Button variant="outline" className="w-full">
                                                Contact Us
                                            </Button>
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <footer className="text-center text-sm text-muted-foreground pt-8 border-t">
                    Payments currently handled manually — contact us for activation or Razorpay upgrade.
                </footer>
            </div>
        </main>
    );
}
