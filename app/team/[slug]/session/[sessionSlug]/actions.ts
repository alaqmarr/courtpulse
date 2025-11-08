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

  if (
    (teamAPlayers.length === 1 && teamBPlayers.length !== 1) ||
    (teamAPlayers.length === 2 && teamBPlayers.length !== 2)
  ) {
    throw new Error("Singles require 1 vs 1, doubles require 2 vs 2.");
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
          team: { include: { members: true } },
        },
      },
    },
  });

  if (!game) throw new Error("Game not found.");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only owner can mark winners.");
  if (game.winner) throw new Error("Winner already selected.");

  const teamId = game.session.team.id;
  const winningPlayers =
    winner === "A" ? game.teamAPlayers : game.teamBPlayers;
  const losingPlayers =
    winner === "A" ? game.teamBPlayers : game.teamAPlayers;

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { slug: gameSlug },
      data: { winner },
    });

    for (const email of winningPlayers) {
      const member = await tx.user.findUnique({ where: { email } });
      if (member)
        await tx.user.update({
          where: { id: member.id },
          data: { points: { increment: 10 }, wins: { increment: 1 } },
        });
    }

    for (const email of losingPlayers) {
      const member = await tx.user.findUnique({ where: { email } });
      if (member)
        await tx.user.update({
          where: { id: member.id },
          data: { points: { increment: 2 }, losses: { increment: 1 } },
        });
    }

    const updatePair = async (players: string[], isWinner: boolean) => {
      if (players.length < 2) return;
      const [p1, p2] = players.sort();
      await tx.pairStat.upsert({
        where: { teamId_playerA_playerB: { teamId, playerA: p1, playerB: p2 } },
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
    };

    await updatePair(winningPlayers, true);
    await updatePair(losingPlayers, false);
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* ============================================================
   DELETE GAME + REVERSE STATS
============================================================ */
export async function deleteGameAction(
  teamSlug: string,
  sessionSlug: string,
  gameSlug: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const game = await prisma.game.findUnique({
    where: { slug: gameSlug },
    include: {
      session: { include: { team: { include: { members: true } } } },
    },
  });
  if (!game) throw new Error("Game not found.");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only team owner can delete games.");

  const teamId = game.session.team.id;
  const { teamAPlayers, teamBPlayers, winner } = game;

  await prisma.$transaction(async (tx) => {
    if (winner) {
      const winningPlayers =
        winner === "A" ? teamAPlayers : teamBPlayers;
      const losingPlayers =
        winner === "A" ? teamBPlayers : teamAPlayers;

      for (const email of winningPlayers) {
        const member = await tx.user.findUnique({ where: { email } });
        if (member)
          await tx.user.update({
            where: { id: member.id },
            data: { points: { decrement: 10 }, wins: { decrement: 1 } },
          });
      }

      for (const email of losingPlayers) {
        const member = await tx.user.findUnique({ where: { email } });
        if (member)
          await tx.user.update({
            where: { id: member.id },
            data: { points: { decrement: 2 }, losses: { decrement: 1 } },
          });
      }

      const adjustPair = async (players: string[], isWinner: boolean) => {
        if (players.length < 2) return;
        const [p1, p2] = players.sort();
        const pair = await tx.pairStat.findUnique({
          where: {
            teamId_playerA_playerB: { teamId, playerA: p1, playerB: p2 },
          },
        });
        if (pair)
          await tx.pairStat.update({
            where: { id: pair.id },
            data: {
              plays: { decrement: 1 },
              ...(isWinner ? { wins: { decrement: 1 } } : {}),
            },
          });
      };

      await adjustPair(winningPlayers, true);
      await adjustPair(losingPlayers, false);
    }

    await tx.game.delete({ where: { slug: gameSlug } });
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}