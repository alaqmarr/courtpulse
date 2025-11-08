import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * AUTO BOOTSTRAP ENDPOINT
 *
 * Handles the case where the database has been dropped.
 * 1. Ensures schema is pushed (creates tables)
 * 2. Creates a baseline User record for the current Clerk user
 * 3. Never deletes or overwrites anything
 */

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Step 1: Ensure schema is applied
    try {
      execSync("npx prisma db push", { stdio: "inherit" });
    } catch (err) {
      console.error("Schema push failed:", err);
    }

    // Step 2: Create user if missing
    const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) return NextResponse.json({ error: "No email found" }, { status: 400 });

    let dbUser = await prisma.user.findUnique({ where: { email } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email,
          clerkId: user.id,
          name: user.fullName ?? email.split("@")[0],
          image: user.imageUrl ?? null,
          packageType: "FREE",
          teamQuota: 1,
          tournamentQuota: 1,
        },
      });
    } else if (!dbUser.clerkId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { clerkId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database bootstrapped and user verified",
      user: { id: dbUser.id, email: dbUser.email },
    });
  } catch (err: any) {
    console.error("Bootstrap failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
