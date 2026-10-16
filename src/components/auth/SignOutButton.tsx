"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SignOutConfirm } from "./SignOutConfirm";

/**
 * Sign out.
 *
 * A button rather than a link, because signing out is a state change and a GET
 * must not be able to perform one — the route is a POST for the same reason. It
 * opens the shared confirmation rather than signing out outright, so the account
 * page and the header ask the same question in the same words.
 */
export function SignOutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onDark onClick={() => setOpen(true)} className={className}>
        Sign out
      </Button>
      <SignOutConfirm open={open} onCancel={() => setOpen(false)} />
    </>
  );
}
