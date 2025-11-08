// scripts/backfill-user-links.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orphanMembers = await prisma.teamMember.findMany({
    where: { userId: null },
  });

  for (const m of orphanMembers) {
    let user = await prisma.user.findUnique({ where: { email: m.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: m.email,
          name: m.displayName ?? m.email.split("@")[0],
        },
      });
    }

    await prisma.teamMember.update({
      where: { id: m.id },
      data: {
        userId: user.id,
        displayName: user.name ?? m.displayName ?? undefined,
      },
    });
  }

  console.log(`✅ Backfilled ${orphanMembers.length} team members.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
