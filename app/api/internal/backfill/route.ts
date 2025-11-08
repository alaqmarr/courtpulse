import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
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
          displayName: user.name ?? m.displayName ?? m.email.split("@")[0],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled ${orphanMembers.length} members`,
    });
  } catch (err: any) {
    console.error("Backfill failed", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
