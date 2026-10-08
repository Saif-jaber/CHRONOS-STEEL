"use client";

import { Button } from "@/components/ui/Button";
import { useSignOut } from "./useSignOut";

/**
 * Sign out.
 *
 * A button rather than a link, because signing out is a state change and a GET
 * must not be able to perform one — the route is a POST for the same reason.
 * The shared hook holds the response-then-navigate contract; this component is
 * only its text-button form for the account page.
 */
export function SignOutButton({ className }: { className?: string }) {
  const { sending, signOut } = useSignOut();

  return (
    <Button type="button" onDark disabled={sending} onClick={signOut} className={className}>
      {sending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
