"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

/* ============================================================
   CREATE GAME
============================================================ */
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

  // Basic badminton logic validation
  if (
    (teamAPlayers.length === 1 && teamBPlayers.length !== 1) ||
    (teamAPlayers.length === 2 && teamBPlayers.length !== 2)
  ) {
    throw new Error("Singles require 1 vs 1, doubles require 2 vs 2 players.");
  }

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

/* ============================================================
   SET GAME WINNER + UPDATE PLAYER + PAIR STATS
============================================================ */
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
    include: {
      session: {
        include: {
          team: {
            include: {
              members: true,
            },
          },
        },
      },
    },
  });

  if (!game) throw new Error("Game not found.");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only the team owner can mark winners.");
  if (game.winner) throw new Error("Winner already selected.");

  const team = game.session.team;
  const teamId = team.id;

  const winningPlayers =
    winner === "A" ? game.teamAPlayers : game.teamBPlayers;
  const losingPlayers =
    winner === "A" ? game.teamBPlayers : game.teamAPlayers;

  /* ---------------- Transaction ---------------- */
  await prisma.$transaction(async (tx) => {
    // Mark game winner
    await tx.game.update({
      where: { slug: gameSlug },
      data: { winner },
    });

    // Update player stats
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

    // Update PairStat for both sides
    const updatePair = async (players: string[], isWinner: boolean) => {
      if (players.length < 2) return;

      const [p1, p2] = players.sort();
      const pair = await tx.pairStat.upsert({
        where: {
          teamId_playerA_playerB: {
            teamId,
            playerA: p1,
            playerB: p2,
          },
        },
        update: {
          plays: { increment: 1 },
          ...(isWinner ? { wins: { increment: 1 } } : {}),
        },
        create: {
          teamId,
          playerA: p1,
          playerB: p2,
          plays: 1,
          wins: isWinner ? 1 : 0,
        },
      });
      return pair;
    };

    await updatePair(winningPlayers, true);
    await updatePair(losingPlayers, false);
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}
