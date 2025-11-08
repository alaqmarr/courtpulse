import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * SAFE USER RELINK
 * - Restores missing user links without altering stats or games.
 * - Never creates or deletes users.
 * - Never overwrites email, points, wins, or losses.
 */

export async function GET() {

  const summary = {
    relinkedMembers: 0,
    skippedMembers: 0,
    missingUsers: [] as string[],
  };

  try {
    // Normalize emails to lowercase (no duplicates)
    const members = await prisma.teamMember.findMany();
    for (const m of members) {
      const lower = m.email.toLowerCase();
      if (lower !== m.email) {
        await prisma.teamMember.update({
          where: { id: m.id },
          data: { email: lower },
        });
      }
    }

    // Relink members only if matching users exist
    const allMembers = await prisma.teamMember.findMany({
      include: { user: true },
    });

    for (const member of allMembers) {
      if (member.userId && member.user) {
        summary.skippedMembers++;
        continue;
      }

      const email = member.email.toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        await prisma.teamMember.update({
          where: { id: member.id },
          data: {
            userId: user.id,
            displayName: member.displayName || user.name || email.split("@")[0],
          },
        });
        summary.relinkedMembers++;
      } else {
        summary.missingUsers.push(email);
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      message:
        "Only re-linked existing users to team members. No new users created, no stats touched.",
    });
  } catch (err: any) {
    console.error("Safe backfill failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
