"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

export async function createGameAction(
  teamSlug: string,
  sessionSlug: string,
  teamAPlayers: string[],
  teamBPlayers: string[]
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: { team: true },
  });
  if (!session) throw new Error("Session not found.");
  if (session.team.ownerId !== user.id)
    throw new Error("Only owner can create games.");

  const slug = generateSlug(`${sessionSlug}-game`);

  await prisma.game.create({
    data: {
      slug,
      sessionId: session.id,
      teamAPlayers,
      teamBPlayers,
    },
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}



export async function setGameWinnerAction(
  teamSlug: string,
  sessionSlug: string,
  gameSlug: string,
  winner: "A" | "B"
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const game = await prisma.game.findUnique({
    where: { slug: gameSlug },
    include: { session: { include: { team: { include: { members: true } } } } },
  });

  if (!game) throw new Error("Game not found.");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only the team owner can mark winners.");

  if (game.winner) throw new Error("Winner already selected.");

  // Determine winner/loser players
  const winningPlayers =
    winner === "A" ? game.teamAPlayers : game.teamBPlayers;
  const losingPlayers =
    winner === "A" ? game.teamBPlayers : game.teamAPlayers;

  // Update game
  await prisma.game.update({
    where: { slug: gameSlug },
    data: { winner },
  });

  // Update user stats in transaction
  await prisma.$transaction(async (tx) => {
    for (const email of winningPlayers) {
      const member = await tx.user.findUnique({ where: { email } });
      if (member) {
        await tx.user.update({
          where: { id: member.id },
          data: {
            points: { increment: 10 },
            wins: { increment: 1 },
          },
        });
      }
    }

    for (const email of losingPlayers) {
      const member = await tx.user.findUnique({ where: { email } });
      if (member) {
        await tx.user.update({
          where: { id: member.id },
          data: {
            points: { increment: 2 },
            losses: { increment: 1 },
          },
        });
      }
    }
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}
