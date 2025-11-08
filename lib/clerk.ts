// lib/clerk.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const rawEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
  if (!rawEmail) throw new Error("Email not found on Clerk user");

  const email = rawEmail.toLowerCase();

  try {
    // 1) If a user exists with this clerkId → return (update basic fields if missing)
    let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

    if (dbUser) {
      const needsUpdate =
        (clerkUser.fullName && dbUser.name !== clerkUser.fullName) ||
        (clerkUser.imageUrl && dbUser.image !== clerkUser.imageUrl) ||
        dbUser.email !== email;

      if (needsUpdate) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name: clerkUser.fullName ?? dbUser.name,
            image: clerkUser.imageUrl ?? dbUser.image,
            email,
          },
        });
      }
      return dbUser;
    }

    // 2) Try to find by email (existing guest record). If found, link clerkId and update only Clerk fields.
    dbUser = await prisma.user.findUnique({ where: { email } });

    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId: clerkUser.id,
          name: clerkUser.fullName ?? dbUser.name,
          image: clerkUser.imageUrl ?? dbUser.image,
          email, // normalize
        },
      });

      // Backfill teamMember displayName only (non-destructive)
      await prisma.teamMember.updateMany({
        where: { email },
        data: { userId: dbUser.id, displayName: dbUser.name ?? undefined },
      });

      return dbUser;
    }

    // 3) No user exists by clerkId or email -> create new record
    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        name: clerkUser.fullName ?? undefined,
        image: clerkUser.imageUrl ?? undefined,
        packageType: "FREE",
        teamQuota: 1,
        tournamentQuota: 1,
        // stats default to schema defaults; do NOT override existing schema behavior
      },
    });

    return newUser;
  } catch (err: any) {
    // Do NOT attempt to run migrations/db-push here.
    // Surface a clear error for ops; let deploy/ops handle schema tasks.
    console.error("[getOrCreateUser] error:", err?.message ?? err);
    throw err;
  }
}
