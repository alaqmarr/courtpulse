"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function addTeamMemberAction(
  slug: string,
  email: string,
  displayName?: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({
    where: { slug },
    include: { owner: true, members: true },
  });

  if (!team) throw new Error("Team not found.");
  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can add members.");

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, email },
  });
  if (existingMember) throw new Error("Member already exists in this team.");

  const existingUser = await prisma.user.findUnique({ where: { email } });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      email,
      userId: existingUser?.id ?? null,
      role: "MEMBER",
    },
  });

  // Optionally: update name if provided and user exists but name is null
  if (existingUser && displayName && !existingUser.name) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { name: displayName },
    });
  }

  revalidatePath(`/team/${slug}`);
}

export async function removeTeamMemberAction(slug: string, memberId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found.");
  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can remove members.");

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/team/${slug}`);
}
