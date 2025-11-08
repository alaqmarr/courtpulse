import { prisma } from "@/lib/prisma";

let hasRun = false;

export async function ensureUserLinks() {
  if (hasRun) return;
  hasRun = true;

  await prisma.$executeRawUnsafe(`
    UPDATE "TeamMember"
    SET "userId" = u.id,
        "displayName" = COALESCE("TeamMember"."displayName", u.name)
    FROM "User" u
    WHERE "TeamMember"."email" = u.email
      AND "TeamMember"."userId" IS NULL;
  `);

  console.log("🔗 Startup: synced orphan team members to users");
}
