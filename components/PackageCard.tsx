// components/PackageCard.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { upgradePackageAction } from "@/app/actions/upgrade-actions";

interface PackageCardProps {
  title: string;
  description: string;
  features: string[];
  type: "TEAM" | "TOURNAMENT";
  current: boolean;
}

export default function PackageCard({
  title,
  description,
  features,
  type,
  current,
}: PackageCardProps) {
  const [pending, startTransition] = useTransition();

  const onUpgrade = () => {
    startTransition(async () => {
      await upgradePackageAction(type);
    });
  };

  return (
    <div className="rounded-xl border p-6 shadow-sm flex flex-col justify-between bg-card hover:bg-muted transition">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <ul className="text-sm space-y-1 mb-4">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-primary rounded-full" /> {f}
            </li>
          ))}
        </ul>
      </div>
      {current ? (
        <Button disabled variant="secondary" className="w-full">
          Active Plan
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={onUpgrade}
          disabled={pending}
          variant="default"
        >
          {pending ? "Updating..." : "Contact / Upgrade"}
        </Button>
      )}
    </div>
  );
}
