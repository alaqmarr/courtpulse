// components/RightDrawer.tsx
"use client";
import React from "react";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RightDrawer({ teams, tournaments }: any) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open</Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">Quick Switch</h3>

        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium mb-1">Teams</div>
            <div className="space-y-2">
              {teams.length === 0 && <div className="text-sm text-muted-foreground">No teams</div>}
              {teams.map((t: any) => (
                <Link key={t.id} href={`/team/${t.slug}/stats`} className="block rounded-md p-2 hover:bg-muted">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.members?.length ?? 0}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-1">Tournaments</div>
            {tournaments.length === 0 && <div className="text-sm text-muted-foreground">No tournaments</div>}
            {tournaments.map((tr: any) => (
              <Link key={tr.id} href={`/tournament/${tr.slug}`} className="block rounded-md p-2 hover:bg-muted">
                <div className="text-sm">{tr.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
