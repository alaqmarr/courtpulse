// lib/clerk.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * getOrCreateUser - server-side helper.
 * Uses Clerk's server SDK currentUser() to fetch the authenticated Clerk user,
 * then upserts a corresponding User row in Prisma.
 *
 * Returns null when there is no authenticated Clerk user.
 */
export async function getOrCreateUser() {
  const c = await currentUser();
  if (!c) return null;

  const email = c.emailAddresses?.[0]?.emailAddress ?? "";
  const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();

  // Prefer lookup by clerkId first, then fallback to email upsert
  let user = await prisma.user.findUnique({ where: { clerkId: c.id } });
  if (!user) {
    user = await prisma.user.upsert({
      where: { email },
      update: {
        clerkId: c.id,
        name,
        avatarUrl: c.imageUrl ?? undefined,
      },
      create: {
        clerkId: c.id,
        email,
        name,
        avatarUrl: c.imageUrl ?? undefined,
        packageType: "FREE",
        teamQuota: 0,
        tournamentQuota: 0,
        teamCount: 0,
        tournamentCount: 0,
      },
    });
  } else {
    // Ensure clerkId and avatar are synced if missing/stale
    const needsUpdate =
      user.clerkId !== c.id ||
      (c.imageUrl && user.avatarUrl !== c.imageUrl) ||
      (user.name !== name && !!name);

    if (needsUpdate) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          clerkId: c.id,
          name,
          avatarUrl: c.imageUrl ?? user.avatarUrl,
        },
      });
    }
  }

  return user;
}
