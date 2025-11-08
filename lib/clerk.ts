import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { execSync } from "child_process";

export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) throw new Error("Email not found on Clerk user");

  try {
    // Try normal path
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email } });

      if (dbUser) {
        // Existing guest user: link Clerk ID
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId: clerkUser.id,
            name: clerkUser.fullName ?? dbUser.name ?? undefined,
            image: clerkUser.imageUrl ?? dbUser.image ?? undefined,
          },
        });
      } else {
        // Fresh user
        dbUser = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email,
            name: clerkUser.fullName ?? undefined,
            image: clerkUser.imageUrl ?? undefined,
            packageType: "FREE",
            teamQuota: 1,
            tournamentQuota: 1,
          },
        });
      }
    }

    // Backfill displayName + link
    await prisma.teamMember.updateMany({
      where: { email },
      data: {
        userId: dbUser.id,
        displayName: clerkUser.fullName ?? dbUser.name ?? undefined,
      },
    });

    return dbUser;
  } catch (err: any) {
    // If schema or table missing, rebuild automatically
    if (
      err.code === "P2021" ||
      err.message?.includes("does not exist") ||
      err.message?.includes("relation") ||
      err.message?.includes("no such table")
    ) {
      console.warn("[⚠️] Database schema missing. Running prisma db push...");
      try {
        execSync("npx prisma db push", { stdio: "inherit" });
        console.log("[✅] Schema recreated successfully.");
      } catch (pushErr: any) {
        console.error("[❌] Failed to run prisma db push:", pushErr);
        throw pushErr;
      }

      // Retry user creation once schema exists
      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email,
            name: clerkUser.fullName ?? undefined,
            image: clerkUser.imageUrl ?? undefined,
            packageType: "FREE",
            teamQuota: 1,
            tournamentQuota: 1,
          },
        });
      }

      await prisma.teamMember.updateMany({
        where: { email },
        data: {
          userId: dbUser.id,
          displayName: clerkUser.fullName ?? dbUser.name ?? undefined,
        },
      });

      return dbUser;
    }

    // Unknown error, rethrow
    console.error("[getOrCreateUser] Fatal error:", err);
    throw err;
  }
}
