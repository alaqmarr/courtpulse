// components/HeaderHero.tsx
"use client";
import React from "react";
import { User } from "@/app/prisma/client";
import { motion } from "framer-motion";

type Props = {
  user: User & { teamsOwned?: any[]; tournaments?: any[] };
};

export default function HeaderHero({ user }: Props) {
  const name = user.name ?? user.email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent border"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage teams, schedule sessions, and view analytics — public stats are free for everyone.
          </p>
        </div>

        <div className="flex gap-2">
          <a href="/create-team">
            <button className="rounded-full bg-primary px-4 py-2 text-white">New Team</button>
          </a>
          <a href="/create-tournament">
            <button className="rounded-full border px-4 py-2">New Tournament</button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
