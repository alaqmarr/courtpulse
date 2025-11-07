"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

export async function createSessionAction(
  slug: string,
  name: string | null,
  date: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found.");

  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can create sessions.");

  // --- Validate date ---
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date format provided.");
  }

  // --- Generate unique session slug ---
  // Include team name or slug + date for semantic uniqueness
  const baseString = `${team.slug}-${parsedDate.toISOString().split("T")[0]}${
    name ? `-${name}` : ""
  }`;
  const sessionSlug = generateSlug(baseString);

  // --- Ensure no collision within same team ---
  const existing = await prisma.session.findUnique({
    where: { id: sessionSlug },
  });
  if (existing)
    throw new Error("A session with a similar identifier already exists.");

  // --- Create Session ---
  await prisma.session.create({
    data: {
      teamId: team.id,
      name: name?.trim() || null,
      id: sessionSlug,
      date: parsedDate,
    },
  });

  revalidatePath(`/team/${slug}`);
}
