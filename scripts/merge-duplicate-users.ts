/**
 * scripts/merge-duplicate-users.ts
 *
 * Merge duplicate User rows that share the same email.
 *
 * WARNING: destructive. BACKUP DB first, test on staging.
 *
 * Run:
 *   npx tsx scripts/merge-duplicate-users.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DELETE_DUPLICATES = true; // set to false to run in "dry-run" mode (will not delete duplicates)

async function getDuplicateEmails() {
  // raw query to find emails with >1 users
  // Postgres: use double quotes for User table if needed
  const rows: Array<{ email: string; count: string }> = await prisma.$queryRaw`
    SELECT email, COUNT(*)::text AS count
    FROM "User"
    GROUP BY email
    HAVING COUNT(*) > 1
  `;
  return rows.map((r) => r.email.toLowerCase());
}

async function mergeForEmail(email: string) {
  console.log("=== Processing", email, "===");
  // fetch users with that email
  const users = await prisma.user.findMany({
    where: { email },
    orderBy: { createdAt: "asc" }, // prefer earliest as fallback
  });

  if (users.length <= 1) {
    console.log("No duplicates for", email);
    return;
  }

  // choose canonical: prefer one with clerkId, else earliest
  let canonical = users.find((u: any) => !!u.clerkId) ?? users[0];
  const duplicates = users.filter((u: any) => u.id !== canonical.id);

  console.log("Canonical user:", canonical.id, canonical.clerkId ? "(has clerkId)" : "", canonical.createdAt);
  console.log("Duplicates:", duplicates.map((d: any) => d.id).join(", "));

  // sum numeric stats from duplicates into canonical
  let aggPoints = canonical.points ?? 0;
  let aggWins = canonical.wins ?? 0;
  let aggLosses = canonical.losses ?? 0;
  let aggTeamCount = canonical.teamCount ?? 0;
  let aggTournamentCount = canonical.tournamentCount ?? 0;

  for (const d of duplicates) {
    aggPoints += d.points ?? 0;
    aggWins += d.wins ?? 0;
    aggLosses += d.losses ?? 0;
    aggTeamCount += d.teamCount ?? 0;
    aggTournamentCount += d.tournamentCount ?? 0;
  }

  // Begin transaction: reassign FKs, then update canonical stats, then optionally delete duplicates
  await prisma.$transaction(async (tx: any) => {
    // 1) Reassign TeamMember rows that point to duplicate user IDs
    for (const d of duplicates) {
      // Set teamMember.userId => canonical.id where userId = dup.id
      await tx.teamMember.updateMany({
        where: { userId: d.id },
        data: { userId: canonical.id },
      });

      // Also update teamMember entries where email matches and userId is null to point to canonical
      await tx.teamMember.updateMany({
        where: { email: email, userId: null },
        data: {
          userId: canonical.id,
          displayName: canonical.displayName ?? canonical.name ?? undefined,
        },
      });

      // 2) Reassign Teams owned by duplicate user
      await tx.team.updateMany({
        where: { ownerId: d.id },
        data: { ownerId: canonical.id },
      });

      // 3) Reassign Tournaments owned by duplicate user
      await tx.tournament.updateMany({
        where: { ownerId: d.id },
        data: { ownerId: canonical.id },
      });

      // 4) Reassign Payments
      await tx.payment.updateMany({
        where: { userId: d.id },
        data: { userId: canonical.id },
      });

      // 5) Reassign Notifications
      await tx.notification.updateMany({
        where: { userId: d.id },
        data: { userId: canonical.id },
      });

      // 6) Reassign Activities
      await tx.activity.updateMany({
        where: { userId: d.id },
        data: { userId: canonical.id },
      });

      // 7) Any other tables referencing userId should be updated similarly.
      // Add custom reassigns here if you have extra relations:
      // e.g. tx.someModel.updateMany({ where: { userId: d.id }, data: { userId: canonical.id }});
    }

    // 8) Update canonical user's basic data if missing (prefer clerk-backed values)
    const updatedData: any = {
      points: aggPoints,
      wins: aggWins,
      losses: aggLosses,
      teamCount: aggTeamCount,
      tournamentCount: aggTournamentCount,
    };

    // Prefer existing canonical clerkId, keep existing name/displayName/image unless missing
    // No overwrites: keep canonical.clerkId if present; if not, pick from duplicates if any has clerkId
    if (!canonical.clerkId) {
      const dupWithClerk = users.find((u: any) => !!u.clerkId);
      if (dupWithClerk) updatedData.clerkId = dupWithClerk.clerkId;
    }

    // Normalize canonical email to lowercase
    updatedData.email = email;

    // If canonical missing displayName/name/image, attempt to fill from duplicates
    if (!canonical.displayName) {
      const fromDup = users.find((u: any) => u.displayName || u.name);
      if (fromDup) updatedData.displayName = fromDup.displayName ?? fromDup.name ?? undefined;
    }
    if (!canonical.name) {
      const fromDup = users.find((u: any) => u.name);
      if (fromDup) updatedData.name = fromDup.name;
    }
    if (!canonical.image) {
      const fromDup = users.find((u: any) => u.image);
      if (fromDup) updatedData.image = fromDup.image;
    }

    await tx.user.update({
      where: { id: canonical.id },
      data: updatedData,
    });

    // 9) Optionally DELETE duplicates
    if (DELETE_DUPLICATES) {
      for (const d of duplicates) {
        // Double-check: don't delete canonical
        if (d.id === canonical.id) continue;
        // Before deleting, ensure no remaining references to d.id exist in key tables
        // We already updated known FK tables; delete user
        await tx.user.delete({ where: { id: d.id } });
        console.log("Deleted duplicate user", d.id);
      }
    } else {
      console.log("Dry-run mode: duplicates not deleted");
    }
  });

  console.log("Merged duplicates for", email);
}

async function main() {
  console.log("MERGE DUPLICATE USERS SCRIPT");
  console.log("Make sure you've backed up your database. Starting...");

  const duplicateEmails = await getDuplicateEmails();
  if (duplicateEmails.length === 0) {
    console.log("No duplicate emails found. Exiting.");
    return;
  }

  console.log("Found", duplicateEmails.length, "emails with duplicates. Sample:", duplicateEmails.slice(0, 5));

  // Loop through emails and merge
  for (const email of duplicateEmails) {
    try {
      await mergeForEmail(email);
    } catch (err) {
      console.error("Failed to merge for", email, err);
    }
  }

  console.log("Merge run completed.");
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
