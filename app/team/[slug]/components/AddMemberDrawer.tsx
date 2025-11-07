"use client";

import { useState, useTransition } from "react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addTeamMemberAction } from "../actions";

export default function AddMemberDrawer({ teamSlug }: { teamSlug: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      try {
        const email = formData.get("email") as string;
        const displayName = formData.get("displayName") as string;
        await addTeamMemberAction(teamSlug, email, displayName);
        toast.success("Member added successfully");
        setOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Error adding member");
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">+ Add Member</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Team Member</DrawerTitle>
        </DrawerHeader>
        <form
          action={handleAdd}
          className="p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Member Email</Label>
              <Input type="email" name="email" id="email" required placeholder="player@example.com" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input type="text" name="displayName" id="displayName" placeholder="Enter name" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button disabled={isPending} type="submit">
              {isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
