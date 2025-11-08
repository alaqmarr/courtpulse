// app/team/[slug]/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

/**
 * Adds a team member by email. Creates a placeholder User if none exists,
 * then creates TeamMember with userId and displayName set.
 */
export async function addTeamMemberAction(
  slug: string,
  email: string,
  displayName?: string
) {
  const current = await getOrCreateUser();
  if (!current) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found");

  if (team.ownerId !== current.id)
    throw new Error("Only the team owner can add members.");

  // Prevent duplicates
  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, email },
  });
  if (existingMember) throw new Error("Member already exists");

  // Ensure User exists (or create placeholder)
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: displayName ?? undefined },
    });
  }

  // Create the member with displayName
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      email : email.toLowerCase(),
      userId: user.id,
      role: "MEMBER",
      displayName: displayName ?? user.name ?? email.split("@")[0],
    },
  });

  revalidatePath(`/team/${slug}`);
}

/* ---------------- Remove Team Member ---------------- */
export async function removeTeamMemberAction(slug: string, memberId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can remove members.");

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/team/${slug}`);
}
