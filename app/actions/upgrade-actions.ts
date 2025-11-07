"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

/**
 * upgradePackageAction – toggles user's package and initial quotas
 * type = "TEAM" or "TOURNAMENT"
 */
export async function upgradePackageAction(type: "TEAM" | "TOURNAMENT") {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  if (type === "TEAM") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        packageType: "TEAM_PACKAGE",
        teamQuota: { increment: 1 },
      },
    });
  } else if (type === "TOURNAMENT") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        packageType: "TOURNAMENT_PACKAGE",
        tournamentQuota: { increment: 1 },
      },
    });
  }

  revalidatePath("/");
}
