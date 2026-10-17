"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SignOutConfirm } from "./SignOutConfirm";

/** A button, not a link: a GET must not perform a state change. */
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
