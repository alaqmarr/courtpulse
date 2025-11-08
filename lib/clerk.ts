import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) throw new Error("Email not found on Clerk user");

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.findUnique({ where: { email } });

    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId: clerkUser.id,
          name: clerkUser.fullName ?? dbUser.name ?? undefined,
          image: clerkUser.imageUrl ?? dbUser.image ?? undefined,
        },
      });
    } else {
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

  // Backfill all TeamMember rows, even if userId exists but missing displayName
  await prisma.teamMember.updateMany({
    where: {
      email,
    },
    data: {
      userId: dbUser.id,
      displayName: clerkUser.fullName ?? dbUser.name ?? undefined,
    },
  });

  return dbUser;
}
