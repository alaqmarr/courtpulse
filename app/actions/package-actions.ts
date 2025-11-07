"use server";

import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePackageAction(
  type: "TEAM_PACKAGE" | "TOURNAMENT_PACKAGE" | "PRO_PACKAGE"
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error("User not found.");

  const dataMap = {
    TEAM_PACKAGE: {
      packageType: "TEAM_PACKAGE",
      teamQuota: 3,
      tournamentQuota: 0,
    },
    TOURNAMENT_PACKAGE: {
      packageType: "TOURNAMENT_PACKAGE",
      teamQuota: 0,
      tournamentQuota: 2,
    },
    PRO_PACKAGE: {
      packageType: "PRO_PACKAGE",
      teamQuota: 5,
      tournamentQuota: 5,
    },
  } as const;

  const data = dataMap[type];
  if (!data) throw new Error("Invalid package type.");

  await prisma.user.update({
    where: { id: dbUser.id },
    data,
  });

  revalidatePath("/");
}
