// app/api/clerk/webhook/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic guard: only process user.updated events
    if (body?.type === "user.updated") {
      const user = body.data;
      if (user?.id) {
        await prisma.user.updateMany({
          where: { clerkId: user.id },
          data: {
            name: user.full_name ?? undefined,
            image: user.image_url ?? undefined,
          },
        });
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return new Response("error", { status: 500 });
  }
}
