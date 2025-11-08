import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * FULL-DEEP-BACKFILL
 *
 * This endpoint performs an exhaustive repair and synchronization pass:
 * 1. Normalizes all email fields to lowercase.
 * 2. Creates placeholder users where necessary.
 * 3. Links TeamMembers, Payments, Activities, Notifications, etc. to users.
 * 4. Ensures every reference chain (team → owner, member → user, etc.) is intact.
 * 5. Returns detailed JSON summary of all modifications.
 */

export async function GET() {
  try {
    const summary = {
      usersLowercased: 0,
      membersLowercased: 0,
      linkedMembers: 0,
      createdUsers: 0,
      updatedOwners: 0,
      repairedPayments: 0,
      repairedActivities: 0,
      repairedNotifications: 0,
      repairedCalendarRefs: 0,
    };

    // --- 1️⃣ Normalize user emails ---
    const users = await prisma.user.findMany();
    for (const u of users) {
      const lower = u.email.toLowerCase();
      if (lower !== u.email) {
        await prisma.user.update({
          where: { id: u.id },
          data: { email: lower },
        });
        summary.usersLowercased++;
      }
    }

    // --- 2️⃣ Normalize team member emails ---
    const members = await prisma.teamMember.findMany();
    for (const m of members) {
      const lower = m.email.toLowerCase();
      if (lower !== m.email) {
        await prisma.teamMember.update({
          where: { id: m.id },
          data: { email: lower },
        });
        summary.membersLowercased++;
      }
    }

    // --- 3️⃣ Backfill TeamMembers to Users ---
    const allMembers = await prisma.teamMember.findMany({
      include: { user: true },
    });
    for (const member of allMembers) {
      const email = member.email.toLowerCase();

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: member.displayName ?? email.split("@")[0],
          },
        });
        summary.createdUsers++;
      }

      // Update missing linkage and display name
      if (member.userId !== user.id || !member.displayName) {
        await prisma.teamMember.update({
          where: { id: member.id },
          data: {
            userId: user.id,
            displayName: member.displayName || user.name || email.split("@")[0],
          },
        });
        summary.linkedMembers++;
      }
    }

    // --- 4️⃣ Ensure all teams have valid owners ---
    const teams = await prisma.team.findMany({
      include: { owner: true },
    });
    for (const team of teams) {
      const owner = await prisma.user.findUnique({
        where: { id: team.ownerId },
      });
      if (!owner) {
        const placeholderEmail = `owner-${team.id}@placeholder.local`;
        const newOwner = await prisma.user.create({
          data: {
            email: placeholderEmail,
            name: `Placeholder Owner (${team.name})`,
          },
        });
        await prisma.team.update({
          where: { id: team.id },
          data: { ownerId: newOwner.id },
        });
        summary.updatedOwners++;
      }
    }

    // --- 5️⃣ Ensure all tournaments have valid owners ---
    const tournaments = await prisma.tournament.findMany({
      include: { owner: true },
    });
    for (const t of tournaments) {
      const owner = await prisma.user.findUnique({
        where: { id: t.ownerId },
      });
      if (!owner) {
        const placeholderEmail = `tournament-owner-${t.id}@placeholder.local`;
        const newOwner = await prisma.user.create({
          data: {
            email: placeholderEmail,
            name: `Placeholder Owner (${t.name})`,
          },
        });
        await prisma.tournament.update({
          where: { id: t.id },
          data: { ownerId: newOwner.id },
        });
        summary.updatedOwners++;
      }
    }

    // --- 6️⃣ Fix orphaned payments ---
    const payments = await prisma.payment.findMany({
      include: { user: true },
    });
    for (const p of payments) {
      if (!p.user) {
        const email = `payment-${p.id}@placeholder.local`;
        const placeholder = await prisma.user.create({
          data: { email, name: "Payment User" },
        });
        await prisma.payment.update({
          where: { id: p.id },
          data: { userId: placeholder.id },
        });
        summary.repairedPayments++;
      }
    }

    // --- 7️⃣ Fix orphaned activities ---
    const acts = await prisma.activity.findMany({
      include: { user: true },
    });
    for (const a of acts) {
      if (!a.user) {
        const email = `activity-${a.id}@placeholder.local`;
        const placeholder = await prisma.user.create({
          data: { email, name: "Activity User" },
        });
        await prisma.activity.update({
          where: { id: a.id },
          data: { userId: placeholder.id },
        });
        summary.repairedActivities++;
      }
    }

    // --- 8️⃣ Fix orphaned notifications ---
    const notes = await prisma.notification.findMany({
      include: { user: true },
    });
    for (const n of notes) {
      if (!n.user) {
        const email = `notification-${n.id}@placeholder.local`;
        const placeholder = await prisma.user.create({
          data: { email, name: "Notification User" },
        });
        await prisma.notification.update({
          where: { id: n.id },
          data: { userId: placeholder.id },
        });
        summary.repairedNotifications++;
      }
    }

    // --- 9️⃣ Repair calendar events missing valid team/tournament refs ---
    const events = await prisma.calendarEvent.findMany({
      include: { team: true, tournament: true },
    });
    for (const ev of events) {
      let repaired = false;

      if (ev.teamId && !ev.team) {
        await prisma.calendarEvent.update({
          where: { id: ev.id },
          data: { teamId: null },
        });
        repaired = true;
      }

      if (ev.tournamentId && !ev.tournament) {
        await prisma.calendarEvent.update({
          where: { id: ev.id },
          data: { tournamentId: null },
        });
        repaired = true;
      }

      if (repaired) summary.repairedCalendarRefs++;
    }

    // --- ✅ Done ---
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    console.error("Full deep backfill failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
