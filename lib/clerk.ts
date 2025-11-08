// lib/clerk.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * getOrCreateUser
 * - Called on authenticated requests.
 * - If a Clerk user exists, return the linked DB user.
 * - If an orphan "guest" user with same email exists, link clerkId -> user and backfill relations.
 * - If none exists, create a new User record with clerkId.
 *
 * NOTE: Does NOT change your schema. It uses existing User and TeamMember models.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Email not found on Clerk user");

  // 1) Try find by clerkId
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // 2) If not found, try by email and link (guest -> registered)
  if (!dbUser) {
    dbUser = await prisma.user.findUnique({ where: { email } });

    if (dbUser) {
      // link clerkId, update name/image if missing
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId: clerkUser.id,
          name: dbUser.name ?? clerkUser.fullName ?? undefined,
          image: dbUser.image ?? clerkUser.imageUrl ?? undefined,
        },
      });

      // Backfill orphaned TeamMember rows that were created using email only
      // Only update rows where userId is null.
      await prisma.teamMember.updateMany({
        where: { email, userId: null },
        data: {
          userId: dbUser.id,
          displayName: dbUser.name ?? undefined,
        },
      });

      // If you have other participant tables (tournament participants, etc.),
      // include similar updateMany calls here.
    } else {
      // create a new user record for this clerk user
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          name: clerkUser.fullName ?? undefined,
          image: clerkUser.imageUrl ?? undefined,
        },
      });
    }
  }

  return dbUser;
}
